import { createFileRoute } from "@tanstack/react-router";
import { CarrerasScreen } from "../../app/components/screens/catalog-screens";

export const Route = createFileRoute("/app/carreras")({
  component: CarrerasScreen,
});
