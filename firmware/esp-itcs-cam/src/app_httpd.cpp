#include "Arduino.h"
#include <WiFi.h>
#include "esp_http_server.h"
#include "esp_timer.h"
#include "esp_camera.h"
#include "img_converters.h"
#include "fb_gfx.h"
#include "esp32-hal-ledc.h"
#include "sdkconfig.h"
#include "camera_index.h"
#include "board_config.h"

#if defined(ARDUINO_ARCH_ESP32) && defined(CONFIG_ARDUHAL_ESP_LOG)
#include "esp32-hal-log.h"
#endif

// Forward declarations from main.cpp
unsigned long getBootTime();
bool isWifiConnected();

#if defined(LED_GPIO_NUM)
#define CONFIG_LED_MAX_INTENSITY 255
int led_duty = 0;
bool isStreaming = false;
#endif

typedef struct {
  httpd_req_t *req;
  size_t len;
} jpg_chunking_t;

#define PART_BOUNDARY "123456789000000000000987654321"
static const char *_STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char *_STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char *_STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\nX-Timestamp: %d.%06d\r\n\r\n";

httpd_handle_t camera_httpd = NULL;

typedef struct {
  size_t size;
  size_t index;
  size_t count;
  int sum;
  int *values;
} ra_filter_t;

static ra_filter_t ra_filter;

static ra_filter_t *ra_filter_init(ra_filter_t *filter, size_t sample_size) {
  memset(filter, 0, sizeof(ra_filter_t));
  filter->values = (int *)malloc(sample_size * sizeof(int));
  if (!filter->values) {
    return NULL;
  }
  memset(filter->values, 0, sample_size * sizeof(int));
  filter->size = sample_size;
  return filter;
}

#if ARDUHAL_LOG_LEVEL >= ARDUHAL_LOG_LEVEL_INFO
static int ra_filter_run(ra_filter_t *filter, int value) {
  if (!filter->values) {
    return value;
  }
  filter->sum -= filter->values[filter->index];
  filter->values[filter->index] = value;
  filter->sum += filter->values[filter->index];
  filter->index++;
  filter->index = filter->index % filter->size;
  if (filter->count < filter->size) {
    filter->count++;
  }
  return filter->sum / filter->count;
}
#endif

#if defined(LED_GPIO_NUM)
void enable_led(bool en) {
  int duty = en ? led_duty : 0;
  if (en && isStreaming && (led_duty > CONFIG_LED_MAX_INTENSITY)) {
    duty = CONFIG_LED_MAX_INTENSITY;
  }
  ledcWrite(0, duty);
  log_i("Set LED intensity to %d", duty);
}
#endif

static void addCorsHeaders(httpd_req_t *req) {
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Headers", "Content-Type");
}

static size_t jpg_encode_stream(void *arg, size_t index, const void *data, size_t len) {
  jpg_chunking_t *j = (jpg_chunking_t *)arg;
  if (!index) {
    j->len = 0;
  }
  if (httpd_resp_send_chunk(j->req, (const char *)data, len) != ESP_OK) {
    return 0;
  }
  j->len += len;
  return len;
}

static esp_err_t capture_handler(httpd_req_t *req) {
  camera_fb_t *fb = NULL;
  esp_err_t res = ESP_OK;

#if defined(LED_GPIO_NUM)
  enable_led(true);
  vTaskDelay(150 / portTICK_PERIOD_MS);
  fb = esp_camera_fb_get();
  enable_led(false);
#else
  fb = esp_camera_fb_get();
#endif

  if (!fb) {
    log_e("Camera capture failed");
    httpd_resp_send_500(req);
    return ESP_FAIL;
  }

  httpd_resp_set_type(req, "image/jpeg");
  httpd_resp_set_hdr(req, "Content-Disposition", "inline; filename=capture.jpg");
  addCorsHeaders(req);

  char ts[32];
  snprintf(ts, 32, "%" PRIu32 ".%06" PRIu32, (uint32_t)fb->timestamp.tv_sec, (uint32_t)fb->timestamp.tv_usec);
  httpd_resp_set_hdr(req, "X-Timestamp", (const char *)ts);

  if (fb->format == PIXFORMAT_JPEG) {
    res = httpd_resp_send(req, (const char *)fb->buf, fb->len);
  } else {
    jpg_chunking_t jchunk = {req, 0};
    res = frame2jpg_cb(fb, 80, jpg_encode_stream, &jchunk) ? ESP_OK : ESP_FAIL;
    httpd_resp_send_chunk(req, NULL, 0);
  }
  esp_camera_fb_return(fb);
  return res;
}

