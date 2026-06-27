import { createFileRoute } from "@tanstack/react-router";
import { SexosScreen } from "../../app/components/screens/catalog-screens";

export const Route = createFileRoute("/app/sexos")({
  component: SexosScreen,
});
