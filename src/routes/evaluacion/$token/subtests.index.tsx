import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { Brand } from "../../../app/components/brand";
import { Button } from "../../../app/components/ui/button";
import { Card, CardContent } from "../../../app/components/ui/card";
import { Badge } from "../../../app/components/ui/badge";
import { Separator } from "../../../app/components/ui/separator";
import { ShieldCheck, BookOpen, Play, CheckCircle2, ArrowRight } from "lucide-react";
import { useEvaluationStore } from "../../../store/evaluationStore";

export const Route = createFileRoute("/evaluacion/$token/subtests/")({
  component: SubtestsRoute,
});

function SubtestsRoute() {
  const { token } = useParams({ from: "/evaluacion/$token/subtests/" });
  const navigate = useNavigate();
  const accessData = useEvaluationStore((s) => s.accessData);

  if (!accessData) return null;

  const handleStartSubtest = (subtestId: string) => {
    navigate({ to: `/evaluacion/${token}/subtests/${subtestId}/instrucciones` });
  };

  const allCompleted = accessData.subtests.every(s => s.status === "COMPLETADO");

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl border-0 shadow-lg bg-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <Brand compact />
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Sesión activa
            </Badge>
          </div>
          
          <h1 className="text-2xl font-bold text-primary mt-6">Subtests Habilitados</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Por favor, complete cada subtest habilitado en el orden indicado.
          </p>

          <Separator className="my-6" />

          <div className="space-y-4">
            {accessData.subtests.map((s, i) => {
              const isNoIniciado = s.status === "NO_INICIADO" || !s.status;
              const isEnProgreso = s.status === "EN_PROGRESO";
              const isCompletado = s.status === "COMPLETADO";

              return (
                <div key={s.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/5 transition gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      isCompletado ? "bg-emerald-100 text-emerald-800" : "bg-accent text-primary"
                    }`}>
                      {isCompletado ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.totalItems} ítems · Límite de tiempo: {s.timeLimitSeconds ? `${s.timeLimitSeconds / 60} minutos` : "Sin límite"}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isCompletado ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-none font-medium">Completado</Badge>
                    ) : isEnProgreso ? (
                      <Button size="sm" onClick={() => handleStartSubtest(s.id)} className="bg-blue-600 hover:bg-blue-700">
                        <Play className="h-3.5 w-3.5 mr-1.5 fill-current" /> Continuar
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleStartSubtest(s.id)}>
                        <Play className="h-3.5 w-3.5 mr-1.5 fill-current" /> Iniciar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-between items-center">
            <Button variant="ghost" asChild>
              <Link to={`/evaluacion/${token}/bienvenida`}>Volver</Link>
            </Button>
            {allCompleted && (
              <Button onClick={() => navigate({ to: `/evaluacion/${token}/resumen` })} className="bg-emerald-600 hover:bg-emerald-700 font-semibold">
                Revisar y Finalizar <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
