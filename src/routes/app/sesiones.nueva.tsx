import { createFileRoute } from "@tanstack/react-router";
import { SessionCreateScreen } from "../../app/components/screens/admin-screens";

export const Route = createFileRoute("/app/sesiones/nueva")({
  component: SessionCreateScreen,
});
