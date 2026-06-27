import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { InstrumentBuilderScreen } from "../../app/components/instruments/instrument-builder";

export const Route = createFileRoute("/app/instrumentos")({
  component: InstrumentosRoute,
});

function InstrumentosRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname !== "/app/instrumentos") {
    return <Outlet />;
  }
  return <InstrumentBuilderScreen />;
}
