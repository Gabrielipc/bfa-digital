import { createFileRoute } from "@tanstack/react-router";
import { UsersScreen } from "../../app/components/screens/admin/users";

export const Route = createFileRoute("/app/usuarios")({
  component: UsersScreen,
});
