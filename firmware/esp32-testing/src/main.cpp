#include <Arduino.h>

#include "ir_obstacle_test.h"
#include "servo_feedback_test.h"
#include "servo_test.h"
#include "ultrasonic_test.h"
#include "warnings_test.h"

constexpr int BUZZER_PIN = 23;
constexpr int RED_LED_PIN = 22;

constexpr int SERVO_1_PIN = 32;
constexpr int SERVO_2_PIN = 33;

constexpr int ULTRASONIC_TRIGGER_PIN = 14;
constexpr int ULTRASONIC_ECHO_1_PIN = 26;
constexpr int ULTRASONIC_ECHO_2_PIN = 25;
constexpr int ULTRASONIC_ECHO_3_PIN = 27;
constexpr float ULTRASONIC_OBSTACLE_DISTANCE_CM = 10.0f;

constexpr int IR_SENSOR_1_PIN = 10;
constexpr int IR_SENSOR_2_PIN = 9;
constexpr int IR_SENSOR_3_PIN = 13;

constexpr int LDR_DIGITAL_PIN = 17;
constexpr int LDR_OUTPUT_PIN = 16;

constexpr int SERVO_LIMIT_SWITCH_1_PIN = 18;
constexpr int SERVO_LIMIT_SWITCH_2_PIN = 19;

void printCsvValue(int value)
{
    Serial.print(value);
    Serial.print(", ");
}

void printCsvLine(
    int ir1,
    int ir2,
    int ir3,
    int buz,
    int lgs,
    int ls1,
    int ls2,
    int ldr,
    int us1,
    int us2,
    int us3,
    int sv1,
    int sv2)
{
    printCsvValue(ir1);
    printCsvValue(ir2);
    printCsvValue(ir3);
    printCsvValue(buz);
    printCsvValue(lgs);
    printCsvValue(ls1);
    printCsvValue(ls2);
    printCsvValue(ldr);
    printCsvValue(us1);
    printCsvValue(us2);
    printCsvValue(us3);
    printCsvValue(sv1);
    Serial.println(sv2);
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
    setupServoFeedbackTest(SERVO_LIMIT_SWITCH_1_PIN, SERVO_LIMIT_SWITCH_2_PIN);

    pinMode(LDR_DIGITAL_PIN, INPUT);
    pinMode(LDR_OUTPUT_PIN, OUTPUT);
    digitalWrite(LDR_OUTPUT_PIN, LOW);

    Serial.println("IR1, IR2, IR3, BUZ, LGS, LS1, LS2, LDR, US1, US2, US3, SV1, SV2");
}

void loop()
{
    runServoTest();
    runUltrasonicTest();
    runIrObstacleTest();
    runWarningsTest();
    runServoFeedbackTest();

    const int ir1 = getIrObstacleState(0);
    const int ir2 = getIrObstacleState(1);
    const int ir3 = getIrObstacleState(2);
    const int buz = getBuzzerState();
    const int lgs = getLedState();
    const int ls1 = getServoLimitSwitchState(0);
    const int ls2 = getServoLimitSwitchState(1);
    const int ldr = digitalRead(LDR_DIGITAL_PIN) == HIGH ? 1 : 0;
    const int us1 = isUltrasonicObstacleDetected(0, ULTRASONIC_OBSTACLE_DISTANCE_CM) ? 1 : 0;
    const int us2 = isUltrasonicObstacleDetected(1, ULTRASONIC_OBSTACLE_DISTANCE_CM) ? 1 : 0;
    const int us3 = isUltrasonicObstacleDetected(2, ULTRASONIC_OBSTACLE_DISTANCE_CM) ? 1 : 0;
    const int sv1 = static_cast<int>(getServoAngle1());
    const int sv2 = static_cast<int>(getServoAngle2());

    digitalWrite(LDR_OUTPUT_PIN, ldr == 1 ? HIGH : LOW);

    printCsvLine(ir1, ir2, ir3, buz, lgs, ls1, ls2, ldr, us1, us2, us3, sv1, sv2);

    delay(100);
}
