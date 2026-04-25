import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { useTheme } from "~/providers/theme";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="w-full p-4">
      <h1 className="font-semibold mb-4">Settings</h1>
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
    </div>
  );
}
