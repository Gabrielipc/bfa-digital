import { createFileRoute, Link } from "@tanstack/react-router";
import { Hourglass, RefreshCw } from "lucide-react";
import { Button } from "../app/components/ui/button";

export const Route = createFileRoute("/sesion-vencida")({
  component: SesionVencidaRoute,
});

function SesionVencidaRoute() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 p-6 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-warning/15 text-warning mb-6 shadow-sm border border-warning/10">
        <Hourglass className="h-10 w-10 text-yellow-600 animate-spin" style={{ animationDuration: "3s" }} />
      </div>
      <h1 className="text-3xl font-bold text-foreground">Sesión o Token Vencido</h1>
      <p className="text-sm text-muted-foreground max-w-md mt-3 mb-8">
        El enlace de acceso o el tiempo límite de esta evaluación ha expirado. Por favor, solicita una nueva asignación o extensión de tiempo al aplicador.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button asChild>
          <Link to="/evaluacion/acceso">
            <RefreshCw className="h-4 w-4 mr-1" /> Reintentar con otro código
          </Link>
        </Button>
      </div>
    </div>
  );
}
