import { createFileRoute } from "@tanstack/react-router";
import { SessionsMonitorScreen } from "../../app/components/screens/admin/sessions-monitor";

export const Route = createFileRoute("/app/sesiones/")({
  component: SessionsMonitorScreen,
});
