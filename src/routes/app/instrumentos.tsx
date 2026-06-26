import { createFileRoute } from "@tanstack/react-router";
import { InstrumentsScreen } from "../../app/components/screens/admin-screens";

export const Route = createFileRoute("/app/instrumentos")({
  component: InstrumentsScreen,
});
