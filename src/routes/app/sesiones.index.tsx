import { createFileRoute } from "@tanstack/react-router";
import { SessionsMonitorScreen } from "../../app/components/screens/admin-screens";

export const Route = createFileRoute("/app/sesiones/")({
  component: SessionsMonitorScreen,
});
