import { createFileRoute } from "@tanstack/react-router";
import { ReportsScreen } from "../../app/components/screens/admin/reports";

export const Route = createFileRoute("/app/reportes")({
  component: ReportsScreen,
});