static esp_err_t stream_handler(httpd_req_t *req) {
  camera_fb_t *fb = NULL;
  struct timeval _timestamp;
  esp_err_t res = ESP_OK;
  size_t _jpg_buf_len = 0;
  uint8_t *_jpg_buf = NULL;
  char part_buf[128];

  static int64_t last_frame = 0;
  if (!last_frame) {
    last_frame = esp_timer_get_time();
  }

  res = httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);
  if (res != ESP_OK) {
    return res;
  }

  addCorsHeaders(req);
  httpd_resp_set_hdr(req, "X-Framerate", "60");
  httpd_resp_set_hdr(req, "Cache-Control", "no-cache, no-store, must-revalidate");
  httpd_resp_set_hdr(req, "Pragma", "no-cache");
  httpd_resp_set_hdr(req, "Expires", "0");

#if defined(LED_GPIO_NUM)
  isStreaming = true;
  enable_led(true);
#endif

  while (true) {
    fb = esp_camera_fb_get();
    if (!fb) {
      log_e("Camera capture failed");
      res = ESP_FAIL;
    } else {
      _timestamp.tv_sec = fb->timestamp.tv_sec;
      _timestamp.tv_usec = fb->timestamp.tv_usec;
      if (fb->format != PIXFORMAT_JPEG) {
        bool jpeg_converted = frame2jpg(fb, 80, &_jpg_buf, &_jpg_buf_len);
        esp_camera_fb_return(fb);
        fb = NULL;
        if (!jpeg_converted) {
          log_e("JPEG compression failed");
          res = ESP_FAIL;
        }
      } else {
        _jpg_buf_len = fb->len;
        _jpg_buf = fb->buf;
      }
    }
    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY));
    }
    if (res == ESP_OK) {
      size_t hlen = snprintf((char *)part_buf, 128, _STREAM_PART, _jpg_buf_len, _timestamp.tv_sec, _timestamp.tv_usec);
      res = httpd_resp_send_chunk(req, (const char *)part_buf, hlen);
    }
    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, (const char *)_jpg_buf, _jpg_buf_len);
    }
    if (fb) {
      esp_camera_fb_return(fb);
      fb = NULL;
      _jpg_buf = NULL;
    } else if (_jpg_buf) {
      free(_jpg_buf);
      _jpg_buf = NULL;
    }
    if (res != ESP_OK) {
      log_e("Send frame failed");
      break;
    }
    int64_t fr_end = esp_timer_get_time();
    int64_t frame_time = fr_end - last_frame;
    last_frame = fr_end;
    frame_time /= 1000;
#if ARDUHAL_LOG_LEVEL >= ARDUHAL_LOG_LEVEL_INFO
    uint32_t avg_frame_time = ra_filter_run(&ra_filter, frame_time);
#endif
    log_i("MJPG: %" PRIu32 "B %" PRId32 "ms (%.1ffps), AVG: %" PRIu32 "ms (%.1ffps)",
      (uint32_t)_jpg_buf_len, (int32_t)frame_time, 1000.0 / frame_time,
      avg_frame_time, 1000.0 / avg_frame_time);
  }

#if defined(LED_GPIO_NUM)
  isStreaming = false;
  enable_led(false);
#endif

  return res;
}

static esp_err_t parse_get(httpd_req_t *req, char **obuf) {
  char *buf = NULL;
  size_t buf_len = 0;

  buf_len = httpd_req_get_url_query_len(req) + 1;
  if (buf_len > 1) {
    buf = (char *)malloc(buf_len);
    if (!buf) {
      httpd_resp_send_500(req);
      return ESP_FAIL;
    }
    if (httpd_req_get_url_query_str(req, buf, buf_len) == ESP_OK) {
      *obuf = buf;
      return ESP_OK;
    }
    free(buf);
  }
  httpd_resp_send_404(req);
  return ESP_FAIL;
}

