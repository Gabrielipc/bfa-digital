import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "../app/components/ui/button";

export const Route = createFileRoute("/no-autorizado")({
  component: NoAutorizadoRoute,
});

function NoAutorizadoRoute() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 p-6 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-destructive/15 text-destructive mb-6 shadow-sm">
        <ShieldAlert className="h-10 w-10 animate-pulse" />
      </div>
      <h1 className="text-3xl font-bold text-foreground">Acceso No Autorizado</h1>
      <p className="text-sm text-muted-foreground max-w-md mt-3 mb-8">
        No cuenta con los permisos necesarios para acceder a esta sección. Si cree que esto es un error, por favor contacte al administrador del sistema.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button variant="outline" asChild>
          <Link to="..">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver atrás
          </Link>
        </Button>
        <Button asChild>
          <Link to="/">
            <Home className="h-4 w-4 mr-1" /> Ir al inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}
