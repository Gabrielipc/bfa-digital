import { createFileRoute } from "@tanstack/react-router";
import { ParticipantsScreen } from "../../app/components/screens/admin/participants";

export const Route = createFileRoute("/app/participantes/")({
  component: ParticipantsScreen,
});