static esp_err_t cmd_handler(httpd_req_t *req) {
  char *buf = NULL;
  char variable[32];
  char value[32];

  if (parse_get(req, &buf) != ESP_OK) {
    return ESP_FAIL;
  }
  if (httpd_query_key_value(buf, "var", variable, sizeof(variable)) != ESP_OK ||
      httpd_query_key_value(buf, "val", value, sizeof(value)) != ESP_OK) {
    free(buf);
    httpd_resp_send_404(req);
    return ESP_FAIL;
  }
  free(buf);

  int val = atoi(value);
  log_i("%s = %d", variable, val);
  sensor_t *s = esp_camera_sensor_get();
  int res = 0;

  if (!strcmp(variable, "framesize")) {
    if (s->pixformat == PIXFORMAT_JPEG) {
      res = s->set_framesize(s, (framesize_t)val);
    }
  } else if (!strcmp(variable, "quality")) {
    res = s->set_quality(s, val);
  } else if (!strcmp(variable, "contrast")) {
    res = s->set_contrast(s, val);
  } else if (!strcmp(variable, "brightness")) {
    res = s->set_brightness(s, val);
  } else if (!strcmp(variable, "saturation")) {
    res = s->set_saturation(s, val);
  } else if (!strcmp(variable, "gainceiling")) {
    res = s->set_gainceiling(s, (gainceiling_t)val);
  } else if (!strcmp(variable, "colorbar")) {
    res = s->set_colorbar(s, val);
  } else if (!strcmp(variable, "awb")) {
    res = s->set_whitebal(s, val);
  } else if (!strcmp(variable, "agc")) {
    res = s->set_gain_ctrl(s, val);
  } else if (!strcmp(variable, "aec")) {
    res = s->set_exposure_ctrl(s, val);
  } else if (!strcmp(variable, "hmirror")) {
    res = s->set_hmirror(s, val);
  } else if (!strcmp(variable, "vflip")) {
    res = s->set_vflip(s, val);
  } else if (!strcmp(variable, "awb_gain")) {
    res = s->set_awb_gain(s, val);
  } else if (!strcmp(variable, "agc_gain")) {
    res = s->set_agc_gain(s, val);
  } else if (!strcmp(variable, "aec_value")) {
    res = s->set_aec_value(s, val);
  } else if (!strcmp(variable, "aec2")) {
    res = s->set_aec2(s, val);
  } else if (!strcmp(variable, "dcw")) {
    res = s->set_dcw(s, val);
  } else if (!strcmp(variable, "bpc")) {
    res = s->set_bpc(s, val);
  } else if (!strcmp(variable, "wpc")) {
    res = s->set_wpc(s, val);
  } else if (!strcmp(variable, "raw_gma")) {
    res = s->set_raw_gma(s, val);
  } else if (!strcmp(variable, "lenc")) {
    res = s->set_lenc(s, val);
  } else if (!strcmp(variable, "special_effect")) {
    res = s->set_special_effect(s, val);
  } else if (!strcmp(variable, "wb_mode")) {
    res = s->set_wb_mode(s, val);
  } else if (!strcmp(variable, "ae_level")) {
    res = s->set_ae_level(s, val);
  }
#if defined(LED_GPIO_NUM)
  else if (!strcmp(variable, "led_intensity")) {
    led_duty = val;
    if (isStreaming) {
      enable_led(true);
    }
  }
#endif
  else {
    log_i("Unknown command: %s", variable);
    res = -1;
  }

  if (res < 0) {
    return httpd_resp_send_500(req);
  }

  addCorsHeaders(req);
  return httpd_resp_send(req, NULL, 0);
}

static int print_reg(char *p, char *end, sensor_t *s, uint16_t reg, uint32_t mask) {
  return snprintf(p, end - p, "\"0x%04x\":%d,", reg, s->get_reg(s, reg, mask));
}

