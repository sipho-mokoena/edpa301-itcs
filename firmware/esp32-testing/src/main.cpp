#include <Arduino.h>

#include "ir_obstacle_test.h"
#include "servo_test.h"
#include "ultrasonic_test.h"
#include "warnings_test.h"

constexpr int BUZZER_PIN = 18;
constexpr int RED_LED_PIN = 5;

constexpr int SERVO_1_PIN = 32;
constexpr int SERVO_2_PIN = 33;

constexpr int ULTRASONIC_TRIGGER_PIN = 14;
constexpr int ULTRASONIC_ECHO_1_PIN = 19;
constexpr int ULTRASONIC_ECHO_2_PIN = 22;
constexpr int ULTRASONIC_ECHO_3_PIN = 23;
constexpr float ULTRASONIC_OBSTACLE_DISTANCE_CM = 10.0f;

constexpr int IR_SENSOR_1_PIN = 10;
constexpr int IR_SENSOR_2_PIN = 9;
constexpr int IR_SENSOR_3_PIN = 13;

constexpr int LDR_DIGITAL_PIN = 17;
constexpr int LDR_OUTPUT_PIN = 16;

struct CsvData {
    int ir1;
    int ir2;
    int ir3;
    int buz;
    int lgs;
    int ls1;
    int ls2;
    int ldr;
    int us1;
    int us2;
    int us3;
    int sv1;
    int sv2;
};

void printStateLine(const CsvData& data)
{
    Serial.print("ir1=");
    Serial.print(data.ir1);
    Serial.print(", ir2=");
    Serial.print(data.ir2);
    Serial.print(", ir3=");
    Serial.print(data.ir3);
    Serial.print(", buz=");
    Serial.print(data.buz);
    Serial.print(", lgs=");
    Serial.print(data.lgs);
    Serial.print(", ldr=");
    Serial.print(data.ldr);
    Serial.print(", us1=");
    Serial.print(data.us1);
    Serial.print(", us2=");
    Serial.print(data.us2);
    Serial.print(", us3=");
    Serial.print(data.us3);
    Serial.print(", sv1=");
    Serial.print(data.sv1);
    Serial.print(", sv2=");
    Serial.println(data.sv2);
}

void setup()
{
    Serial.begin(115200);

    setupServoTest(SERVO_1_PIN, SERVO_2_PIN);
    setupUltrasonicTest(
        ULTRASONIC_TRIGGER_PIN,
        ULTRASONIC_ECHO_1_PIN,
        ULTRASONIC_ECHO_2_PIN,
        ULTRASONIC_ECHO_3_PIN);
    setupIrObstacleTest(IR_SENSOR_1_PIN, IR_SENSOR_2_PIN, IR_SENSOR_3_PIN);
    setupWarningsTest(BUZZER_PIN, RED_LED_PIN);

    pinMode(LDR_DIGITAL_PIN, INPUT);
    pinMode(LDR_OUTPUT_PIN, OUTPUT);
    digitalWrite(LDR_OUTPUT_PIN, LOW);
}

void loop()
{
    runServoTest();
    runUltrasonicTest();
    runIrObstacleTest();
    runWarningsTest();

    const int ir1 = getIrObstacleState(0);
    const int ir2 = getIrObstacleState(1);
    const int ir3 = getIrObstacleState(2);
    const int buz = getBuzzerState();
    const int lgs = getLedState();
    const int ldr = digitalRead(LDR_DIGITAL_PIN) == HIGH ? 1 : 0;
    const int us1 = isUltrasonicObstacleDetected(0, ULTRASONIC_OBSTACLE_DISTANCE_CM) ? 1 : 0;
    const int us2 = isUltrasonicObstacleDetected(1, ULTRASONIC_OBSTACLE_DISTANCE_CM) ? 1 : 0;
    const int us3 = isUltrasonicObstacleDetected(2, ULTRASONIC_OBSTACLE_DISTANCE_CM) ? 1 : 0;
    const int sv1 = static_cast<int>(getServoAngle1());
    const int sv2 = static_cast<int>(getServoAngle2());

    digitalWrite(LDR_OUTPUT_PIN, ldr == 1 ? HIGH : LOW);

    CsvData data = {
        .ir1 = ir1,
        .ir2 = ir2,
        .ir3 = ir3,
        .buz = buz,
        .lgs = lgs,
        .ldr = ldr,
        .us1 = us1,
        .us2 = us2,
        .us3 = us3,
        .sv1 = sv1,
        .sv2 = sv2
        };
    printStateLine(data);

    delay(100);
}
