import * as React from "react";
import { useScadaDataStore } from "~/stores/scada-data";

function useSceneState() {
  const sensors = useScadaDataStore((state) => state.sensors);
  const actuators = useScadaDataStore((state) => state.actuators);

  const findSensor = (id: string) => sensors.find((s) => s.id === id);
  const findActuator = (id: string) => actuators.find((a) => a.id === id);

  const approachActive = findSensor("ir.train.approach")?.status !== "IDLE";
  const insideActive = findSensor("ir.train.inside")?.status !== "IDLE";
  const leavingActive = findSensor("ir.train.leaving")?.status !== "IDLE";

  const ultrasonicNorthActive = findSensor("ultrasonic.north.vehicle")?.status !== "IDLE";
  const ultrasonicSouthActive = findSensor("ultrasonic.south.vehicle")?.status !== "IDLE";
  const ultrasonicIntersectionActive =
    findSensor("ultrasonic.intersection.vehicle")?.status !== "IDLE";

  const ldrNightSensorActive = findSensor("ldr.camera.night")?.status !== "IDLE";

  const nightLightActive = findActuator("light.camera.night")?.status !== "IDLE";
  const gateLeftClosed = findActuator("gate.servo.left")?.status !== "OPEN";
  const gateRightClosed = findActuator("gate.servo.right")?.status !== "OPEN";
  const faultActive = findActuator("controller.fault")?.status !== "ACTIVE";

  const isTrainActive = approachActive || insideActive || leavingActive;
  const isAnySensorActive =
    approachActive ||
    insideActive ||
    leavingActive ||
    ultrasonicNorthActive ||
    ultrasonicSouthActive ||
    ultrasonicIntersectionActive;

  return {
    approachActive,
    insideActive,
    leavingActive,
    ultrasonicNorthActive,
    ultrasonicSouthActive,
    ultrasonicIntersectionActive,
    ldrNightSensorActive,
    nightLightActive,
    gateLeftClosed,
    gateRightClosed,
    faultActive,
    isTrainActive,
    isAnySensorActive,
  };
}

