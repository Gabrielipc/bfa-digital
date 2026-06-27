import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../app/components/ui/alert";
import { Button } from "../../app/components/ui/button";

export const Route = createFileRoute("/app/instrumentos/$versionId/subtests/$subtestId")({
  component: SubtestRouteRedirectNotice,
});

function SubtestRouteRedirectNotice() {
  const { versionId } = useParams({ from: "/app/instrumentos/$versionId/subtests/$subtestId" });

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" asChild>
        <Link to="/app/instrumentos/$versionId" params={{ versionId }}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al editor de version
        </Link>
      </Button>
      <Alert>
        <AlertTitle>Configuracion unificada</AlertTitle>
        <AlertDescription>
          Los items y opciones ahora se configuran desde el editor principal de la version.
        </AlertDescription>
      </Alert>
    </div>
  );
}
