import { createFileRoute } from "@tanstack/react-router";
import { ReportsScreen } from "../../app/components/screens/admin-screens";

export const Route = createFileRoute("/app/reportes")({
  component: ReportsScreen,
});
