import { createFileRoute } from "@tanstack/react-router";
import { AuditScreen } from "../../app/components/screens/admin/audit";

export const Route = createFileRoute("/app/auditoria")({
  component: AuditScreen,
});
