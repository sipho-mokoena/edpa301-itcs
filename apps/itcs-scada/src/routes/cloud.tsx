import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { getMqttRuntimeConfig, restartMqttClient } from "~/lib/mqtt-client";
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
  disabled = false,
}: {
  title: string;
  description: string;
  status: CloudStatus;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <Card className={disabled ? "opacity-60" : ""}>
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
  const powerUnits = useScadaDataStore((state) => state.powerUnits);
  const sensors = useScadaDataStore((state) => state.sensors);
  const actuators = useScadaDataStore((state) => state.actuators);
  const cameraFeeds = useScadaDataStore((state) => state.cameraFeeds);
  const selectedSiteId = useScadaDataStore((state) => state.selectedSiteId);
  const selectedProcessingUnitIds = useScadaDataStore((state) => state.selectedProcessingUnitIds);
  const selectedSensorIds = useScadaDataStore((state) => state.selectedSensorIds);
  const selectedActuatorIds = useScadaDataStore((state) => state.selectedActuatorIds);
  const selectedFeedId = useScadaDataStore((state) => state.selectedFeedId);
  const mqtt = useScadaDataStore((state) => state.mqtt);
  const cloud = useScadaDataStore((state) => state.cloud);
  const selectSite = useScadaDataStore((state) => state.selectSite);
  const toggleProcessingUnitSelection = useScadaDataStore(
    (state) => state.toggleProcessingUnitSelection,
  );
  const toggleSensorSelection = useScadaDataStore((state) => state.toggleSensorSelection);
  const toggleActuatorSelection = useScadaDataStore((state) => state.toggleActuatorSelection);
  const setSelectedFeedId = useScadaDataStore((state) => state.setSelectedFeedId);
  const setCameraStatus = useScadaDataStore((state) => state.setCameraStatus);
  const setMqttConfig = useScadaDataStore((state) => state.setMqttConfig);
  const setCloudStatus = useScadaDataStore((state) => state.setCloudStatus);

  const [brokerUrlDraft, setBrokerUrlDraft] = useState(mqtt.brokerUrl);
  const [clientIdDraft, setClientIdDraft] = useState(mqtt.clientId);
  const [telemetryTopicDraft, setTelemetryTopicDraft] = useState(mqtt.telemetryTopic);
  const [commandTopicDraft, setCommandTopicDraft] = useState(mqtt.commandTopic);
  const [stateTopicDraft, setStateTopicDraft] = useState(mqtt.stateTopic);

  useEffect(() => {
    setBrokerUrlDraft(mqtt.brokerUrl);
    setClientIdDraft(mqtt.clientId);
    setTelemetryTopicDraft(mqtt.telemetryTopic);
    setCommandTopicDraft(mqtt.commandTopic);
    setStateTopicDraft(mqtt.stateTopic);
  }, [mqtt]);

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
  const availablePowerUnit = powerUnits.find((powerUnit) => powerUnit.siteId === selectedSiteId);
  const hasAvailableInput =
    Boolean(availablePowerUnit?.mainsAvailable) ||
    Boolean(availablePowerUnit?.solarBatteryAvailable);
  const powerUnitStatus: CloudStatus = !isSiteSelected
    ? "unavailable"
    : !availablePowerUnit
      ? "paused"
      : hasAvailableInput
        ? "active"
        : "unavailable";
  const feedStatus: CloudStatus = !isSiteSelected
    ? "unavailable"
    : selectedFeedId
      ? "active"
      : "paused";
  const mqttStatus: CloudStatus = cloud.apiConnectionTone === "ok"
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
  const unselectedSites = sites.filter((site) => site.id !== selectedSiteId);
  const unselectedProcessingUnits = availableProcessingUnits.filter(
    (processingUnit) => !selectedProcessingUnitIds.includes(processingUnit.id),
  );
  const unselectedSensors = availableSensors.filter(
    (sensor) => !selectedSensorIds.includes(sensor.id),
  );
  const unselectedActuators = availableActuators.filter(
    (actuator) => !selectedActuatorIds.includes(actuator.id),
  );
  const unselectedFeeds = availableFeeds.filter((feed) => feed.id !== selectedFeedId);
  const selectedFeed = availableFeeds.find((feed) => feed.id === selectedFeedId) ?? null;
  const selectedCameraEndpoint = selectedFeed?.endpointBaseUrl ?? "";

  const updateSelectedCameraEndpoint = (nextEndpointBaseUrl: string) => {
    if (!selectedFeedId) {
      return;
    }

    const trimmed = nextEndpointBaseUrl.trim();
    setCameraStatus(selectedFeedId, {
      endpointBaseUrl: trimmed,
      online: trimmed.length > 0,
      lastHeartbeat: new Date().toISOString(),
    });
  };
  const runtimeConfig = getMqttRuntimeConfig();

  const applyMqttConfiguration = () => {
    const nextConfig = {
      brokerUrl: brokerUrlDraft.trim(),
      clientId: clientIdDraft.trim(),
      telemetryTopic: telemetryTopicDraft.trim(),
      commandTopic: commandTopicDraft.trim(),
      stateTopic: stateTopicDraft.trim(),
    };

    if (!nextConfig.brokerUrl || !nextConfig.clientId) {
      setCloudStatus({
        syncStatus: "MQTT config requires broker URL and client ID",
        apiConnection: "DEGRADED",
        apiConnectionTone: "warn",
      });
      return;
    }

    setMqttConfig(nextConfig);
    restartMqttClient();
    setCloudStatus({
      syncStatus: `MQTT config applied at ${new Date().toLocaleTimeString()}`,
      apiConnection: "RECONNECTING",
      apiConnectionTone: "warn",
    });
  };

  const resetMqttConfiguration = () => {
    setBrokerUrlDraft(runtimeConfig.brokerUrl);
    setClientIdDraft(runtimeConfig.clientId);
    setTelemetryTopicDraft(runtimeConfig.telemetryTopic);
    setCommandTopicDraft(runtimeConfig.commandTopic);
    setStateTopicDraft(runtimeConfig.stateTopic);
  };

  return (
    <div className="w-full p-4">
      <h1 className="font-semibold mb-4">Cloud Configuration</h1>
      <div className="grid gap-4">
        <ConfigCard
          title="Site"
          description="Select the site where processing units, sensors, actuators, and feeds will be sourced from."
          status={siteStatus}
        >
          <div className="grid gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full !justify-start text-left"
                  />
                }
              >
                {selectedSiteLabel ?? "Select site"}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Available sites</DropdownMenuLabel>
                  {unselectedSites.length === 0 ? (
                    <DropdownMenuItem disabled>No other sites</DropdownMenuItem>
                  ) : (
                    unselectedSites.map((site) => (
                      <DropdownMenuItem key={site.id} onClick={() => selectSite(site.id)}>
                        {site.label} ({site.id})
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={!isSiteSelected} onClick={() => selectSite(null)}>
                  Clear site selection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          description="Select which processing units SCADA should accept data from."
          status={processingUnitStatus}
          disabled={!isSiteSelected}
        >
          <div className="grid gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full !justify-start text-left"
                    disabled={!isSiteSelected || availableProcessingUnits.length === 0}
                  />
                }
              >
                {selectedProcessingUnits.length > 0
                  ? `${selectedProcessingUnits.length} selected`
                  : "Select processing units"}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Processing units</DropdownMenuLabel>
                  {unselectedProcessingUnits.length === 0 ? (
                    <DropdownMenuItem disabled>All processing units selected</DropdownMenuItem>
                  ) : (
                    unselectedProcessingUnits.map((processingUnit) => (
                      <DropdownMenuItem
                        key={processingUnit.id}
                        onClick={() => toggleProcessingUnitSelection(processingUnit.id)}
                      >
                        {processingUnit.label} ({processingUnit.id})
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            {!isSiteSelected ? (
              <p className="text-xs text-muted-foreground">Select a site first.</p>
            ) : selectedProcessingUnits.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedProcessingUnits.map((processingUnit) => (
                  <button
                    key={processingUnit.id}
                    type="button"
                    onClick={() => toggleProcessingUnitSelection(processingUnit.id)}
                    className="inline-flex max-w-full items-center gap-1 border border-border bg-secondary px-2 py-0.5 text-xs"
                  >
                    <span className="truncate">
                      {processingUnit.label} ({processingUnit.id})
                    </span>
                    <span aria-hidden>×</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No processing units selected.</p>
            )}
          </div>
        </ConfigCard>

        <ConfigCard
          title="Sensors"
          description="Select sensors connected to selected processing units to monitor in SCADA."
          status={sensorStatus}
          disabled={!isSiteSelected}
        >
          <div className="grid gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full !justify-start text-left"
                    disabled={!isSiteSelected || availableSensors.length === 0}
                  />
                }
              >
                {selectedSensors.length > 0
                  ? `${selectedSensors.length} selected`
                  : "Select sensors"}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Sensors</DropdownMenuLabel>
                  {unselectedSensors.length === 0 ? (
                    <DropdownMenuItem disabled>All sensors selected</DropdownMenuItem>
                  ) : (
                    unselectedSensors.map((sensor) => (
                      <DropdownMenuItem
                        key={sensor.id}
                        onClick={() => toggleSensorSelection(sensor.id)}
                      >
                        {sensor.label} ({sensor.id})
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            {!isSiteSelected ? (
              <p className="text-xs text-muted-foreground">Select a site first.</p>
            ) : selectedSensors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedSensors.map((sensor) => (
                  <button
                    key={sensor.id}
                    type="button"
                    onClick={() => toggleSensorSelection(sensor.id)}
                    className="inline-flex max-w-full items-center gap-1 border border-border bg-secondary px-2 py-0.5 text-xs"
                  >
                    <span className="truncate">
                      {sensor.label} ({sensor.id})
                    </span>
                    <span aria-hidden>×</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Select at least one processing unit to choose sensors.
              </p>
            )}
          </div>
        </ConfigCard>

        <ConfigCard
          title="Actuators"
          description="Select actuators connected to selected processing units to monitor in SCADA."
          status={actuatorStatus}
          disabled={!isSiteSelected}
        >
          <div className="grid gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full !justify-start text-left"
                    disabled={!isSiteSelected || availableActuators.length === 0}
                  />
                }
              >
                {selectedActuators.length > 0
                  ? `${selectedActuators.length} selected`
                  : "Select actuators"}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Actuators</DropdownMenuLabel>
                  {unselectedActuators.length === 0 ? (
                    <DropdownMenuItem disabled>All actuators selected</DropdownMenuItem>
                  ) : (
                    unselectedActuators.map((actuator) => (
                      <DropdownMenuItem
                        key={actuator.id}
                        onClick={() => toggleActuatorSelection(actuator.id)}
                      >
                        {actuator.label} ({actuator.id})
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            {!isSiteSelected ? (
              <p className="text-xs text-muted-foreground">Select a site first.</p>
            ) : selectedActuators.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedActuators.map((actuator) => (
                  <button
                    key={actuator.id}
                    type="button"
                    onClick={() => toggleActuatorSelection(actuator.id)}
                    className="inline-flex max-w-full items-center gap-1 border border-border bg-secondary px-2 py-0.5 text-xs"
                  >
                    <span className="truncate">
                      {actuator.label} ({actuator.id})
                    </span>
                    <span aria-hidden>×</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Select at least one processing unit to choose actuators.
              </p>
            )}
          </div>
        </ConfigCard>

        <ConfigCard
          title="Power Unit"
          description="View available site power inputs and the currently selected relay source."
          status={powerUnitStatus}
          disabled={!isSiteSelected}
        >
          {!availablePowerUnit ? (
            <p className="text-xs text-muted-foreground">
              No power unit data available for the selected site.
            </p>
          ) : (
            <div className="grid gap-2 text-xs">
              <div className="flex items-center justify-between gap-2 border border-border px-3 py-2">
                <span>Mains Supply</span>
                <Badge variant={availablePowerUnit.mainsAvailable ? "default" : "outline"}>
                  {availablePowerUnit.mainsAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2 border border-border px-3 py-2">
                <span>Solar Battery Pack</span>
                <Badge variant={availablePowerUnit.solarBatteryAvailable ? "default" : "outline"}>
                  {availablePowerUnit.solarBatteryAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2 border border-border px-3 py-2">
                <span>Relay Input</span>
                <Badge variant="secondary">
                  {availablePowerUnit.relayPath === "mains" ? "Mains" : "Solar Battery"}
                </Badge>
              </div>
            </div>
          )}
        </ConfigCard>

        <ConfigCard
          title="Image and Video Feed"
          description="Select a source feed from available site cameras."
          status={feedStatus}
          disabled={!isSiteSelected}
        >
          <div className="grid gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full !justify-start text-left"
                    disabled={!isSiteSelected || availableFeeds.length === 0}
                  />
                }
              >
                {selectedFeedLabel
                  ? `${selectedFeedLabel.label} (${selectedFeedLabel.cameraName})`
                  : "Select source"}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Feed source</DropdownMenuLabel>
                  {unselectedFeeds.length === 0 ? (
                    <DropdownMenuItem disabled>No other sources</DropdownMenuItem>
                  ) : (
                    unselectedFeeds.map((feed) => (
                      <DropdownMenuItem key={feed.id} onClick={() => setSelectedFeedId(feed.id)}>
                        {feed.label} ({feed.cameraName})
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={!selectedFeedId}
                  onClick={() => setSelectedFeedId(null)}
                >
                  Clear selected source
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="grid gap-2">
              {selectedFeedLabel ? (
                <Badge variant="secondary" className="w-fit">
                  {selectedFeedLabel.id}
                </Badge>
              ) : (
                <p className="text-xs text-muted-foreground">No source selected.</p>
              )}

              <div className="grid gap-1">
                <Label htmlFor="camera-endpoint">Camera Host / Base URL</Label>
                <Input
                  id="camera-endpoint"
                  placeholder="192.168.4.1 or http://192.168.4.1"
                  value={selectedCameraEndpoint}
                  onChange={(event) => updateSelectedCameraEndpoint(event.currentTarget.value)}
                  disabled={!selectedFeedId}
                />
                <p className="text-xs text-muted-foreground">
                  Enter camera IP/host once. SCADA will call `{'/stream'}` and `{'/capture'}` on that host.
                </p>
              </div>
            </div>
          </div>
        </ConfigCard>

        <ConfigCard
          title="MQTT Configuration"
          description="Configure broker connection and topics for telemetry and remote commands."
          status={mqttStatus}
        >
          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label htmlFor="mqtt-broker-url">Broker URL</Label>
              <Input
                id="mqtt-broker-url"
                value={brokerUrlDraft}
                onChange={(event) => setBrokerUrlDraft(event.currentTarget.value)}
                placeholder="ws://localhost:8888"
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="mqtt-client-id">Client ID</Label>
              <Input
                id="mqtt-client-id"
                value={clientIdDraft}
                onChange={(event) => setClientIdDraft(event.currentTarget.value)}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="mqtt-telemetry-topic">Telemetry Topic</Label>
              <Input
                id="mqtt-telemetry-topic"
                value={telemetryTopicDraft}
                onChange={(event) => setTelemetryTopicDraft(event.currentTarget.value)}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="mqtt-command-topic">Commands Topic</Label>
              <Input
                id="mqtt-command-topic"
                value={commandTopicDraft}
                onChange={(event) => setCommandTopicDraft(event.currentTarget.value)}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="mqtt-state-topic">State Topic</Label>
              <Input
                id="mqtt-state-topic"
                value={stateTopicDraft}
                onChange={(event) => setStateTopicDraft(event.currentTarget.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button type="button" onClick={applyMqttConfiguration}>
                Apply and Reconnect
              </Button>
              <Button type="button" variant="outline" onClick={resetMqttConfiguration}>
                Reset Draft
              </Button>
              <Badge variant="outline" className="max-w-full truncate">
                Active: {runtimeConfig.brokerUrl}
              </Badge>
            </div>
          </div>
        </ConfigCard>
      </div>
    </div>
  );
}
