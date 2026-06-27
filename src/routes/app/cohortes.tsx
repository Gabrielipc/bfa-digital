import { createFileRoute } from "@tanstack/react-router";
import { CohortesScreen } from "../../app/components/screens/catalog-screens";

export const Route = createFileRoute("/app/cohortes")({
  component: CohortesScreen,
});
