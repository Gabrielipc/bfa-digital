import { createFileRoute } from "@tanstack/react-router";
import { ResultsDashboardScreen } from "../../app/components/screens/admin-screens";

export const Route = createFileRoute("/app/dashboard-resultados")({
  component: ResultsDashboardScreen,
});
