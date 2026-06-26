import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "../app/components/ui/button";

export const Route = createFileRoute("/error")({
  component: ErrorRoute,
});

function ErrorRoute() {
  const searchParams = new URLSearchParams(window.location.search);
  const msg = searchParams.get("msg") || "Ocurrió un error inesperado al procesar la solicitud.";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 p-6 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-destructive/15 text-destructive mb-6 shadow-sm">
        <AlertCircle className="h-10 w-10 animate-bounce" />
      </div>
      <h1 className="text-3xl font-bold text-foreground">Error de Sistema</h1>
      <p className="text-sm text-muted-foreground max-w-md mt-3 mb-4">
        {msg}
      </p>
      <div className="text-xs text-muted-foreground/70 bg-muted px-4 py-2 rounded border border-border/50 max-w-lg mb-8 font-mono break-all">
        Dispositivo: {navigator.userAgent}
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RotateCcw className="h-4 w-4 mr-1" /> Reintentar
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