static esp_err_t status_handler(httpd_req_t *req) {
  static char json_response[1024];

  sensor_t *s = esp_camera_sensor_get();
  char *p = json_response;
  char *end = json_response + sizeof(json_response);
  *p++ = '{';

  if (s->id.PID == OV5640_PID || s->id.PID == OV3660_PID) {
    for (int reg = 0x3400; reg < 0x3406; reg += 2) {
      p += print_reg(p, end, s, reg, 0xFFF);
    }
    p += print_reg(p, end, s, 0x3406, 0xFF);
    p += print_reg(p, end, s, 0x3500, 0xFFFF0);
    p += print_reg(p, end, s, 0x3503, 0xFF);
    p += print_reg(p, end, s, 0x350a, 0x3FF);
    p += print_reg(p, end, s, 0x350c, 0xFFFF);
    for (int reg = 0x5480; reg <= 0x5490; reg++) {
      p += print_reg(p, end, s, reg, 0xFF);
    }
    for (int reg = 0x5380; reg <= 0x538b; reg++) {
      p += print_reg(p, end, s, reg, 0xFF);
    }
    for (int reg = 0x5580; reg < 0x558a; reg++) {
      p += print_reg(p, end, s, reg, 0xFF);
    }
    p += print_reg(p, end, s, 0x558a, 0x1FF);
  } else if (s->id.PID == OV2640_PID) {
    p += print_reg(p, end, s, 0xd3, 0xFF);
    p += print_reg(p, end, s, 0x111, 0xFF);
    p += print_reg(p, end, s, 0x132, 0xFF);
  }

  p += snprintf(p, end - p, "\"xclk\":%u,", s->xclk_freq_hz / 1000000);
  p += snprintf(p, end - p, "\"pixformat\":%u,", s->pixformat);
  p += snprintf(p, end - p, "\"framesize\":%u,", s->status.framesize);
  p += snprintf(p, end - p, "\"quality\":%u,", s->status.quality);
  p += snprintf(p, end - p, "\"brightness\":%d,", s->status.brightness);
  p += snprintf(p, end - p, "\"contrast\":%d,", s->status.contrast);
  p += snprintf(p, end - p, "\"saturation\":%d,", s->status.saturation);
  p += snprintf(p, end - p, "\"sharpness\":%d,", s->status.sharpness);
  p += snprintf(p, end - p, "\"special_effect\":%u,", s->status.special_effect);
  p += snprintf(p, end - p, "\"wb_mode\":%u,", s->status.wb_mode);
  p += snprintf(p, end - p, "\"awb\":%u,", s->status.awb);
  p += snprintf(p, end - p, "\"awb_gain\":%u,", s->status.awb_gain);
  p += snprintf(p, end - p, "\"aec\":%u,", s->status.aec);
  p += snprintf(p, end - p, "\"aec2\":%u,", s->status.aec2);
  p += snprintf(p, end - p, "\"ae_level\":%d,", s->status.ae_level);
  p += snprintf(p, end - p, "\"aec_value\":%u,", s->status.aec_value);
  p += snprintf(p, end - p, "\"agc\":%u,", s->status.agc);
  p += snprintf(p, end - p, "\"agc_gain\":%u,", s->status.agc_gain);
  p += snprintf(p, end - p, "\"gainceiling\":%u,", s->status.gainceiling);
  p += snprintf(p, end - p, "\"bpc\":%u,", s->status.bpc);
  p += snprintf(p, end - p, "\"wpc\":%u,", s->status.wpc);
  p += snprintf(p, end - p, "\"raw_gma\":%u,", s->status.raw_gma);
  p += snprintf(p, end - p, "\"lenc\":%u,", s->status.lenc);
  p += snprintf(p, end - p, "\"hmirror\":%u,", s->status.hmirror);
  p += snprintf(p, end - p, "\"vflip\":%u,", s->status.vflip);
  p += snprintf(p, end - p, "\"dcw\":%u,", s->status.dcw);
  p += snprintf(p, end - p, "\"colorbar\":%u", s->status.colorbar);
#if defined(LED_GPIO_NUM)
  p += snprintf(p, end - p, ",\"led_intensity\":%u", led_duty);
#else
  p += snprintf(p, end - p , ",\"led_intensity\":%d", -1);
#endif
  *p++ = '}';
  *p++ = 0;
  httpd_resp_set_type(req, "application/json");
  addCorsHeaders(req);
  return httpd_resp_send(req, json_response, strlen(json_response));
}

