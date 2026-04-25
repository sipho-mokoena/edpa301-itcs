import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { initLogger, log } from "utils";
import { Button } from "../components/ui/button";

initLogger({ name: "scada" });

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [counter, setCounter] = useState(0);

  return (
    <div>
      <h1>Get started</h1>
      <p>
        Count is <strong>{counter}</strong>
      </p>
      <Button
        type="button"
        onClick={() => {
          log.info("Counter clicked");
          setCounter((c) => c + 1);
        }}
      >
        Click me
      </Button>
    </div>
  );
}
