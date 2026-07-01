import { createFileRoute } from "@tanstack/react-router";
import { ResultsScreen } from "../../app/components/screens/admin/results";

export const Route = createFileRoute("/app/resultados/")({
  component: ResultsScreen,
});
