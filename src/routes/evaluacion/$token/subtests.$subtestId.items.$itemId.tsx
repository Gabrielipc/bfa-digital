import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Brand } from "../../../app/components/brand";
import { Button } from "../../../app/components/ui/button";
import { Card, CardContent } from "../../../app/components/ui/card";
import { Progress } from "../../../app/components/ui/progress";
import { Badge } from "../../../app/components/ui/badge";
import {
  Clock, CheckCircle2, AlertTriangle, WifiOff, Save, ArrowLeft, ArrowRight,
  Loader2, ListChecks
} from "lucide-react";
import { participantService, ParticipantItemDTO } from "../../../api/participantService";
import { ParticipantResourceDTO } from "../../../api/participantMappers";
import { useEvaluationStore } from "../../../store/evaluationStore";

export const Route = createFileRoute("/evaluacion/$token/subtests/$subtestId/items/$itemId")({
  component: SubtestItemRunnerRoute,
});

function SubtestItemRunnerRoute() {
  const { token, subtestId, itemId } = useParams({ from: "/evaluacion/$token/subtests/$subtestId/items/$itemId" });
  const navigate = useNavigate();

  const accessData = useEvaluationStore((s) => s.accessData);
  const timeLeft = useEvaluationStore((s) => s.timeLeft);
  const setTimeLeft = useEvaluationStore((s) => s.setTimeLeft);
  const answers = useEvaluationStore((s) => s.answers);
  const setAnswer = useEvaluationStore((s) => s.setAnswer);
  const isOffline = useEvaluationStore((s) => s.isOffline);
  const syncQueue = useEvaluationStore((s) => s.syncQueue);

  const [itemData, setItemData] = useState<ParticipantItemDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved" | "error">("saved");

  const subtestInfo = accessData?.subtests.find((s) => s.slug === subtestId || s.id === subtestId);
  const totalItems = subtestInfo?.totalItems || 0;
  const currentOrdinal = Number(itemId.replace("it-", "")) || 1;
  const answerKey = itemData ? `${subtestId}-${itemData.itemId}` : `${subtestId}-${itemId}`;

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const item = await participantService.getItem(token, subtestId, itemId);
        setItemData(item);

        if (item.selectedOptionId && !answers[`${subtestId}-${item.itemId}`]) {
          setAnswer(subtestId, item.itemId, item.selectedOptionId);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Error al cargar reactivo.";
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [token, subtestId, itemId, setAnswer]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, setTimeLeft]);

  useEffect(() => {
    const handleOnline = async () => {
      await participantService.syncPendingAnswers(token);
    };

    window.addEventListener("online", handleOnline);

    const checkInterval = setInterval(async () => {
      if (navigator.onLine && syncQueue.length > 0) {
        setSavingState("saving");
        await participantService.syncPendingAnswers(token);
        setSavingState("saved");
      }
    }, 7000);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(checkInterval);
    };
  }, [token, syncQueue.length]);

  const handleTimeout = async () => {
    alert("El tiempo limite del subtest se ha agotado.");
    await finishSubtestFlow();
  };

  const finishSubtestFlow = async () => {
    if (syncQueue.length > 0) {
      alert("No se puede finalizar el subtest. Hay respuestas pendientes por conexion inestable. Espere unos momentos a que se guarden.");
      setSavingState("saving");
      await participantService.syncPendingAnswers(token);
      setSavingState("saved");
      return;
    }

    try {
      await participantService.finishSubtest(token, subtestId);

      if (accessData) {
        const updatedSubtests = accessData.subtests.map((s) =>
          s.slug === subtestId || s.id === subtestId ? { ...s, status: "COMPLETADO" as const } : s
        );
        useEvaluationStore.getState().setAccessData({
          ...accessData,
          subtests: updatedSubtests,
        });
      }

      navigate({ to: `/evaluacion/${token}/subtests` });
    } catch {
      alert("Error al finalizar el subtest. Intente de nuevo.");
    }
  };

  const handleSelectOption = async (optionId: string) => {
    if (!itemData) return;

    setAnswer(subtestId, itemData.itemId, optionId);
    setSavingState("saving");
    try {
      await participantService.saveAnswer(token, subtestId, itemData.itemId, optionId);

      if (useEvaluationStore.getState().syncQueue.length === 0) {
        setSavingState("saved");
      } else {
        setSavingState("error");
      }

      if (accessData && subtestInfo) {
        const previousAnswerCount = Object.keys(answers).filter(k => k.startsWith(`${subtestId}-`)).length;
        const count = previousAnswerCount + (answers[answerKey] ? 0 : 1);

        const updatedSubtests = accessData.subtests.map((s) =>
          s.slug === subtestId || s.id === subtestId ? { ...s, answeredItems: count } : s
        );
        useEvaluationStore.getState().setAccessData({
          ...accessData,
          subtests: updatedSubtests,
        });
      }
    } catch {
      setSavingState("error");
    }
  };

  const handleNext = () => {
    if (currentOrdinal < totalItems) {
      navigate({ to: `/evaluacion/${token}/subtests/${subtestId}/items/it-${currentOrdinal + 1}` });
    }
  };

  const handlePrev = () => {
    if (currentOrdinal > 1) {
      navigate({ to: `/evaluacion/${token}/subtests/${subtestId}/items/it-${currentOrdinal - 1}` });
    }
  };

  const answeredCount = useMemo(
    () => Object.keys(answers).filter(k => k.startsWith(`${subtestId}-`)).length,
    [answers, subtestId],
  );

  if (!accessData || !subtestInfo) return null;

  const currentSelection = answers[answerKey] || itemData?.selectedOptionId;
  const progressPercent = totalItems > 0 ? (currentOrdinal / totalItems) * 100 : 0;

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const isTimeCritical = timeLeft < 30;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col overflow-hidden">
      <header className="border-b bg-white shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Brand compact />

          <div className="hidden sm:block text-sm">
            <div className="font-bold text-foreground text-primary">{subtestInfo.name}</div>
            <div className="text-xs text-muted-foreground font-semibold">Item {currentOrdinal} de {totalItems}</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
              {savingState === "saving" && (
                <><Loader2 className="h-3 w-3 animate-spin text-primary" /> Guardando...</>
              )}
              {savingState === "saved" && (
                <><Save className="h-3 w-3 text-emerald-600" /> Guardado</>
              )}
              {savingState === "error" && (
                <><AlertTriangle className="h-3 w-3 text-rose-600" /> Pendiente</>
              )}
            </div>

            <div className={`flex items-center gap-1.5 text-sm font-mono font-bold px-3 py-1.5 rounded transition ${
              isTimeCritical ? "bg-rose-100 text-rose-800 animate-pulse border border-rose-200" : "bg-muted text-foreground"
            }`}>
              <Clock className="h-4 w-4 text-primary shrink-0" /> {mm}:{ss}
            </div>
          </div>
        </div>
        <Progress value={progressPercent} className="h-1 rounded-none bg-muted" />
      </header>

      {isOffline && (
        <div className="bg-rose-50 border-b border-rose-200 py-2.5 px-4 text-rose-900 transition-all duration-300">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <WifiOff className="h-4 w-4 text-rose-600 shrink-0 animate-pulse" />
              <span>Conexion inestable detectada. Sus respuestas se guardaran localmente hasta recuperar la senal.</span>
            </div>
            {syncQueue.length > 0 && (
              <Badge variant="destructive" className="bg-rose-600 text-white font-mono text-xs hover:bg-rose-600">
                {syncQueue.length} {syncQueue.length === 1 ? "pendiente" : "pendientes"}
              </Badge>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col justify-between max-w-5xl w-full mx-auto">
        <Card className="border-0 shadow-sm flex-1 flex flex-col bg-white">
          <CardContent className="p-6 md:p-8 flex-1 flex flex-col justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Item {currentOrdinal}</div>
              <h2 className="text-lg font-bold text-primary mt-1 leading-snug">
                {itemData?.prompt || "Seleccione la respuesta correspondiente."}
              </h2>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center min-h-[220px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : loadError ? (
              <div className="my-6 rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
                {loadError}
              </div>
            ) : itemData ? (
              <>
                {(itemData.instruction || itemData.resources.length > 0) && (
                  <div
                    className="my-6 rounded-lg border bg-muted/10 p-6 select-none"
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {itemData.instruction && (
                      <p className="text-sm text-muted-foreground font-medium mb-4">{itemData.instruction}</p>
                    )}
                    <ResourceList resources={itemData.resources} />
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-auto">
                  {itemData.options.map((opt, index) => {
                    const isSelected = currentSelection === opt.id;
                    const label = opt.label || String.fromCharCode(65 + index);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`group rounded-lg border p-4 text-left transition select-none flex flex-col justify-between min-h-[140px] ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/20 bg-accent/30"
                            : "hover:border-primary/40 bg-white border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`h-6 min-w-6 px-1 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}>
                            {label}
                          </span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                        </div>

                        <div className="mt-3 flex-1 flex flex-col items-center justify-center w-full gap-3">
                          {opt.text && <div className="text-sm font-medium text-center text-foreground">{opt.text}</div>}
                          <ResourceList resources={opt.resources} compact />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </main>

      <footer className="border-t bg-white shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={handlePrev} disabled={currentOrdinal === 1 || loading}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Anterior
          </Button>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <ListChecks className="h-4 w-4" /> {answeredCount} de {totalItems} respondidos
          </div>

          {currentOrdinal === totalItems ? (
            <Button onClick={finishSubtestFlow} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 font-semibold">
              Finalizar subtest
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={loading}>
              Siguiente <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

function ResourceList({ resources, compact = false }: { resources: ParticipantResourceDTO[]; compact?: boolean }) {
  if (resources.length === 0) {
    return null;
  }

  return (
    <div className={`w-full ${compact ? "space-y-2" : "space-y-4"}`}>
      {resources.map((resource) => (
        <ResourceView key={resource.id} resource={resource} compact={compact} />
      ))}
    </div>
  );
}

function ResourceView({ resource, compact }: { resource: ParticipantResourceDTO; compact: boolean }) {
  if (resource.kind === "TEXT") {
    return (
      <div className={`text-center text-foreground whitespace-pre-wrap ${compact ? "text-sm" : "text-base"}`}>
        {resource.text || resource.url}
      </div>
    );
  }

  if (!resource.url) return null;

  return (
    <img
      src={resource.url}
      alt={resource.altText || ""}
      draggable={false}
      className={`mx-auto object-contain select-none ${compact ? "max-h-28 max-w-full" : "max-h-[360px] max-w-full"}`}
    />
  );
}
