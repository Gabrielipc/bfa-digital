import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "../../../app/components/ui/button";
import { Card, CardContent } from "../../../app/components/ui/card";

export const Route = createFileRoute("/evaluacion/$token/completada")({
  component: CompletadaRoute,
});

function CompletadaRoute() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md border-0 shadow-lg bg-white">
        <CardContent className="p-8 text-center space-y-5">
          <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner border border-emerald-50">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-primary">Evaluación Finalizada</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sus respuestas han sido transmitidas y registradas correctamente de forma segura.
            </p>
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3.5 rounded leading-relaxed border">
            Los resultados serán procesados automáticamente bajo los baremos oficiales y analizados por su docente/coordinador. Puede cerrar esta pestaña de forma segura.
          </div>

          <Button variant="outline" className="w-full" asChild>
            <Link to="/evaluacion/acceso">
              Volver al Inicio <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
