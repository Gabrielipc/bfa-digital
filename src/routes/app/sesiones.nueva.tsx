import { createFileRoute } from "@tanstack/react-router";
import { SessionCreateScreen } from "../../app/components/screens/admin/session-create";

export const Route = createFileRoute("/app/sesiones/nueva")({
  component: SessionCreateScreen,
});