static esp_err_t health_handler(httpd_req_t *req) {
  char json[512];
  sensor_t *s = esp_camera_sensor_get();

  snprintf(json, sizeof(json),
    "{"
    "\"status\":\"%s\","
    "\"hostname\":\"esp-itcs-cam\","
    "\"ip\":\"%s\","
    "\"mac\":\"%s\","
    "\"uptime\":%lu,"
    "\"wifiRssi\":%d,"
    "\"heapFree\":%u,"
    "\"psramFree\":%u,"
    "\"cameraStatus\":\"%s\""
    "}",
    isWifiConnected() ? "online" : "offline",
    WiFi.localIP().toString().c_str(),
    WiFi.macAddress().c_str(),
    (millis() - getBootTime()) / 1000,
    WiFi.RSSI(),
    ESP.getFreeHeap(),
    psramFound() ? ESP.getFreePsram() : 0,
    s ? "ok" : "error"
  );

  httpd_resp_set_type(req, "application/json");
  addCorsHeaders(req);
  httpd_resp_set_hdr(req, "Cache-Control", "no-cache, no-store, must-revalidate");
  return httpd_resp_send(req, json, strlen(json));
}

static esp_err_t index_handler(httpd_req_t *req) {
  httpd_resp_set_type(req, "text/html");
  addCorsHeaders(req);
  const char *html = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>ESP-ITCS-CAM</title></head>"
    "<body style=\"font-family:sans-serif;background:#111;color:#eee;margin:0;padding:20px;text-align:center\">"
    "<h1>ESP-ITCS-CAM</h1>"
    "<p>MJPEG Stream: <a href=\"/stream\" style=\"color:#4af\">/stream</a></p>"
    "<p>Capture: <a href=\"/capture\" style=\"color:#4af\">/capture</a></p>"
    "<p>Status API: <a href=\"/status\" style=\"color:#4af\">/status</a></p>"
    "<p>Health API: <a href=\"/api/health\" style=\"color:#4af\">/api/health</a></p>"
    "<p>Control: <code>/control?var=&lt;param&gt;&amp;val=&lt;value&gt;</code></p>"
    "<hr><img src=\"/stream\" style=\"max-width:100%%;max-height:70vh\">"
    "</body></html>";
  return httpd_resp_send(req, html, strlen(html));
}

void startCameraServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.max_uri_handlers = 10;

  httpd_uri_t index_uri = {
    .uri = "/",
    .method = HTTP_GET,
    .handler = index_handler,
    .user_ctx = NULL
  };

  httpd_uri_t status_uri = {
    .uri = "/status",
    .method = HTTP_GET,
    .handler = status_handler,
    .user_ctx = NULL
  };

  httpd_uri_t cmd_uri = {
    .uri = "/control",
    .method = HTTP_GET,
    .handler = cmd_handler,
    .user_ctx = NULL
  };

  httpd_uri_t capture_uri = {
    .uri = "/capture",
    .method = HTTP_GET,
    .handler = capture_handler,
    .user_ctx = NULL
  };

  httpd_uri_t stream_uri = {
    .uri = "/stream",
    .method = HTTP_GET,
    .handler = stream_handler,
    .user_ctx = NULL
  };

  httpd_uri_t health_uri = {
    .uri = "/api/health",
    .method = HTTP_GET,
    .handler = health_handler,
    .user_ctx = NULL
  };

  ra_filter_init(&ra_filter, 20);

  log_i("Starting web server on port: '%u'", config.server_port);
  if (httpd_start(&camera_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(camera_httpd, &index_uri);
    httpd_register_uri_handler(camera_httpd, &cmd_uri);
    httpd_register_uri_handler(camera_httpd, &status_uri);
    httpd_register_uri_handler(camera_httpd, &capture_uri);
    httpd_register_uri_handler(camera_httpd, &stream_uri);
    httpd_register_uri_handler(camera_httpd, &health_uri);
  }
}

void setupLedFlash() {
#if defined(LED_GPIO_NUM)
  ledcSetup(0, 5000, 8);
  ledcAttachPin(LED_GPIO_NUM, 0);
#else
  log_i("LED flash is disabled -> LED_GPIO_NUM undefined");
#endif
}
