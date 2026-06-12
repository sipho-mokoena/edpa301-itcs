import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useScadaDataStore } from "~/stores/scada-data";

export const Route = createFileRoute("/cloud")({
  component: RouteComponent,
});

type CloudStatus = "unavailable" | "active" | "paused";

const statusBadgeClass: Record<CloudStatus, string> = {
  unavailable: "border-red-500/40 bg-red-500/10 text-red-700",
  active: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
  paused: "border-amber-500/40 bg-amber-500/10 text-amber-700",
};

function getStatusLabel(status: CloudStatus) {
  return status[0].toUpperCase() + status.slice(1);
}

function ConfigCard({
  title,
  description,
  status,
  children,
}: {
  title: string;
  description: string;
  status: CloudStatus;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <Badge variant="outline" className={`shrink-0 ${statusBadgeClass[status]}`}>
            {getStatusLabel(status)}
          </Badge>
        </CardAction>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function RouteComponent() {
  const sites = useScadaDataStore((state) => state.sites);
  const processingUnits = useScadaDataStore((state) => state.processingUnits);

  const sensors = useScadaDataStore((state) => state.sensors);
  const actuators = useScadaDataStore((state) => state.actuators);
  const cameraFeeds = useScadaDataStore((state) => state.cameraFeeds);
  const selectedSiteId = useScadaDataStore((state) => state.selectedSiteId);
  const selectedProcessingUnitIds = useScadaDataStore((state) => state.selectedProcessingUnitIds);
  const selectedSensorIds = useScadaDataStore((state) => state.selectedSensorIds);
  const selectedActuatorIds = useScadaDataStore((state) => state.selectedActuatorIds);
  const selectedFeedId = useScadaDataStore((state) => state.selectedFeedId);
  const setCameraStatus = useScadaDataStore((state) => state.setCameraStatus);
  const cloud = useScadaDataStore((state) => state.cloud);

  const isSiteSelected = Boolean(selectedSiteId);

  const siteStatus: CloudStatus = isSiteSelected ? "active" : "paused";
  const processingUnitStatus: CloudStatus = !isSiteSelected
    ? "unavailable"
    : selectedProcessingUnitIds.length > 0
      ? "active"
      : "paused";
  const sensorStatus: CloudStatus = !isSiteSelected
    ? "unavailable"
    : selectedSensorIds.length > 0
      ? "active"
      : "paused";
  const actuatorStatus: CloudStatus = !isSiteSelected
    ? "unavailable"
    : selectedActuatorIds.length > 0
      ? "active"
      : "paused";
  const feedStatus: CloudStatus = !isSiteSelected
    ? "unavailable"
    : selectedFeedId
      ? "active"
      : "paused";
  const mqttStatus: CloudStatus =
    cloud.apiConnectionTone === "ok"
      ? "active"
      : cloud.apiConnectionTone === "neutral"
        ? "paused"
        : "unavailable";

  const availableProcessingUnits = processingUnits.filter(
    (processingUnit) => processingUnit.siteId === selectedSiteId,
  );

  const allowedSensorIds = new Set(
    processingUnits
      .filter((processingUnit) => selectedProcessingUnitIds.includes(processingUnit.id))
      .flatMap((processingUnit) => processingUnit.sensorIds),
  );

  const allowedActuatorIds = new Set(
    processingUnits
      .filter((processingUnit) => selectedProcessingUnitIds.includes(processingUnit.id))
      .flatMap((processingUnit) => processingUnit.actuatorIds),
  );

  const availableSensors = sensors.filter((sensor) => allowedSensorIds.has(sensor.id));
  const availableActuators = actuators.filter((actuator) => allowedActuatorIds.has(actuator.id));
  const availableFeeds = cameraFeeds.filter((feed) => feed.siteId === selectedSiteId);
  const selectedSiteLabel = sites.find((site) => site.id === selectedSiteId)?.label;
  const selectedProcessingUnits = availableProcessingUnits.filter((processingUnit) =>
    selectedProcessingUnitIds.includes(processingUnit.id),
  );
  const selectedSensors = availableSensors.filter((sensor) =>
    selectedSensorIds.includes(sensor.id),
  );
  const selectedActuators = availableActuators.filter((actuator) =>
    selectedActuatorIds.includes(actuator.id),
  );
  const selectedFeedLabel = availableFeeds.find((feed) => feed.id === selectedFeedId);
  const [cameraEndpointDraft, setCameraEndpointDraft] = useState(
    () => availableFeeds.find((feed) => feed.id === selectedFeedId)?.endpointBaseUrl ?? "",
  );

  const updateCameraEndpoint = (value: string) => {
    const trimmed = value.trim();
    setCameraEndpointDraft(value);
    if (selectedFeedId) {
      setCameraStatus(selectedFeedId, {
        endpointBaseUrl: trimmed,
        online: trimmed.length > 0,
        lastHeartbeat: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="w-full p-4">
      <h1 className="font-semibold mb-4">Hardware Configuration</h1>
      <div className="grid gap-4">
        <ConfigCard
          title="Site"
          description="The site where processing units, sensors, actuators, and feeds are sourced from."
          status={siteStatus}
        >
          <div className="grid gap-2">
            <p className="text-sm font-medium">{selectedSiteLabel ?? "Not configured"}</p>
            {selectedSiteId ? (
              <Badge variant="secondary" className="w-fit">
                {selectedSiteId}
              </Badge>
            ) : (
              <p className="text-xs text-muted-foreground">No site selected.</p>
            )}
          </div>
        </ConfigCard>

        <ConfigCard
          title="Processing Unit"
          description="Processing unit the SCADA accepts data from."
          status={processingUnitStatus}
        >
          <div className="grid gap-2">
            {!isSiteSelected ? (
              <p className="text-xs text-muted-foreground">No site selected.</p>
            ) : selectedProcessingUnits.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedProcessingUnits.map((processingUnit) => (
                  <span
                    key={processingUnit.id}
                    className="inline-flex max-w-full items-center gap-1 border border-border bg-secondary px-2 py-0.5 text-xs"
                  >
                    {processingUnit.label} ({processingUnit.id})
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No processing units selected.</p>
            )}
          </div>
        </ConfigCard>

        <ConfigCard
          title="Sensors"
          description="Sensors connected to selected processing units monitored in SCADA."
          status={sensorStatus}
        >
          <div className="grid gap-2">
            {!isSiteSelected ? (
              <p className="text-xs text-muted-foreground">No site selected.</p>
            ) : selectedSensors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedSensors.map((sensor) => (
                  <span
                    key={sensor.id}
                    className="inline-flex max-w-full items-center gap-1 border border-border bg-secondary px-2 py-0.5 text-xs"
                  >
                    {sensor.label} ({sensor.id})
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No sensors selected.</p>
            )}
          </div>
        </ConfigCard>

        <ConfigCard
          title="Actuators"
          description="Actuators connected to selected processing units monitored in SCADA."
          status={actuatorStatus}
        >
          <div className="grid gap-2">
            {!isSiteSelected ? (
              <p className="text-xs text-muted-foreground">No site selected.</p>
            ) : selectedActuators.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedActuators.map((actuator) => (
                  <span
                    key={actuator.id}
                    className="inline-flex max-w-full items-center gap-1 border border-border bg-secondary px-2 py-0.5 text-xs"
                  >
                    {actuator.label} ({actuator.id})
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No actuators selected.</p>
            )}
          </div>
        </ConfigCard>

        <ConfigCard
          title="Image and Video Feed"
          description="Source feed from available site cameras."
          status={feedStatus}
        >
          <div className="grid gap-2">
            <div className="grid gap-1">
              <Label htmlFor="feed-source">Feed Source</Label>
              <Input
                id="feed-source"
                value={
                  selectedFeedLabel
                    ? `${selectedFeedLabel.label} (${selectedFeedLabel.cameraName})`
                    : "No source selected"
                }
                disabled
                readOnly
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="camera-endpoint">Camera Host / Base URL</Label>
              <Input
                id="camera-endpoint"
                value={cameraEndpointDraft}
                onChange={(e) => updateCameraEndpoint(e.currentTarget.value)}
                placeholder="192.168.4.1 or http://192.168.4.1"
              />
            </div>
          </div>
        </ConfigCard>

        <ConfigCard
          title="MQTT Configuration"
          description="Broker connection and topics for telemetry and remote commands."
          status={mqttStatus}
        >
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-2 border border-border px-3 py-2">
              <span className="text-xs text-muted-foreground">Broker URL</span>
              <span className="font-mono text-xs">{cloud.apiConnection}</span>
            </div>
            <div className="flex items-center justify-between gap-2 border border-border px-3 py-2">
              <span className="text-xs text-muted-foreground">Sync Status</span>
              <span className="text-xs">{cloud.syncStatus}</span>
            </div>
            <div className="flex items-center justify-between gap-2 border border-border px-3 py-2">
              <span className="text-xs text-muted-foreground">Remote Override</span>
              <span className="text-xs">{cloud.remoteOverride}</span>
            </div>
          </div>
        </ConfigCard>
      </div>
    </div>
  );
}
