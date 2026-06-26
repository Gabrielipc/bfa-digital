import { createFileRoute } from "@tanstack/react-router";
import { UsersScreen } from "../../app/components/screens/admin-screens";

export const Route = createFileRoute("/app/usuarios")({
  component: UsersScreen,
});
