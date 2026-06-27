import { createFileRoute } from "@tanstack/react-router";
import { GruposScreen } from "../../app/components/screens/catalog-screens";

export const Route = createFileRoute("/app/grupos")({
  component: GruposScreen,
});
