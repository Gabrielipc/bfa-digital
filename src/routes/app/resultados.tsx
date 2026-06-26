import { createFileRoute } from "@tanstack/react-router";
import { ResultsScreen } from "../../app/components/screens/admin-screens";

export const Route = createFileRoute("/app/resultados")({
  component: ResultsScreen,
});
