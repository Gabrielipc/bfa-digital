import { createFileRoute } from "@tanstack/react-router";
import { DashboardScreen } from "../../app/components/screens/admin-screens";

export const Route = createFileRoute("/app/dashboard")({
  component: DashboardScreen,
});
