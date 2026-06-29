import { createFileRoute } from "@tanstack/react-router";
import { RolesScreen } from "../../app/components/screens/admin-screens";

export const Route = createFileRoute("/app/roles")({
  component: RolesScreen,
});
