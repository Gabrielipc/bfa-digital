import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Brand } from "../../../app/components/brand";
import { Button } from "../../../app/components/ui/button";
import { Card, CardContent } from "../../../app/components/ui/card";
import { Badge } from "../../../app/components/ui/badge";
import { Alert, AlertDescription } from "../../../app/components/ui/alert";
import { AlertTriangle, ShieldCheck, ArrowLeft, CheckCircle2, Loader2, WifiOff } from "lucide-react";
import { participantService } from "../../../api/participantService";
import { useEvaluationStore } from "../../../store/evaluationStore";

export const Route = createFileRoute("/evaluacion/$token/resumen")({
  component: ResumenRoute,
});

function ResumenRoute() {
  const { token } = useParams({ from: "/evaluacion/$token/resumen" });
  const navigate = useNavigate();
  
  const accessData = useEvaluationStore((s) => s.accessData);
  const clearStore = useEvaluationStore((s) => s.clearStore);
  const syncQueue = useEvaluationStore((s) => s.syncQueue);
  const isOffline = useEvaluationStore((s) => s.isOffline);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Sincronizar en el mount y con eventos de red
  useEffect(() => {
    const handleOnline = async () => {
      await participantService.syncPendingAnswers(token);
    };

    window.addEventListener("online", handleOnline);

    if (syncQueue.length > 0) {
      participantService.syncPendingAnswers(token);
    }

    const interval = setInterval(() => {
      if (navigator.onLine && useEvaluationStore.getState().syncQueue.length > 0) {
        participantService.syncPendingAnswers(token);
      }
    }, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, [token, syncQueue.length]);

  if (!accessData) return null;

  const handleFinish = async () => {
    setErrorMessage("");
    if (syncQueue.length > 0) {
      setErrorMessage("Hay respuestas locales pendientes por conexión inestable. Intentando sincronizar antes de finalizar...");
      setLoading(true);
      try {
        await participantService.syncPendingAnswers(token);
        // Volver a verificar la cola
        const currentQueue = useEvaluationStore.getState().syncQueue;
        if (currentQueue.length > 0) {
          setErrorMessage("Aún no se ha podido restablecer la conexión. Espere o verifique su red.");
          setLoading(false);
          return;
        }
      } catch (err) {
        setErrorMessage("Error al sincronizar las respuestas. Por favor intente de nuevo.");
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      await participantService.finishEvaluation(token);
      
      // Limpiamos los estados de la prueba en cliente e indicamos éxito
      clearStore();
      
      navigate({ to: `/evaluacion/${token}/completada` });
    } catch (error: any) {
      setErrorMessage(error.message || "Error al finalizar la evaluación. Por favor intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl border-0 shadow-lg bg-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <Brand compact />
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Revisión final
            </Badge>
          </div>
          
          <h1 className="text-2xl font-bold text-primary mt-6">Resumen de su Evaluación</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verifique el estado de cada subtest antes de realizar la entrega definitiva.
          </p>

          <div className="mt-6 space-y-3">
            {accessData.subtests.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md border p-3.5 bg-muted/5">
                <div>
                  <span className="font-semibold text-foreground text-sm">{s.name}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{s.answeredItems} respondidos</span>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 fill-emerald-800 text-white" /> Completado
                </Badge>
              </div>
            ))}
          </div>

          {syncQueue.length > 0 && (
            <Alert variant="destructive" className="mt-6 border-rose-300 bg-rose-50 border-2">
              <WifiOff className="h-4 w-4 text-rose-800 animate-pulse" />
              <AlertDescription className="text-rose-950 text-xs font-bold leading-relaxed">
                Atención: Tiene {syncQueue.length} {syncQueue.length === 1 ? "respuesta pendiente" : "respuestas pendientes"} por sincronizar debido a problemas de conexión. Por favor, asegúrese de tener internet antes de finalizar la entrega definitiva.
              </AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs font-semibold">{errorMessage}</AlertDescription>
            </Alert>
          )}

          <Alert variant="destructive" className="mt-6 border-rose-200 bg-rose-50/50">
            <AlertTriangle className="h-4 w-4 text-rose-800" />
            <AlertDescription className="text-rose-900 text-xs font-semibold leading-relaxed">
              Al presionar "Finalizar evaluación", sus respuestas quedarán registradas oficialmente y la sesión se dará por concluida. No podrá modificar ninguna respuesta.
            </AlertDescription>
          </Alert>

          <div className="mt-6 flex justify-end gap-2.5">
            <Button variant="outline" asChild disabled={loading}>
              <Link to={`/evaluacion/${token}/subtests`}>
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Volver a revisar
              </Link>
            </Button>
            <Button 
              disabled={loading}
              onClick={handleFinish}
              className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Procesando entrega...</>
              ) : (
                "Finalizar evaluación"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
