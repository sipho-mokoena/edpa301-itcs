import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { useTheme } from "~/providers/theme";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

type HealthState = "idle" | "checking" | "healthy" | "degraded" | "offline";

const healthBadgeClass: Record<HealthState, string> = {
  idle: "border-muted-foreground/30 bg-muted text-muted-foreground",
  checking: "border-blue-500/40 bg-blue-500/10 text-blue-700",
  healthy: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
  degraded: "border-amber-500/40 bg-amber-500/10 text-amber-700",
  offline: "border-red-500/40 bg-red-500/10 text-red-700",
};

function toStatusLabel(value: string) {
  if (!value) {
    return "Unknown";
  }

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getServiceStatusClass(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("healthy") ||
    normalized.includes("online") ||
    normalized.includes("up") ||
    normalized.includes("ok") ||
    normalized.includes("connected")
  ) {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700";
  }

  if (
    normalized.includes("degraded") ||
    normalized.includes("warning") ||
    normalized.includes("slow")
  ) {
    return "border-amber-500/40 bg-amber-500/10 text-amber-700";
  }

  if (
    normalized.includes("offline") ||
    normalized.includes("down") ||
    normalized.includes("error") ||
    normalized.includes("unavailable") ||
    normalized.includes("failed")
  ) {
    return "border-red-500/40 bg-red-500/10 text-red-700";
  }

  return "border-muted-foreground/30 bg-muted text-muted-foreground";
}

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:3000");
  const [healthPath, setHealthPath] = useState("/health");
  const [checkIntervalSeconds, setCheckIntervalSeconds] = useState(30);
  const [healthState, setHealthState] = useState<HealthState>("idle");
  const [reportedServiceStatuses, setReportedServiceStatuses] = useState<Record<string, string>>({
    database: "Unknown",
  });
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [nextCheckAt, setNextCheckAt] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const inFlightRef = useRef(false);

  const healthEndpoint = useMemo(() => {
    const base = apiBaseUrl.trim().replace(/\/$/, "");
    const path = healthPath.trim().startsWith("/") ? healthPath.trim() : `/${healthPath.trim()}`;
    return `${base}${path}`;
  }, [apiBaseUrl, healthPath]);

  const runHealthCheck = useCallback(async () => {
    if (!healthEndpoint || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setHealthState("checking");

    try {
      const response = await fetch(healthEndpoint, {
        headers: { Accept: "application/json" },
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      const checkTime = new Date();
      setLastCheckedAt(checkTime);
      setNextCheckAt(new Date(checkTime.getTime() + checkIntervalSeconds * 1000));

      let nextServiceStatuses: Record<string, string> = {};

      if (typeof payload === "object" && payload !== null) {
        const body = payload as {
          serviceStatus?: unknown;
          serviceStatuses?: unknown;
          services?: unknown;
          status?: unknown;
        };

        const serviceContainer = body.serviceStatuses ?? body.services ?? body.serviceStatus;

        if (typeof serviceContainer === "object" && serviceContainer !== null) {
          for (const [serviceName, serviceStatus] of Object.entries(serviceContainer)) {
            if (typeof serviceStatus === "string") {
              nextServiceStatuses[serviceName] = toStatusLabel(serviceStatus);
              continue;
            }

            if (typeof serviceStatus === "number" || typeof serviceStatus === "boolean") {
              nextServiceStatuses[serviceName] = String(serviceStatus);
              continue;
            }

            if (
              typeof serviceStatus === "object" &&
              serviceStatus !== null &&
              typeof (serviceStatus as { status?: unknown }).status === "string"
            ) {
              nextServiceStatuses[serviceName] = toStatusLabel(
                (serviceStatus as { status: string }).status,
              );
            }
          }
        }

        if (Object.keys(nextServiceStatuses).length === 0 && typeof body.status === "string") {
          nextServiceStatuses.database = toStatusLabel(body.status);
        }
      }

      if (Object.keys(nextServiceStatuses).length === 0) {
        nextServiceStatuses = { database: response.ok ? "Online" : "Unavailable" };
      }

      setReportedServiceStatuses(nextServiceStatuses);

      if (response.ok) {
        setHealthState("healthy");
        setLastError(null);
      } else {
        setHealthState("degraded");
        setLastError(`HTTP ${response.status}`);
      }
    } catch (error) {
      const checkTime = new Date();
      setLastCheckedAt(checkTime);
      setNextCheckAt(new Date(checkTime.getTime() + checkIntervalSeconds * 1000));
      setHealthState("offline");
      setReportedServiceStatuses({ database: "Unavailable" });
      setLastError(error instanceof Error ? error.message : "Health check failed");
    } finally {
      inFlightRef.current = false;
    }
  }, [checkIntervalSeconds, healthEndpoint]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(tick);
    };
  }, []);

  useEffect(() => {
    void runHealthCheck();

    const poll = window.setInterval(() => {
      void runHealthCheck();
    }, checkIntervalSeconds * 1000);

    return () => {
      window.clearInterval(poll);
    };
  }, [checkIntervalSeconds, runHealthCheck]);

  const nextCheckCountdown = nextCheckAt
    ? formatCountdown(Math.max(0, nextCheckAt.getTime() - now))
    : "--:--";

  const visibleServiceStatuses = useMemo(() => {
    const entries = Object.entries(reportedServiceStatuses);

    entries.sort(([keyA], [keyB]) => {
      if (keyA === "database") {
        return -1;
      }

      if (keyB === "database") {
        return 1;
      }

      return keyA.localeCompare(keyB);
    });

    return entries;
  }, [reportedServiceStatuses]);

  return (
    <div className="w-full p-4">
      <h1 className="font-semibold mb-4">Settings</h1>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Configure the appearance of the application.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label htmlFor="theme-light">Theme Mode</Label>
              <RadioGroup
                value={theme}
                onValueChange={(value) => {
                  if (value === "light" || value === "dark") {
                    setTheme(value);
                  }
                }}
                className="grid gap-2"
              >
                <Label
                  htmlFor="theme-light"
                  className="flex cursor-pointer items-center gap-3 border border-border px-3 py-2"
                >
                  <RadioGroupItem id="theme-light" value="light" />
                  <span>Light</span>
                </Label>
                <Label
                  htmlFor="theme-dark"
                  className="flex cursor-pointer items-center gap-3 border border-border px-3 py-2"
                >
                  <RadioGroupItem id="theme-dark" value="dark" />
                  <span>Dark</span>
                </Label>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Configure where SCADA sends API health requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="api-base-url">API Base URL</Label>
                <Input
                  id="api-base-url"
                  value={apiBaseUrl}
                  onChange={(event) => setApiBaseUrl(event.target.value)}
                  placeholder="http://localhost:3000"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="api-health-path">Health Endpoint Path</Label>
                <Input
                  id="api-health-path"
                  value={healthPath}
                  onChange={(event) => setHealthPath(event.target.value)}
                  placeholder="/health"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="api-health-interval">Health Check Interval (seconds)</Label>
                <Input
                  id="api-health-interval"
                  type="number"
                  min={5}
                  max={300}
                  value={checkIntervalSeconds}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    if (Number.isNaN(nextValue)) {
                      return;
                    }
                    setCheckIntervalSeconds(Math.min(300, Math.max(5, nextValue)));
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Effective endpoint: <span className="font-mono">{healthEndpoint}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Health</CardTitle>
            <CardDescription>
              View service status reported by the API and timing for health checks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-2 border border-border px-3 py-2">
                <span className="text-sm">API Reachability</span>
                <Badge variant="outline" className={healthBadgeClass[healthState]}>
                  {toStatusLabel(healthState)}
                </Badge>
              </div>
              <div className="grid gap-2 border border-border px-3 py-2">
                <span className="text-sm font-semibold">Service Statuses</span>
                <div className="grid gap-1.5 pl-2 border-l mb-2">
                  {visibleServiceStatuses.map(([serviceName, serviceStatus]) => (
                    <div key={serviceName} className="flex items-center justify-between gap-2">
                      <span className="text-sm capitalize">{serviceName}</span>
                      <Badge variant="outline" className={getServiceStatusClass(serviceStatus)}>
                        {serviceStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border border-border px-3 py-2">
                <span className="text-sm">Last Health Check</span>
                <span className="text-sm text-muted-foreground">
                  {lastCheckedAt ? lastCheckedAt.toLocaleString() : "Not checked yet"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 border border-border px-3 py-2">
                <span className="text-sm">Next Check In</span>
                <span className="font-mono text-sm">{nextCheckCountdown}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                {lastError ? (
                  <p className="text-xs text-red-700">Last error: {lastError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">No API health errors.</p>
                )}
                <Button type="button" variant="outline" onClick={() => void runHealthCheck()}>
                  Run check now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
