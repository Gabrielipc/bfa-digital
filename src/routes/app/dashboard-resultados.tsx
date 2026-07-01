import { createFileRoute } from "@tanstack/react-router";
import { ResultsDashboardScreen } from "../../app/components/screens/admin/results-dashboard";

export const Route = createFileRoute("/app/dashboard-resultados")({
  component: ResultsDashboardScreen,
});
