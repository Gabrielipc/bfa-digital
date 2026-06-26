import { createFileRoute } from "@tanstack/react-router";
import { UsersScreen } from "../../app/components/screens/admin-screens";

export const Route = createFileRoute("/app/roles")({
  component: UsersScreen, // Renderiza la pantalla que contiene la matriz de roles y permisos
});
