import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { Brand } from "../../../app/components/brand";
import { Button } from "../../../app/components/ui/button";
import { Card, CardContent } from "../../../app/components/ui/card";
import { Badge } from "../../../app/components/ui/badge";
import { Separator } from "../../../app/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "../../../app/components/ui/alert";
import { ShieldCheck, BookOpen, ArrowRight } from "lucide-react";
import { useEvaluationStore } from "../../../store/evaluationStore";

export const Route = createFileRoute("/evaluacion/$token/bienvenida")({
  component: BienvenidaRoute,
});

function BienvenidaRoute() {
  const { token } = useParams({ from: "/evaluacion/$token/bienvenida" });
  const navigate = useNavigate();
  const accessData = useEvaluationStore((s) => s.accessData);

  if (!accessData) return null;

  const handleStart = () => {
    navigate({ to: `/evaluacion/${token}/subtests` });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl border-0 shadow-lg bg-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <Brand />
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Sesión autorizada
            </Badge>
          </div>
          
          <h1 className="text-2xl font-bold text-primary mt-6">Bienvenido/a a la evaluación BFA Digital</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Participante: <span className="text-foreground font-semibold">{accessData.participantDisplayName}</span> · Sesión: <span className="text-foreground font-semibold">{accessData.sessionName}</span>
          </p>

          <Separator className="my-6" />

          <div className="space-y-3">
            <div className="text-sm font-semibold text-foreground">Subtests habilitados en esta sesión:</div>
            {accessData.subtests.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 rounded-md border border-border p-3 hover:bg-muted/10 transition">
                <div className="h-8 w-8 rounded-full bg-accent text-primary flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-foreground">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.totalItems} ítems · Límite de tiempo: {s.timeLimitSeconds ? `${s.timeLimitSeconds / 60} minutos` : "Sin límite"}
                  </div>
                </div>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>

          <Alert className="mt-6 border-amber-200 bg-amber-50/50">
            <ShieldCheck className="h-4 w-4 text-amber-800" />
            <AlertTitle className="text-amber-800 font-semibold">Instrucciones y Confidencialidad</AlertTitle>
            <AlertDescription className="text-amber-900 text-xs mt-1 leading-relaxed">
              Lea cuidadosamente cada instrucción antes de responder. Sus respuestas se guardan automáticamente. Una vez finalizado cada subtest no podrá modificarlo. Está estrictamente prohibida la reproducción, copia o difusión de los reactivos de esta prueba.
            </AlertDescription>
          </Alert>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" asChild>
              <Link to="/evaluacion/acceso">Salir</Link>
            </Button>
            <Button 
              className="font-medium"
              onClick={handleStart}
            >
              Comenzar evaluación <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
