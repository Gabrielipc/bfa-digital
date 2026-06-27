import { createFileRoute, useParams } from "@tanstack/react-router";
import { InstrumentVersionEditorScreen } from "../../app/components/instruments/instrument-builder";

export const Route = createFileRoute("/app/instrumentos/$versionId")({
  component: InstrumentVersionRoute,
});

function InstrumentVersionRoute() {
  const { versionId } = useParams({ from: "/app/instrumentos/$versionId" });
  return <InstrumentVersionEditorScreen testId={versionId} />;
}
