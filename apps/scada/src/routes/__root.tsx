import { ClerkProvider, UserButton, useAuth } from "@clerk/tanstack-react-start";
import { dark } from "@clerk/themes";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { House, Moon, Settings, Sun } from "lucide-react";
import { useEffect, useMemo, type ReactNode } from "react";

import { Button } from "~/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import ThemeProvider, { useTheme } from "~/providers/theme";

import "../style.css";
import "dockview-react/dist/styles/dockview.css";

export const Route = createRootRoute({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        name: "description",
        content: "Durban University of Technology ECE EDPA301 ITCS SCADA System",
      },
      {
        title: "DUT-EDPA301-ITCS-SCADA",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

const navItems = [
  {
    to: "/",
    label: "Home",
    icon: House,
    exact: true,
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    exact: false,
  },
] as const;

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
        <ThemeProvider>
          <ClerkThemeProvider>
            <AppShell />
          </ClerkThemeProvider>
        </ThemeProvider>
      </div>
      <Scripts />
    </>
  );
}

function ClerkThemeProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  const appearance = useMemo(
    () => ({
      baseTheme: theme === "dark" ? dark : undefined,
      variables: {
        colorPrimary: "var(--clerk-color-primary)",
        colorTextOnPrimaryBackground: "var(--clerk-color-primary-foreground)",
        colorDanger: "var(--clerk-color-danger)",
        colorSuccess: "var(--clerk-color-success)",
        colorWarning: "var(--clerk-color-warning)",
        colorText: "var(--clerk-color-foreground)",
        colorBackground: "var(--clerk-color-background)",
        colorInputBackground: "var(--clerk-color-input)",
        colorInputText: "var(--clerk-color-input-foreground)",
        colorNeutral: "var(--clerk-color-neutral)",
        colorMuted: "var(--clerk-color-muted)",
        colorTextSecondary: "var(--clerk-color-muted-foreground)",
        colorShimmer: "var(--clerk-color-shimmer)",
        colorModalBackdrop: "var(--clerk-color-modal-backdrop)",
        borderRadius: "var(--clerk-border-radius)",
      },
    }),
    [theme],
  );

  return <ClerkProvider appearance={appearance}>{children}</ClerkProvider>;
}

function AppShell() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { theme, setTheme } = useTheme();
  const isDarkTheme = theme === "dark";

  if (!isSignedIn) {
    return (
      <TooltipProvider>
        <div className="flex min-h-dvh flex-col bg-background text-foreground">
          <SignedOutRedirect />
          <div className="flex flex-1 flex-col">
            <main className="flex flex-1 items-center justify-center p-4">
              <Outlet />
            </main>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <SignedInRedirect />
        <header className="border-b border-border bg-sidebar px-3 py-2 md:px-4">
          <div className="flex items-center justify-end gap-2">
            <img
              src={isDarkTheme ? "/dut-logo-dark.png" : "/dut-logo-light.png"}
              alt="Logo"
              className="mr-auto h-6 w-16"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                className="gap-2"
                onClick={() => {
                  setTheme(isDarkTheme ? "light" : "dark");
                }}
              >
                {isDarkTheme ? <Sun /> : <Moon />}
              </Button>
              <UserButton />
            </div>
          </div>
        </header>
        <div className="grid flex-1 grid-cols-[4.45rem_1fr]">
          <aside className="border-r border-border bg-sidebar">
            <nav className="flex flex-col items-center gap-2">
              {navItems.map(({ to, label, icon: Icon, exact }) => {
                const isActive = exact ? pathname === to : pathname.startsWith(to);

                return (
                  <Tooltip key={to}>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          size="default"
                          className="h-16 w-18 [&_svg:not([class*='size-'])]:size-5 flex-col items-center justify-center rounded-md p-0 data-[state=open]:bg-secondary"
                          variant={isActive ? "default" : "ghost"}
                          aria-label={label}
                          onClick={() => {
                            void navigate({ to });
                          }}
                        >
                          <Icon /> <span>{label}</span>
                        </Button>
                      }
                    />
                    <TooltipContent side="right">{label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>
          </aside>
          <div className="flex h-full min-h-0 flex-col">
            <main className="flex-1">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function SignedOutRedirect() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (pathname !== "/auth") {
      void navigate({ to: "/auth", replace: true });
    }
  }, [navigate, pathname]);

  return null;
}

function SignedInRedirect() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (pathname === "/auth") {
      void navigate({ to: "/", replace: true });
    }
  }, [navigate, pathname]);

  return null;
}

function AppFooter() {
  return (
    <footer className="border-t border-border px-3 py-4 md:px-4">
      <div className="flex flex-col items-center justify-center gap-2">
        <p className="ml-4 text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Durban University of Technology - Department of
          Electronics and Computer Engineering. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
