import { useEffect, useState } from "react";
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
  
  // Cola local y red
  const isOffline = useEvaluationStore((s) => s.isOffline);
  const syncQueue = useEvaluationStore((s) => s.syncQueue);

  const [itemData, setItemData] = useState<ParticipantItemDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved" | "error">("saved");

  // Buscar el subtest correspondiente en la configuración
  const subtestInfo = accessData?.subtests.find((s) => s.id === subtestId);
  const totalItems = subtestInfo?.totalItems || 5;
  const currentOrdinal = parseInt(itemId.replace("it-", "")) || 1;

  // Cargar datos del reactivo
  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const item = await participantService.getItem(token, subtestId, itemId);
        setItemData(item);
        
        // Si hay una respuesta previamente registrada en el store local, la usamos.
        // De lo contrario, cargamos la que retorne la API si existe
        if (item.selectedOptionId && !answers[`${subtestId}-${itemId}`]) {
          setAnswer(subtestId, itemId, item.selectedOptionId);
        }
      } catch (error) {
        console.error("Error al cargar reactivo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [token, subtestId, itemId, setAnswer]);

  // Manejo del temporizador
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

  // Sincronizador de red automático en segundo plano
  useEffect(() => {
    const handleOnline = async () => {
      console.log("Navegador de vuelta online. Sincronizando lote...");
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

  // Manejador de fin de tiempo
  const handleTimeout = async () => {
    alert("¡El tiempo límite del subtest se ha agotado!");
    await finishSubtestFlow();
  };

  const finishSubtestFlow = async () => {
    // Si quedan respuestas pendientes de sincronizar en la cola local, bloquear finalización
    if (syncQueue.length > 0) {
      alert("No se puede finalizar el subtest. Hay respuestas pendientes por conexión inestable. Espere unos momentos a que se guarden.");
      setSavingState("saving");
      await participantService.syncPendingAnswers(token);
      setSavingState("saved");
      return;
    }

    try {
      await participantService.finishSubtest(token, subtestId);
      
      // Actualizar el estado en el store
      if (accessData) {
        const updatedSubtests = accessData.subtests.map((s) =>
          s.id === subtestId ? { ...s, status: "COMPLETADO" as const } : s
        );
        useEvaluationStore.getState().setAccessData({
          ...accessData,
          subtests: updatedSubtests,
        });
      }
      
      navigate({ to: `/evaluacion/${token}/subtests` });
    } catch (error) {
      alert("Error al finalizar el subtest. Intente de nuevo.");
    }
  };

  const handleSelectOption = async (optionId: string) => {
    setAnswer(subtestId, itemId, optionId);
    setSavingState("saving");
    try {
      await participantService.saveAnswer(token, subtestId, itemId, optionId);
      
      // Si la cola está limpia tras saveAnswer, marcar como guardado
      if (useEvaluationStore.getState().syncQueue.length === 0) {
        setSavingState("saved");
      } else {
        setSavingState("error"); // Indica que se encoló localmente por conexión
      }
      
      // Actualizar el número de respondidos en cliente
      if (accessData && subtestInfo) {
        const count = Object.keys(answers).filter(k => k.startsWith(`${subtestId}-`)).length + 
          (answers[`${subtestId}-${itemId}`] ? 0 : 1); // Sumar 1 si no estaba respondido
          
        const updatedSubtests = accessData.subtests.map((s) =>
          s.id === subtestId ? { ...s, answeredItems: count } : s
        );
        useEvaluationStore.getState().setAccessData({
          ...accessData,
          subtests: updatedSubtests,
        });
      }
    } catch (error) {
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

  if (!accessData || !subtestInfo) return null;

  const currentSelection = answers[`${subtestId}-${itemId}`] || itemData?.selectedOptionId;
  const progressPercent = (currentOrdinal / totalItems) * 100;
  
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const isTimeCritical = timeLeft < 30;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col overflow-hidden">
      {/* Test Runner Header */}
      <header className="border-b bg-white shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Brand compact />
          
          <div className="hidden sm:block text-sm">
            <div className="font-bold text-foreground text-primary">{subtestInfo.name}</div>
            <div className="text-xs text-muted-foreground font-semibold">Ítem {currentOrdinal} de {totalItems}</div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Indicador de guardado discreto */}
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
              {savingState === "saving" && (
                <><Loader2 className="h-3 w-3 animate-spin text-primary" /> Guardando...</>
              )}
              {savingState === "saved" && (
                <><Save className="h-3 w-3 text-emerald-600" /> Guardado</>
              )}
              {savingState === "error" && (
                <><AlertTriangle className="h-3 w-3 text-rose-600" /> Error al guardar</>
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

      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-rose-50 border-b border-rose-200 py-2.5 px-4 text-rose-900 transition-all duration-300">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <WifiOff className="h-4 w-4 text-rose-600 shrink-0 animate-pulse" />
              <span>Conexión inestable detectada. Sus respuestas se guardarán localmente hasta recuperar la señal.</span>
            </div>
            {syncQueue.length > 0 && (
              <Badge variant="destructive" className="bg-rose-600 text-white font-mono text-xs hover:bg-rose-600">
                {syncQueue.length} {syncQueue.length === 1 ? "pendiente" : "pendientes"}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Main Reactivo Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col justify-between max-w-5xl w-full mx-auto">
        <Card className="border-0 shadow-sm flex-1 flex flex-col bg-white">
          <CardContent className="p-6 md:p-8 flex-1 flex flex-col justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Ítem {currentOrdinal}</div>
              <h2 className="text-lg font-bold text-primary mt-1 leading-snug">
                {itemData?.prompt || "Observe la figura modelo y seleccione la opción idéntica."}
              </h2>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center min-h-[220px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Visualizador de Modelo (SVGs mock para simular las figuras de la BFA) */}
                <div className="my-6 rounded-lg border bg-muted/10 p-6 flex items-center justify-center select-none"
                  onContextMenu={(e) => e.preventDefault()}>
                  <FigureModel subtestId={subtestId} itemIndex={currentOrdinal} />
                </div>

                {/* Option Selector Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-auto">
                  {itemData?.options.map((opt, i) => {
                    const isSelected = currentSelection === opt.id;
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
                          <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}>
                            {opt.id}
                          </span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                        </div>
                        
                        <div className="mt-3 flex-1 flex items-center justify-center w-full">
                          <FigureOption subtestId={subtestId} optionIndex={i} itemIndex={currentOrdinal} subtle={!isSelected} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer Navigation Bar */}
      <footer className="border-t bg-white shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={handlePrev} disabled={currentOrdinal === 1 || loading}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Anterior
          </Button>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <ListChecks className="h-4 w-4" /> {
              Object.keys(answers).filter(k => k.startsWith(`${subtestId}-`)).length
            } de {totalItems} respondidos
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

// Modelos SVGs interactivos simulando BFA
function FigureModel({ subtestId, itemIndex }: { subtestId: string; itemIndex: number }) {
  if (subtestId === "figuras") {
    return (
      <svg width="200" height="100" viewBox="0 0 200 100" className="text-primary">
        <rect x="10" y="10" width="50" height="80" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="100" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="100" cy="50" r="8" fill="currentColor" />
        <polygon points="170,15 195,85 145,85" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (subtestId === "desplazamiento") {
    return (
      <svg width="200" height="100" viewBox="0 0 200 100" className="text-primary">
        <polygon points="30,20 80,20 80,80 30,80" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="110" y1="50" x2="150" y2="50" stroke="currentColor" strokeWidth="3" markerEnd="url(#arrow)" />
        <path d="M 110,50 A 20,20 0 0,1 150,50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3,3" />
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>
      </svg>
    );
  }
  // Espacial
  return (
    <svg width="200" height="100" viewBox="0 0 200 100" className="text-primary">
      <rect x="30" y="30" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="30" y1="30" x2="50" y2="10" stroke="currentColor" strokeWidth="2" />
      <line x1="70" y1="30" x2="90" y2="10" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="10" x2="90" y2="10" stroke="currentColor" strokeWidth="2" />
      <line x1="70" y1="70" x2="90" y2="50" stroke="currentColor" strokeWidth="2" />
      <line x1="90" y1="10" x2="90" y2="50" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// Opciones SVGs simulando respuestas
function FigureOption({ subtestId, optionIndex, itemIndex, subtle }: { subtestId: string; optionIndex: number; itemIndex: number; subtle: boolean }) {
  const color = subtle ? "text-muted-foreground" : "text-primary";
  const opacity = subtle ? 0.6 : 1;
  
  if (subtestId === "figuras") {
    // Opción correcta simulada es index 1 (B)
    if (optionIndex === 1) {
      return (
        <svg width="50" height="50" viewBox="0 0 50 50" className={color} style={{ opacity }}>
          <circle cx="25" cy="25" r="16" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="25" cy="25" r="5" fill="currentColor" />
        </svg>
      );
    }
    if (optionIndex === 0) {
      return (
        <svg width="50" height="50" viewBox="0 0 50 50" className={color} style={{ opacity }}>
          <rect x="10" y="10" width="30" height="30" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    }
    if (optionIndex === 2) {
      return (
        <svg width="50" height="50" viewBox="0 0 50 50" className={color} style={{ opacity }}>
          <circle cx="25" cy="25" r="16" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    }
    return (
      <svg width="50" height="50" viewBox="0 0 50 50" className={color} style={{ opacity }}>
        <polygon points="25,8 42,40 8,40" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (subtestId === "desplazamiento") {
    if (optionIndex === 0) {
      return (
        <svg width="50" height="50" viewBox="0 0 50 50" className={color} style={{ opacity }}>
          <polygon points="10,10 40,10 40,40 10,40" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    }
    // Correcto desplazado
    if (optionIndex === 2) {
      return (
        <svg width="50" height="50" viewBox="0 0 50 50" className={color} style={{ opacity }}>
          <polygon points="15,15 35,15 35,35 15,35" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    }
    return (
      <svg width="50" height="50" viewBox="0 0 50 50" className={color} style={{ opacity }}>
        <circle cx="25" cy="25" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  // Espacial
  if (optionIndex === 0) {
    return (
      <svg width="50" height="50" viewBox="0 0 50 50" className={color} style={{ opacity }}>
        <rect x="15" y="15" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" className={color} style={{ opacity }}>
      <rect x="10" y="10" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="10" y1="10" x2="25" y2="25" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
