import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import "../style.css";

export const Route = createRootRoute({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        name: "description",
        content: "My App is a web application",
      },
      {
        title: "My App",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
    styles: [
      {
        media: "all and (max-width: 500px)",
        children: `p {
                  color: blue;
                  background-color: yellow;
                }`,
      },
    ],
    scripts: [{}],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent
        assetCrossOrigin={{
          modulepreload: "anonymous",
          stylesheet: "use-credentials",
        }}
      />
      <div id="app">
        <Outlet />
      </div>
      <Scripts />
    </>
  );
}
