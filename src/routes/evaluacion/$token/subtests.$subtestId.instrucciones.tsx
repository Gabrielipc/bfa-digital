import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Brand } from "../../../app/components/brand";
import { Button } from "../../../app/components/ui/button";
import { Card, CardContent } from "../../../app/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../../../app/components/ui/alert";
import { Checkbox } from "../../../app/components/ui/checkbox";
import { Separator } from "../../../app/components/ui/separator";
import { Clock, Play, ArrowLeft, AlertTriangle } from "lucide-react";
import { participantService } from "../../../api/participantService";
import { useEvaluationStore } from "../../../store/evaluationStore";

export const Route = createFileRoute("/evaluacion/$token/subtests/$subtestId/instrucciones")({
  component: SubtestInstruccionesRoute,
});

const SUBTEST_DESCS: Record<string, { name: string; desc: string; details: string }> = {
  figuras: {
    name: "Figuras identicas",
    desc: "En este subtest se le presentara una figura modelo al centro de la pantalla. A continuacion vera cuatro opciones de respuesta. Debe buscar y seleccionar aquella figura que sea exactamente igual a la figura modelo.",
    details: "La velocidad y la precision son muy importantes. Asegurese de observar cuidadosamente cada detalle como lineas, curvas y sombras de la figura.",
  },
  desplazamiento: {
    name: "Desplazamiento",
    desc: "En esta prueba se le mostrara una figura original y se le presentara una indicacion sobre como se desplaza o gira. Debera elegir la opcion que represente adecuadamente la posicion final de la figura.",
    details: "El desplazamiento puede realizarse en direccion horizontal, vertical o rotacional. Visualice el movimiento mentalmente antes de marcar su eleccion.",
  },
  espacial: {
    name: "Espacial",
    desc: "Este subtest evalua su capacidad de orientacion espacial. Se le mostrara una figura tridimensional u orientada en un espacio plano, y debera reconocer cual de las opciones corresponde a la misma figura vista desde otra perspectiva o rotacion.",
    details: "Preste atencion a la rotacion angular y a la posicion relativa de los componentes de la figura para no confundirse con rotaciones espejo.",
  },
};

function SubtestInstruccionesRoute() {
  const { token, subtestId } = useParams({ from: "/evaluacion/$token/subtests/$subtestId/instrucciones" });
  const navigate = useNavigate();
  const accessData = useEvaluationStore((s) => s.accessData);
  const setActiveSubtestId = useEvaluationStore((s) => s.setActiveSubtestId);
  const setTimeLeft = useEvaluationStore((s) => s.setTimeLeft);

  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!accessData) return null;

  const subtest = accessData.subtests.find((s) => s.slug === subtestId || s.id === subtestId);
  const desc = SUBTEST_DESCS[subtestId] || {
    name: subtest?.name || "Subtest BFA",
    desc: subtest?.instructions || subtest?.description || "Instrucciones de aplicacion.",
    details: subtest?.description && subtest?.instructions ? subtest.description : "",
  };

  const handleStart = async () => {
    if (!confirmed) return;
    setLoading(true);
    try {
      await participantService.startSubtest(token, subtestId);

      setActiveSubtestId(subtestId);
      if (subtest?.timeLimitSeconds) {
        setTimeLeft(subtest.timeLimitSeconds);
      }

      const updatedSubtests = accessData.subtests.map((candidate) =>
        candidate.slug === subtestId || candidate.id === subtestId
          ? { ...candidate, status: "EN_PROGRESO" as const }
          : candidate,
      );
      useEvaluationStore.getState().setAccessData({
        ...accessData,
        subtests: updatedSubtests,
      });

      navigate({ to: `/evaluacion/${token}/subtests/${subtestId}/items/it-1` });
    } catch {
      alert("Error al iniciar el subtest. Por favor contacte al aplicador.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl border-0 shadow-lg bg-white">
        <CardContent className="p-8">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
            Subtest de Evaluacion
          </div>
          <h1 className="text-2xl font-bold text-primary mt-1">{desc.name}</h1>

          <Separator className="my-5" />

          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>{desc.desc}</p>
            {desc.details && <p className="bg-muted/30 p-3 rounded-md border text-xs italic">{desc.details}</p>}

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="rounded-md border p-3 bg-muted/10">
                <div className="text-xs text-muted-foreground">Reactivos en la prueba</div>
                <div className="text-lg font-bold text-foreground mt-1">{subtest?.totalItems || 0} Items</div>
              </div>
              <div className="rounded-md border p-3 bg-muted/10">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Tiempo limite</div>
                <div className="text-lg font-bold text-foreground mt-1">
                  {subtest?.timeLimitSeconds ? `${subtest.timeLimitSeconds / 60} minutos` : "Sin limite"}
                </div>
              </div>
            </div>
          </div>

          <Alert className="mt-6 border-amber-200 bg-amber-50/50">
            <AlertTriangle className="h-4 w-4 text-amber-800" />
            <AlertTitle className="text-amber-800 font-semibold">El temporizador iniciara de inmediato</AlertTitle>
            <AlertDescription className="text-amber-900 text-xs mt-1">
              Al presionar "Iniciar subtest", el tiempo limite comenzara a correr. No podra pausar el tiempo ni recargar la prueba para reiniciarlo.
            </AlertDescription>
          </Alert>

          <div className="mt-6 flex items-center gap-2">
            <Checkbox id="confirm" checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} />
            <label htmlFor="confirm" className="text-xs text-foreground cursor-pointer select-none font-semibold">
              He leido y comprendido las instrucciones de este subtest.
            </label>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <Button variant="ghost" asChild disabled={loading}>
              <Link to={`/evaluacion/${token}/subtests`}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Regresar
              </Link>
            </Button>
            <Button disabled={!confirmed || loading} onClick={handleStart}>
              {loading ? "Cargando..." : (
                <><Play className="h-3.5 w-3.5 mr-1.5 fill-current" /> Iniciar subtest</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
