import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import * as React from "react";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SCADA</title>
        <HeadContent />
      </head>
      <body>
        <div id="app">
          <Outlet />
        </div>
        <Scripts />
      </body>
    </html>
  );
}