const DigitalTwinSceneSvg = (props: React.ComponentProps<"svg">) => {
  const s = useSceneState();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1500"
      height="871"
      fill="none"
      viewBox="0 0 1500 871"
      {...props}
    >
      <g id="ScadaDigitalTwin">
        <path
          id="ProcessingUnitLogicLines"
          stroke="#616161"
          strokeDasharray="2 5"
          className={s.isAnySensorActive ? "scene-line-flow" : ""}
          d="M760.5 395.5H1141V579h57.5v96.5m15-271.5v271.5M892 200h335.5v484m-327 46c11.5 0 205.83-1 313 0v-23.5M421 290.5h46v374h774.5m-383-96V596h348v68.5M617 290.5V231h572v304h65.5v160.5H1233m-969-281v98h223v334h711.5v-140m-261-204h233v110h18.5v42M583 738v89.5h644.5v-121M583 279.5V474h-63v392.5h669v-160m122.5-182v151h-70M440 738v35.5h779.5v-67"
        />
        <path
          id="ProcessingUnitCameraLdrLogicLines"
          stroke={s.ldrNightSensorActive || s.nightLightActive ? "#FFAD28" : "#616161"}
          strokeDasharray="2 5"
          d="M309.5 688H298v117.5h867V684h18.5"
        />
        <g id="ProcessingUnit">
          <rect
            id="Rectangle 25"
            width="60"
            height="60"
            x="1183"
            y="651"
            fill="#209324"
            className={s.faultActive ? "scene-cpu-fault" : ""}
            rx="10"
          />
          <path
            id="CPU"
            fill="#111010"
            d="M1201.75 692.25h22.5v-22.5h-22.5zm15 3.75h-7.5v3.75h-3.75V696h-5.62a1.88 1.88 0 0 1-1.88-1.875V688.5h-3.75v-3.75h3.75v-7.5h-3.75v-3.75h3.75v-5.625a1.88 1.88 0 0 1 1.88-1.875h5.62v-3.75h3.75V666h7.5v-3.75h3.75V666h5.62a1.88 1.88 0 0 1 1.88 1.875v5.625h3.75v3.75H1228v7.5h3.75v3.75H1228v5.625a1.88 1.88 0 0 1-1.88 1.875h-5.62v3.75h-3.75zm-11.25-22.5h15v15h-15z"
          />
        </g>
        <g id="RoadRail">
          <path
            id="RailTracks"
            stroke="#EDEDED"
            strokeWidth="10"
            d="M0 359.5h1500M0 436.5h1500M69 350v95m150-95v95m-100-95v95m150-95v95m-100-95v95m150-95v95m50-95v95m150-95v95m-100-95v95m150-95v95m-100-95v95m150-95v95m243-95v95m150-95v95m-100-95v95m150-95v95m-100-95v95m150-95v95m50-95v95m150-95v95m-100-95v95m150-95v95m-100-95v95m150-95v95"
          />
          <g id="Road">
            <g id="Rectangle 20">
              <mask id="path-6-inside-1_10_480" fill="#fff">
                <path d="M649 0h180v871H649z" />
              </mask>
              <path fill="#616161" d="M649 0h180v871H649z" />
              <path
                fill="#111010"
                d="M829 0h-1v871h2V0zM649 871h1V0h-2v871z"
                mask="url(#path-6-inside-1_10_480)"
              />
            </g>
            <g id="Vector" fill="#EDEDED">
              <path d="M812 871h5V0h-5zM657 871h5V0h-5z" />
            </g>
            <path
              id="Vector_2"
              stroke="#EDEDED"
              strokeWidth="5"
              d="M746.75 269.348v-269m0 269h65m-65 0h-11v-269M747 871V535h-11m0 0v336m0-336h-74"
            />
          </g>
          <g id="Intersection">
            <path id="Rectangle 23" fill="#303030" d="M650 335h178v130H650z" />
            <path
              id="Intersect"
              fill="#EDEDED"
              fillRule="evenodd"
              d="M828 465H650V335h178zm-175.34-2.677v.734h18.967l83.038-125.667h-19.451zm24.73.734h18.049l83.039-125.667h-18.051zm23.811 0h18.051l83.037-125.667h-18.05zm23.813 0h18.049l82.598-125v-.667h-17.609zm23.812 0h19.451l57.384-86.844v-29.437zm25.213 0h18.051l33.571-50.806v-27.317zm23.813 0h18.05l9.759-14.769V420.97zm23.812 0h3.997v-6.05zM652.66 426.286v27.318l76.792-116.214h-18.051zm0-36.037v27.317l52.98-80.176h-18.051zm0-36.036v27.316l29.167-44.139h-18.051zm0-8.72 5.355-8.103h-5.355z"
              clipRule="evenodd"
            />
          </g>
        </g>
        <g id="TrafficLightGroup">
          <g id="TrafficLight">
            <path id="Rectangle 1" fill="#AEAEAE" stroke="#111010" d="M886.5 131.5h7v131h-7z" />
            <path id="Rectangle 2" fill="#616161" stroke="#111010" d="M883.5 262.5h13v9h-13z" />
            <path id="Rectangle 3" fill="#616161" stroke="#111010" d="M882.5 271.5h15v4h-15z" />
            <g id="Lights" stroke="#111010">
              <g id="Group 3">
                <circle id="Ellipse 2" cx="867" cy="173" r="9.5" fill="#AEAEAE" />
                <circle
                  id="Ellipse 3"
                  cx="867"
                  cy="173"
                  r="6.5"
                  fill="#C53D3D"
                  className={s.approachActive ? "scene-glow-red" : ""}
                />
              </g>
              <g id="Group 2">
                <circle id="Ellipse 1" cx="912" cy="173" r="9.5" fill="#AEAEAE" />
                <circle
                  id="Ellipse 4"
                  cx="912"
                  cy="173"
                  r="6.5"
                  fill="#C53D3D"
                  className={s.approachActive ? "scene-glow-red" : ""}
                />
              </g>
            </g>
            <path
              id="Rectangle 4"
              fill="#616161"
              stroke="#111010"
              d="m910.293 161 2.5 2.5h-46.82l1.785-2.5z"
            />
            <path
              id="Subtract"
              fill="#EDEDED"
              stroke="#C53D3D"
              d="M904.428 131.701a1.5 1.5 0 0 1 2.048.55l.5.865a1.5 1.5 0 0 1-.548 2.049L894.589 142l-.75.434.75.432 11.839 6.835a1.5 1.5 0 0 1 .548 2.049l-.5.865v.001a1.5 1.5 0 0 1-2.048.549l-14.339-8.278-.25-.145-.25.145-14.338 8.278a1.5 1.5 0 0 1-2.05-.549v-.001l-.501-.865a1.5 1.5 0 0 1 .551-2.049l11.838-6.835.75-.432-.75-.434-11.838-6.835a1.5 1.5 0 0 1-.62-1.912l.07-.137.5-.865a1.5 1.5 0 0 1 2.05-.55l14.338 8.278.25.144.25-.144z"
            />
          </g>
        </g>
        <g id="TrafficLightGroup_2">
          <g id="TrafficLight_2">
            <path id="Rectangle 1_2" fill="#AEAEAE" stroke="#111010" d="M886.5 593.5h7v131h-7z" />
            <path id="Rectangle 2_2" fill="#616161" stroke="#111010" d="M883.5 724.5h13v9h-13z" />
            <path id="Rectangle 3_2" fill="#616161" stroke="#111010" d="M882.5 733.5h15v4h-15z" />
            <g id="Lights_2" stroke="#111010">
              <g id="Group 3_2">
                <circle id="Ellipse 2_2" cx="867" cy="635" r="9.5" fill="#AEAEAE" />
                <circle
                  id="Ellipse 3_2"
                  cx="867"
                  cy="635"
                  r="6.5"
                  fill="#C53D3D"
                  className={s.leavingActive ? "scene-glow-red" : ""}
                />
              </g>
              <g id="Group 2_2">
                <circle id="Ellipse 1_2" cx="912" cy="635" r="9.5" fill="#AEAEAE" />
                <circle
                  id="Ellipse 4_2"
                  cx="912"
                  cy="635"
                  r="6.5"
                  fill="#C53D3D"
                  className={s.leavingActive ? "scene-glow-red" : ""}
                />
              </g>
            </g>
            <path
              id="Rectangle 4_2"
              fill="#616161"
              stroke="#111010"
              d="m910.293 623 2.5 2.5h-46.82l1.785-2.5z"
            />
            <path
              id="Subtract_2"
              fill="#EDEDED"
              stroke="#C53D3D"
              d="M904.428 593.701a1.5 1.5 0 0 1 2.048.55l.5.865a1.5 1.5 0 0 1-.548 2.049L894.589 604l-.75.434.75.432 11.839 6.835a1.5 1.5 0 0 1 .548 2.049l-.5.865v.001a1.5 1.5 0 0 1-2.048.549l-14.339-8.278-.25-.145-.25.145-14.338 8.278a1.5 1.5 0 0 1-2.05-.549v-.001l-.501-.865a1.5 1.5 0 0 1 .551-2.049l11.838-6.835.75-.432-.75-.434-11.838-6.835a1.5 1.5 0 0 1-.62-1.912l.07-.137.5-.865a1.5 1.5 0 0 1 2.05-.55l14.338 8.278.25.144.25-.144z"
            />
          </g>
        </g>
        <g id="TrafficLightGroup_3">
          <g id="TrafficLight_3">
            <path id="Rectangle 1_3" fill="#AEAEAE" stroke="#111010" d="M580.5 591.5h7v131h-7z" />
            <path id="Rectangle 2_3" fill="#616161" stroke="#111010" d="M577.5 722.5h13v9h-13z" />
            <path id="Rectangle 3_3" fill="#616161" stroke="#111010" d="M576.5 731.5h15v4h-15z" />
            <g id="Lights_3" stroke="#111010">
              <g id="Group 3_3">
                <circle id="Ellipse 2_3" cx="561" cy="633" r="9.5" fill="#AEAEAE" />
                <circle
                  id="Ellipse 3_3"
                  cx="561"
                  cy="633"
                  r="6.5"
                  fill="#C53D3D"
                  className={s.insideActive ? "scene-glow-red" : ""}
                />
              </g>
              <g id="Group 2_3">
                <circle id="Ellipse 1_3" cx="606" cy="633" r="9.5" fill="#AEAEAE" />
                <circle
                  id="Ellipse 4_3"
                  cx="606"
                  cy="633"
                  r="6.5"
                  fill="#C53D3D"
                  className={s.insideActive ? "scene-glow-red" : ""}
                />
              </g>
            </g>
            <path
              id="Rectangle 4_3"
              fill="#616161"
              stroke="#111010"
              d="m604.293 621 2.5 2.5h-46.82l1.785-2.5z"
            />
            <path
              id="Subtract_3"
              fill="#EDEDED"
              stroke="#C53D3D"
              d="M598.428 591.701a1.5 1.5 0 0 1 2.048.55l.5.865a1.5 1.5 0 0 1-.548 2.049L588.589 602l-.75.434.75.432 11.839 6.835a1.5 1.5 0 0 1 .548 2.049l-.5.865v.001a1.5 1.5 0 0 1-2.048.549l-14.339-8.278-.25-.145-.25.145-14.338 8.278a1.5 1.5 0 0 1-2.05-.549v-.001l-.501-.865a1.5 1.5 0 0 1 .551-2.049l11.838-6.835.75-.432-.75-.434-11.838-6.835a1.5 1.5 0 0 1-.62-1.912l.07-.137.5-.865a1.5 1.5 0 0 1 2.05-.55l14.338 8.278.25.144.25-.144z"
            />
          </g>
        </g>
        <g id="TrafficLightGroup_4">
          <g id="TrafficLight_4">
            <path id="Rectangle 1_4" fill="#AEAEAE" stroke="#111010" d="M580.5 131.5h7v131h-7z" />
            <path id="Rectangle 2_4" fill="#616161" stroke="#111010" d="M577.5 262.5h13v9h-13z" />
            <path id="Rectangle 3_4" fill="#616161" stroke="#111010" d="M576.5 271.5h15v4h-15z" />
            <g id="Lights_4" stroke="#111010">
              <g id="Group 3_4">
                <circle id="Ellipse 2_4" cx="561" cy="173" r="9.5" fill="#AEAEAE" />
                <circle
                  id="Ellipse 3_4"
                  cx="561"
                  cy="173"
                  r="6.5"
                  fill="#C53D3D"
                  className={s.approachActive ? "scene-glow-red" : ""}
                />
              </g>
              <g id="Group 2_4">
                <circle id="Ellipse 1_4" cx="606" cy="173" r="9.5" fill="#AEAEAE" />
                <circle
                  id="Ellipse 4_4"
                  cx="606"
                  cy="173"
                  r="6.5"
                  fill="#C53D3D"
                  className={s.approachActive ? "scene-glow-red" : ""}
                />
              </g>
            </g>
            <path
              id="Rectangle 4_4"
              fill="#616161"
              stroke="#111010"
              d="m604.293 161 2.5 2.5h-46.82l1.785-2.5z"
            />
            <path
              id="Subtract_4"
              fill="#EDEDED"
              stroke="#C53D3D"
              d="M598.428 131.701a1.5 1.5 0 0 1 2.048.55l.5.865a1.5 1.5 0 0 1-.548 2.049L588.589 142l-.75.434.75.432 11.839 6.835a1.5 1.5 0 0 1 .548 2.049l-.5.865v.001a1.5 1.5 0 0 1-2.048.549l-14.339-8.278-.25-.145-.25.145-14.338 8.278a1.5 1.5 0 0 1-2.05-.549v-.001l-.501-.865a1.5 1.5 0 0 1 .551-2.049l11.838-6.835.75-.432-.75-.434-11.838-6.835a1.5 1.5 0 0 1-.62-1.912l.07-.137.5-.865a1.5 1.5 0 0 1 2.05-.55l14.338 8.278.25.144.25-.144z"
            />
          </g>
        </g>
        <g
          id="BoomGateGroupNorth"
          className={s.gateLeftClosed ? "scene-gate-closed" : "scene-gate-open"}
        >
          <g id="Group 8" stroke="#111010">
            <g id="Group 7" fill="#616161">
              <path id="Rectangle 5" d="M-.5.5h13v9h-13z" transform="matrix(-1 0 0 1 629 321)" />
              <path id="Rectangle 6" d="M-.5.5h15v4h-15z" transform="matrix(-1 0 0 1 630 330)" />
            </g>
            <path
              id="Rectangle 7"
              fill="#AEAEAE"
              d="M-.5.5h7v49h-7z"
              transform="matrix(-1 0 0 1 626 272)"
            />
          </g>
          <g id="BoomGate">
            <g id="Group 5">
              <path
                id="Rectangle 10"
                fill="#EDEDED"
                stroke="#111010"
                d="M-.5.5h207v5H-.5z"
                transform="matrix(-1 0 0 1 839 283)"
              />
              <path id="Rectangle 11" fill="#C53D3D" d="M836 284h-10l3 4h10z" />
              <path id="Rectangle 12" fill="#C53D3D" d="M813 284h-10l3 4h10z" />
              <path id="Rectangle 13" fill="#C53D3D" d="M790 284h-10l3 4h10z" />
              <path id="Rectangle 14" fill="#C53D3D" d="M767 284h-10l3 4h10z" />
              <path id="Rectangle 15" fill="#C53D3D" d="M744 284h-10l3 4h10z" />
              <path id="Rectangle 16" fill="#C53D3D" d="M721 284h-10l3 4h10z" />
              <path id="Rectangle 17" fill="#C53D3D" d="M698 284h-10l3 4h10z" />
              <path id="Rectangle 18" fill="#C53D3D" d="M675 284h-10l3 4h10z" />
              <path id="Rectangle 19" fill="#C53D3D" d="M652 284h-10l3 4h10z" />
            </g>
            <path
              id="Vector_3"
              fill="#616161"
              stroke="#111010"
              d="M618 276.5h-13a1.5 1.5 0 0 0-1.5 1.5v5a1.5 1.5 0 0 0 1.5 1.5h5.5v5.5a1.5 1.5 0 0 0 1.5 1.5h19a1.5 1.5 0 0 0 1.5-1.5v-8a1.5 1.5 0 0 0-1.5-1.5h-11.5v-.5c0-.465-.201-1.397-.547-2.221-.171-.407-.364-.754-.559-.99-.208-.25-.343-.289-.394-.289Z"
            />
          </g>
        </g>
        <g
          id="BoomGateGroupNorth_2"
          className={s.gateRightClosed ? "scene-gate-closed" : "scene-gate-open"}
        >
          <g id="Group 8_2" stroke="#111010">
            <g id="Group 7_2" fill="#616161">
              <path id="Rectangle 5_2" d="M852.5 553.5h13v9h-13z" />
              <path id="Rectangle 6_2" d="M851.5 562.5h15v4h-15z" />
            </g>
            <path id="Rectangle 7_2" fill="#AEAEAE" d="M855.5 504.5h7v49h-7z" />
          </g>
          <g id="BoomGate_2">
            <g id="Group 5_2">
              <path
                id="Rectangle 10_2"
                fill="#EDEDED"
                stroke="#111010"
                d="M642.5 515.5h207v5h-207z"
              />
              <path id="Rectangle 11_2" fill="#C53D3D" d="M646 516h10l-3 4h-10z" />
              <path id="Rectangle 12_2" fill="#C53D3D" d="M669 516h10l-3 4h-10z" />
              <path id="Rectangle 13_2" fill="#C53D3D" d="M692 516h10l-3 4h-10z" />
              <path id="Rectangle 14_2" fill="#C53D3D" d="M715 516h10l-3 4h-10z" />
              <path id="Rectangle 15_2" fill="#C53D3D" d="M738 516h10l-3 4h-10z" />
              <path id="Rectangle 16_2" fill="#C53D3D" d="M761 516h10l-3 4h-10z" />
              <path id="Rectangle 17_2" fill="#C53D3D" d="M784 516h10l-3 4h-10z" />
              <path id="Rectangle 18_2" fill="#C53D3D" d="M807 516h10l-3 4h-10z" />
              <path id="Rectangle 19_2" fill="#C53D3D" d="M830 516h10l-3 4h-10z" />
            </g>
            <path
              id="Vector_4"
              fill="#616161"
              stroke="#111010"
              d="M864 508.5h13a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-5.5v5.5a1.5 1.5 0 0 1-1.5 1.5h-19a1.5 1.5 0 0 1-1.5-1.5v-8a1.5 1.5 0 0 1 1.5-1.5h11.5v-.5c0-.465.201-1.397.547-2.221.171-.407.364-.754.559-.99.208-.25.343-.289.394-.289Z"
            />
          </g>
        </g>
        <g id="PromixitySensorGroupIntersection">
          <g id="Sensor">
            <rect
              id="Rectangle 24"
              width="37"
              height="37"
              x="724"
              y="379.001"
              fill={s.ultrasonicIntersectionActive ? "#209324" : "#616161"}
              rx="18.5"
            />
            <path
              id="sensor"
              stroke="#111010"
              strokeWidth="2"
              d="M742.5 391.563c1.665 0 3.048.572 4.207 1.731s1.731 2.542 1.731 4.207-.572 3.048-1.731 4.207-2.542 1.73-4.207 1.73-3.048-.571-4.207-1.73-1.731-2.542-1.731-4.207.572-3.048 1.731-4.207 2.542-1.731 4.207-1.731Zm-9.017 1.069a10.3 10.3 0 0 0-.766 1.806 10 10 0 0 0-.467 3.062 9.8 9.8 0 0 0 .468 3.055q.306.942.77 1.794l-.27.181q-.486-.9-.807-1.908a10.2 10.2 0 0 1-.473-3.121c0-1.118.159-2.16.472-3.134q.323-1.003.814-1.906zm18.269-.165q.494.904.827 1.908a9.9 9.9 0 0 1 .483 3.125v.001a10 10 0 0 1-.484 3.115q-.331 1.009-.821 1.908l-.238-.162q.482-.861.781-1.818.45-1.455.45-3.043a10.4 10.4 0 0 0-.449-3.054 9.5 9.5 0 0 0-.778-1.828z"
            />
          </g>
        </g>
        <g id="PromixitySensorGroupLeftIntersection">
          <g id="Sensor_2">
            <rect
              id="Rectangle 24_2"
              width="37"
              height="37"
              x="250"
              y="379.001"
              fill={s.ultrasonicNorthActive ? "#209324" : "#616161"}
              rx="18.5"
            />
            <path
              id="sensor_2"
              stroke="#111010"
              strokeWidth="2"
              d="M268.5 391.563c1.665 0 3.048.572 4.207 1.731s1.731 2.542 1.731 4.207-.572 3.048-1.731 4.207-2.542 1.73-4.207 1.73-3.048-.571-4.207-1.73-1.731-2.542-1.731-4.207.572-3.048 1.731-4.207 2.542-1.731 4.207-1.731Zm-9.017 1.069a10.3 10.3 0 0 0-.766 1.806 10 10 0 0 0-.467 3.062 9.8 9.8 0 0 0 .468 3.055q.305.942.77 1.794l-.27.181q-.486-.9-.807-1.908a10.2 10.2 0 0 1-.473-3.121c0-1.118.159-2.16.472-3.134q.323-1.003.814-1.906zm18.269-.165q.495.904.827 1.908a9.9 9.9 0 0 1 .483 3.125v.001a10 10 0 0 1-.484 3.115q-.331 1.009-.821 1.908l-.238-.162q.482-.861.781-1.818.45-1.455.45-3.043a10.4 10.4 0 0 0-.449-3.054 9.5 9.5 0 0 0-.778-1.828z"
            />
          </g>
        </g>
        <g id="PromixitySensorGroupRightIntersection">
          <g id="Sensor_3">
            <rect
              id="Rectangle 24_3"
              width="37"
              height="37"
              x="1194"
              y="379.001"
              fill={s.ultrasonicSouthActive ? "#209324" : "#616161"}
              rx="18.5"
            />
            <path
              id="sensor_3"
              stroke="#111010"
              strokeWidth="2"
              d="M1212.5 391.563c1.66 0 3.05.572 4.21 1.731s1.73 2.542 1.73 4.207-.57 3.048-1.73 4.207-2.55 1.73-4.21 1.73-3.05-.571-4.21-1.73-1.73-2.542-1.73-4.207.57-3.048 1.73-4.207 2.55-1.731 4.21-1.731Zm-9.02 1.069c-.31.569-.56 1.172-.76 1.806-.31.979-.47 2.001-.47 3.062 0 1.062.15 2.082.47 3.055.2.628.46 1.226.77 1.794l-.27.181c-.33-.6-.59-1.236-.81-1.908-.31-.987-.47-2.025-.47-3.121 0-1.118.16-2.16.47-3.134q.33-1.003.81-1.906zm18.27-.165c.33.603.61 1.238.83 1.908q.48 1.455.48 3.125v.001q0 1.64-.48 3.115c-.22.673-.5 1.308-.82 1.908l-.24-.162q.48-.861.78-1.818.45-1.455.45-3.043t-.45-3.054a9.7 9.7 0 0 0-.78-1.828z"
            />
          </g>
        </g>
        <g id="UltrasonicSensorGroupNorthWest">
          <g id="UltrasonicSensor">
            <rect
              id="Rectangle 24_4"
              width="35"
              height="35"
              x="392.457"
              y="263.414"
              fill={s.ultrasonicNorthActive ? "#209324" : "#616161"}
              stroke={s.ultrasonicNorthActive ? "#209324" : "#616161"}
              strokeWidth="2"
              rx="17.5"
              transform="rotate(45 392.457 263.414)"
            />
            <path
              id="sensor_4"
              stroke="#111010"
              strokeWidth="2"
              d="M396.656 283.965c1.177 1.177 1.751 2.558 1.751 4.198 0 1.639-.574 3.021-1.751 4.198s-2.559 1.752-4.199 1.752-3.021-.574-4.198-1.752-1.751-2.559-1.751-4.198.574-3.021 1.751-4.198 2.559-1.752 4.198-1.752 3.021.574 4.199 1.752Zm-7.131-5.621a10.3 10.3 0 0 0-1.819.735 10.1 10.1 0 0 0-2.496 1.835 9.9 9.9 0 0 0-1.829 2.491 10.5 10.5 0 0 0-.724 1.814l-.319-.063a11 11 0 0 1 .778-1.92 10.3 10.3 0 0 1 1.872-2.542 10.2 10.2 0 0 1 2.551-1.882 11 11 0 0 1 1.923-.772zm13.034 12.801a11.6 11.6 0 0 1-.764 1.935 9.9 9.9 0 0 1-1.868 2.551l-.001.001a10 10 0 0 1-2.545 1.86q-.947.478-1.93.769l-.054-.283a9.5 9.5 0 0 0 1.838-.734 10.2 10.2 0 0 0 2.47-1.833 10.3 10.3 0 0 0 1.842-2.477 9.6 9.6 0 0 0 .743-1.842z"
            />
            <path
              id="Arrow 4"
              fill={s.ultrasonicNorthActive ? "#209324" : "#616161"}
              d="m342.95 321.407 11.153-2.989-8.165-8.165zm21.92-20.506a.999.999 0 1 0-1.414-1.414l.707.707zm-15.556 14.142.707.707 14.849-14.849-.707-.707-.707-.707-14.849 14.849z"
            />
            <path
              id="Arrow 5"
              fill={s.ultrasonicNorthActive ? "#209324" : "#616161"}
              d="M358.516 336.953a1 1 0 0 0 1.414 1.415l-.707-.708zm21.921-20.506-11.154 2.989 8.165 8.165zm-21.214 21.213.707.708 14.85-14.85-.707-.707-.708-.707-14.849 14.849z"
            />
          </g>
        </g>
        <g id="UltrasonicSensorGroupSouthEast">
          <g id="UltrasonicSensor_2">
            <rect
              id="Rectangle 24_5"
              width="35"
              height="35"
              y="-1.414"
              fill={s.ultrasonicSouthActive ? "#209324" : "#616161"}
              stroke={s.ultrasonicSouthActive ? "#209324" : "#616161"}
              strokeWidth="2"
              rx="17.5"
              transform="scale(1 -1)rotate(45 1289.416 1316.348)"
            />
            <path
              id="sensor_5"
              stroke="#111010"
              strokeWidth="2"
              d="M1313.66 506.656c1.17-1.177 1.75-2.559 1.75-4.199s-.58-3.021-1.75-4.198c-1.18-1.177-2.56-1.751-4.2-1.751s-3.02.574-4.2 1.751-1.75 2.559-1.75 4.198.57 3.022 1.75 4.199 2.56 1.751 4.2 1.751 3.02-.574 4.2-1.751Zm-7.14 5.62c-.62-.184-1.22-.429-1.81-.735a10 10 0 0 1-2.5-1.835 10 10 0 0 1-1.83-2.491q-.45-.882-.72-1.813l-.32.063q.285.98.78 1.919a10 10 0 0 0 1.87 2.542q1.185 1.183 2.55 1.882.93.481 1.92.773zm13.04-12.801c-.19-.659-.45-1.304-.77-1.934q-.675-1.37-1.86-2.552a10.2 10.2 0 0 0-2.55-1.861c-.63-.32-1.27-.574-1.93-.768l-.05.283c.63.179 1.24.422 1.84.733a10.4 10.4 0 0 1 2.47 1.834c.74.748 1.36 1.574 1.84 2.477.31.593.56 1.208.74 1.842z"
            />
            <path
              id="Arrow 4_2"
              fill={s.ultrasonicSouthActive ? "#209324" : "#616161"}
              d="m1259.95 469.213 11.15 2.989-8.16 8.165zm21.92 20.506c.39.391.39 1.024 0 1.415a.996.996 0 0 1-1.41 0l.7-.707zm-15.56-14.142.71-.707 14.85 14.849-.71.708-.7.707-14.85-14.85z"
            />
            <path
              id="Arrow 5_2"
              fill={s.ultrasonicSouthActive ? "#209324" : "#616161"}
              d="M1275.52 453.667a1 1 0 0 1 0-1.414.994.994 0 0 1 1.41 0l-.71.707zm21.92 20.506-11.16-2.988 8.17-8.165zm-21.22-21.213.71-.707 14.85 14.849-.71.707-.7.707-14.85-14.849z"
            />
          </g>
        </g>
        <g id="UltrasonicSensorGroupIntersection">
          <g id="UltrasonicSensor_3">
            <rect
              id="Rectangle 24_6"
              width="35"
              height="35"
              x="946.206"
              y="497.457"
              fill={s.ultrasonicIntersectionActive ? "#209324" : "#616161"}
              stroke={s.ultrasonicIntersectionActive ? "#209324" : "#616161"}
              strokeWidth="2"
              rx="17.5"
              transform="rotate(135 946.206 497.457)"
            />
            <path
              id="sensor_6"
              stroke="#111010"
              strokeWidth="2"
              d="M925.656 501.656c-1.177 1.177-2.559 1.751-4.199 1.751s-3.021-.574-4.198-1.751-1.751-2.559-1.751-4.199.574-3.021 1.751-4.198 2.559-1.751 4.198-1.751 3.022.574 4.199 1.751 1.751 2.559 1.751 4.198-.574 3.021-1.751 4.199Zm5.62-7.131a10.3 10.3 0 0 0-.735-1.819 10.1 10.1 0 0 0-1.835-2.496 9.8 9.8 0 0 0-2.491-1.829 10.5 10.5 0 0 0-1.813-.724l.063-.32q.98.294 1.919.779 1.38.712 2.542 1.872a10.2 10.2 0 0 1 1.882 2.551q.481.938.773 1.923zm-12.801 13.034a11.6 11.6 0 0 1-1.934-.764 9.9 9.9 0 0 1-2.552-1.868v-.001a10 10 0 0 1-1.861-2.545 11.4 11.4 0 0 1-.768-1.93l.283-.054q.267.95.733 1.838a10.2 10.2 0 0 0 1.833 2.47 10.4 10.4 0 0 0 2.477 1.842 9.5 9.5 0 0 0 1.843.743z"
            />
            <path
              id="Arrow 4_3"
              fill={s.ultrasonicIntersectionActive ? "#209324" : "#616161"}
              d="m888.213 447.95 2.989 11.153 8.165-8.165zm20.506 21.92a1 1 0 1 0 1.415-1.414l-.708.707zm-14.142-15.556-.707.707 14.849 14.849.707-.707.708-.707-14.85-14.849z"
            />
            <path
              id="Arrow 5_3"
              fill={s.ultrasonicIntersectionActive ? "#209324" : "#616161"}
              d="M872.667 463.516a1 1 0 0 0-1.414 1.414l.707-.707zm20.506 21.92-2.989-11.153-8.164 8.165zm-21.213-21.213-.707.707 14.849 14.85.707-.707.707-.708-14.849-14.849z"
            />
          </g>
        </g>
        <g id="LDRControlledLighting">
          <circle
            id="Sun"
            cx="18.631"
            cy="18.631"
            r="18.131"
            fill={s.nightLightActive ? "#209324" : "#616161"}
            stroke="#000"
            transform="matrix(1 0 0 -1 310 702)"
          />
        </g>
        <g id="BuzzerGroup">
          <g id="Buzzer">
            <circle id="Ellipse 5" cx="440" cy="718" r="20" fill="#209324" />
            <path
              id="Vector_5"
              fill="#000"
              d="M446.001 718a3.99 3.99 0 0 0-2.461-3.689l-.769 1.847a1.995 1.995 0 0 1 1.228 1.847c0 .829-.506 1.542-1.228 1.847l.769 1.846a4.02 4.02 0 0 0 2.461-3.698m-.924-7.383-.769 1.847a5.993 5.993 0 0 1 0 11.072l.769 1.847A7.99 7.99 0 0 0 450 718a7.99 7.99 0 0 0-4.923-7.383M430 712.998v9.999h3.999l7 7.003v-24l-7 6.998z"
            />
          </g>
        </g>
        <g id="Camera" className={s.nightLightActive ? "scene-glow-green" : ""}>
          <g id="g3186">
            <g id="path3178">
              <path
                fill="#209324"
                fillRule="evenodd"
                d="m371.463 746.217 6.137 1.505-9.804-16.98-1.931 5.826"
                clipRule="evenodd"
              />
              <path
                stroke="#111010"
                strokeLinejoin="round"
                d="m371.463 746.217 6.137 1.505-9.804-16.98-1.931 5.826"
              />
            </g>
            <g id="path3176">
              <path
                fill="#209324"
                fillRule="evenodd"
                d="m364.486 737.415 1.312-.758 5.493 9.514-1.312.757"
                clipRule="evenodd"
              />
              <path stroke="#111010" d="m364.486 737.415 1.312-.758 5.493 9.514-1.312.757" />
            </g>
            <path
              id="rect2396"
              fill="#209324"
              stroke="#111010"
              strokeLinecap="round"
              strokeLinejoin="bevel"
              d="m325.95 753.248 35.867-20.708 10.67 18.48-35.867 20.709z"
            />
            <path
              id="path3172"
              fill="#209324"
              stroke="#111010"
              strokeLinecap="round"
              strokeLinejoin="bevel"
              d="M337.569 736.206a8.94 8.94 0 0 0 5.438 4.168 8.975 8.975 0 0 0 10.979-6.339 8.95 8.95 0 0 0-.891-6.794 8.95 8.95 0 0 0-5.438-4.168 8.97 8.97 0 0 0-6.8.9 8.97 8.97 0 0 0-4.179 5.439 8.94 8.94 0 0 0 .891 6.794Z"
            />
            <path
              id="use3180"
              fill="#209324"
              stroke="#111010"
              strokeLinecap="round"
              strokeLinejoin="bevel"
              d="M322.082 745.147a8.94 8.94 0 0 0 5.438 4.168 8.975 8.975 0 0 0 10.979-6.339 8.944 8.944 0 0 0-6.329-10.961 8.97 8.97 0 0 0-10.979 6.339 8.94 8.94 0 0 0 .891 6.793Z"
            />
          </g>
        </g>
      </g>
    </svg>
  );
};

export default DigitalTwinSceneSvg;
