import { createFileRoute } from "@tanstack/react-router";

import ScadaLayout from "~/components";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <ScadaLayout />;
}
