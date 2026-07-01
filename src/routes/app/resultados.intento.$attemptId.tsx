import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  Hash, 
  BookOpen, 
  Clock, 
  Activity, 
  Cpu, 
  Globe, 
  Info, 
  Check, 
  AlertTriangle 
} from "lucide-react";
import { resultsService, DetailedAttemptResultDTO } from "../../api/resultsService";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../app/components/ui/card";
import { Badge } from "../../app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../app/components/ui/tabs";
import { AuthenticatedImage } from "../../app/components/ui/authenticated-image";

export const Route = createFileRoute("/app/resultados/intento/$attemptId")({
  component: ResultadoIntentoDetalleRoute,
});

function ResultadoIntentoDetalleRoute() {
  const { attemptId } = useParams({ from: "/app/resultados/intento/$attemptId" });
  const [detail, setDetail] = useState<DetailedAttemptResultDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    resultsService.getDetailedAttemptResult(Number(attemptId))
      .then((data) => {
        setDetail(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener detalle del intento:", err);
        setError(err.message || "No se pudo cargar el resultado detallado del intento.");
        setLoading(false);
      });
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 min-h-[400px]">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Cargando desglose de respuestas...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/calificaciones">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver a calificaciones
          </Link>
        </Button>
        <Card className="border-rose-100 bg-rose-50/50">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-rose-500" />
            <h3 className="text-lg font-bold text-rose-900">Error al Cargar Detalle</h3>
            <p className="text-sm text-rose-700 max-w-md">{error || "No se encontró el intento especificado."}</p>
            <Button onClick={() => window.location.reload()} size="sm" variant="outline" className="mt-2">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helpers to resolve naming mapping inconsistencies defensively
  const getDemographics = () => {
    // Check root flat properties first
    const pName = (detail as any).participantName || "";
    const pCode = (detail as any).participantCode || "";
    const pCarrera = (detail as any).carrera || "";
    const pGrupo = (detail as any).academicGroup || (detail as any).grupo || "";
    const pCohorte = (detail as any).cohorte || "";

    // Fallback to nested demographics if flat root is missing
    const d = detail.demographics || {};
    const firstNames = d.firstNames || d.nombres || "";
    const lastNames = d.lastNames || d.apellidos || "";
    
    return {
      fullName: pName.trim() || `${firstNames} ${lastNames}`.trim() || "Participante Sin Nombre",
      code: pCode || d.code || d.codigo || "S/C",
      carrera: pCarrera || d.carrera || "No especificada",
      grupo: pGrupo || d.grupo || "S/G",
      cohorte: pCohorte || d.cohorte || "S/C",
    };
  };

  const getMetrics = () => {
    // Check root flat properties first
    const rawDur = (detail as any).totalTimeSeconds ?? (detail as any).durationSeconds ?? (detail as any).duracionSeconds ?? null;
    const ip = (detail as any).ipAddress || (detail as any).ip || null;
    const device = (detail as any).deviceInfo || (detail as any).dispositivo || null;
    const state = (detail as any).attemptStatus || (detail as any).estado || null;

    // Fallback to nested metrics if flat root is missing
    const m = detail.metrics || {};
    const fallbackDur = m.durationSeconds ?? m.duracionSeconds ?? m.duracion ?? null;
    const fallbackIp = m.ipAddress || m.ip || "No registrada";
    const fallbackDevice = m.deviceInfo || m.dispositivo || "No registrado";
    const fallbackState = m.state || m.estado || "EN_PROGRESO";

    const finalDur = rawDur !== null ? rawDur : fallbackDur;
    return {
      durationStr: finalDur !== null ? formatDuration(finalDur) : "Sin registrar",
      ip: ip || fallbackIp,
      device: device || fallbackDevice,
      state: (state || fallbackState).toUpperCase(),
    };
  };

  const getGlobalScores = () => {
    // Check root flat scores first
    const hasRootScores = (detail as any).totalScore !== undefined || (detail as any).correctCount !== undefined;
    
    if (hasRootScores) {
      return {
        totalDirectScore: (detail as any).totalScore ?? null,
        correctCount: (detail as any).correctCount ?? 0,
        incorrectCount: (detail as any).incorrectCount ?? 0,
        pendingCount: (detail as any).pendingReviewCount ?? 0,
      };
    }

    const gs = detail.globalScores;
    if (!gs) return null;
    return {
      totalDirectScore: gs.puntajeTotalDirecto ?? null,
      correctCount: gs.correctas ?? gs.cantidadCorrectas ?? null,
      incorrectCount: gs.incorrectas ?? gs.cantidadIncorrectas ?? null,
      pendingCount: gs.pendientesRevisionManual ?? gs.cantidadPendientesRevision ?? null,
    };
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getImageUrl = (images?: any[]): string | null => {
    if (!images || images.length === 0) return null;
    const img = images[0];
    return img.url || img.publicUrl || img.signedUrl || img.rutaPublica || null;
  };

  const demo = getDemographics();
  const metrics = getMetrics();
  const scores = getGlobalScores();
  const isFinished = metrics.state === "FINALIZADO" || metrics.state === "COMPLETADO";
  const isGraded = scores !== null;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Navegación y Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/calificaciones">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver a calificaciones
          </Link>
        </Button>
        <div className="flex gap-2">
          <Badge className={isFinished ? "bg-emerald-100 text-emerald-800 border-none font-semibold" : "bg-blue-100 text-blue-800 border-none font-semibold animate-pulse"}>
            Estado: {isFinished ? "Finalizado" : metrics.state}
          </Badge>
          {isGraded && (
            <Badge className={scores.pendingCount ? "bg-amber-100 text-amber-800 border-none font-semibold" : "bg-emerald-100 text-emerald-800 border-none font-semibold"}>
              {scores.pendingCount ? "Requiere Revisión" : "Calificado"}
            </Badge>
          )}
        </div>
      </div>

      {/* Grid de Información Principal */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Datos Demográficos */}
        <Card className="border-0 shadow-sm bg-white md:col-span-2">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base text-primary font-bold">Datos del Participante</CardTitle>
            <CardDescription className="text-xs">Información registrada en la sesión de aplicación</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4 pt-5">
            <div className="space-y-1 bg-muted/10 p-3 rounded-lg border">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                Nombres y Apellidos
              </span>
              <p className="text-sm font-semibold text-foreground truncate">{demo.fullName}</p>
            </div>
            <div className="space-y-1 bg-muted/10 p-3 rounded-lg border">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                Código / Matrícula
              </span>
              <p className="text-sm font-semibold text-foreground truncate">{demo.code}</p>
            </div>
            <div className="space-y-1 bg-muted/10 p-3 rounded-lg border">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                Carrera
              </span>
              <p className="text-sm font-semibold text-foreground truncate">{demo.carrera}</p>
            </div>
            <div className="space-y-1 bg-muted/10 p-3 rounded-lg border">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                Grupo & Cohorte
              </span>
              <p className="text-sm font-semibold text-foreground truncate">Grupo {demo.grupo} · {demo.cohorte}</p>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Aplicación */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base text-primary font-bold">Métricas del Intento</CardTitle>
            <CardDescription className="text-xs">Detalles del contexto de ejecución</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-xs">
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Duración
              </span>
              <span className="font-semibold text-foreground">{metrics.durationStr}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" /> Dirección IP
              </span>
              <span className="font-mono font-semibold text-foreground truncate max-w-[140px]" title={metrics.ip}>{metrics.ip}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5" /> Dispositivo
              </span>
              <span className="font-semibold text-foreground truncate max-w-[140px]" title={metrics.device}>{metrics.device}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" /> Intento ID
              </span>
              <span className="font-mono font-semibold text-foreground">#{attemptId}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultados Globales de Calificación */}
      {isGraded ? (
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base text-primary font-bold">Calificaciones Globales</CardTitle>
            <CardDescription className="text-xs">Resumen general de la calificación directa</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border bg-primary/5 text-center">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Puntaje Directo</div>
              <div className="text-2xl font-black text-primary mt-1">
                {scores.totalDirectScore !== null ? `${scores.totalDirectScore} pts` : "N/A"}
              </div>
            </div>
            <div className="p-4 rounded-xl border bg-emerald-50 text-center">
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Correctas</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {scores.correctCount !== null ? scores.correctCount : "0"}
              </div>
            </div>
            <div className="p-4 rounded-xl border bg-rose-50 text-center">
              <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Incorrectas</div>
              <div className="text-2xl font-black text-rose-700 mt-1">
                {scores.incorrectCount !== null ? scores.incorrectCount : "0"}
              </div>
            </div>
            <div className="p-4 rounded-xl border bg-amber-50 text-center">
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider font-semibold flex items-center justify-center gap-1">
                Pendientes {scores.pendingCount ? <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" /> : null}
              </div>
              <div className="text-2xl font-black text-amber-700 mt-1">
                {scores.pendingCount !== null ? scores.pendingCount : "0"}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-900 shadow-sm">
          <Info className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Intento no calificado o en progreso</span>
            Este intento aún no cuenta con un registro de calificación oficial. Las puntuaciones numéricas se mostrarán nulas, pero se listan todas las respuestas almacenadas hasta el momento para auditoría.
          </div>
        </div>
      )}

      {/* Desglose Detallado de Subtests y Reactivos */}
      <div className="space-y-4">
        <h3 className="text-base text-primary font-bold">Desglose de Reactivos por Subtest</h3>
        
        {detail.subtests.length === 0 ? (
          <Card className="border-0 shadow-sm bg-white p-8 text-center text-muted-foreground text-sm">
            Este test no contiene subtests registrados.
          </Card>
        ) : (
          <Tabs defaultValue={`subtest-${detail.subtests[0].id}`} className="w-full">
            {/* Lista de Pestañas de Subtests */}
            <div className="border-b overflow-x-auto max-w-full">
              <TabsList className="bg-transparent h-fit p-0 gap-4 flex w-max">
                {detail.subtests.map((sub) => {
                  const subId = sub.id || sub.subtestId || 0;
                  const name = sub.nombre || sub.name || `Subtest ${subId}`;
                  return (
                    <TabsTrigger 
                      key={`trigger-${subId}`} 
                      value={`subtest-${subId}`}
                      className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent shadow-none px-4 py-2 font-semibold text-sm hover:text-primary/80 transition"
                    >
                      {name}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Contenido de cada Subtest */}
            {detail.subtests.map((sub) => {
              const subId = sub.id || sub.subtestId || 0;
              const subName = sub.nombre || sub.name || `Subtest ${subId}`;
              const items = sub.items || [];
              
              return (
                <TabsContent key={`content-${subId}`} value={`subtest-${subId}`} className="space-y-6 pt-4 focus-visible:outline-none focus-visible:ring-0">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{subName}</h4>
                    <span className="text-xs text-muted-foreground font-semibold">Total reactivos: {items.length}</span>
                  </div>

                  <div className="space-y-6">
                    {items.length === 0 ? (
                      <div className="text-center py-10 border border-dashed rounded-xl bg-white text-muted-foreground text-sm">
                        No hay reactivos para mostrar en este subtest.
                      </div>
                    ) : (
                      items.map((item, index) => {
                        const itemId = item.id || item.itemId || 0;
                        const order = item.orden ?? item.order ?? (index + 1);
                        const promptText = item.enunciado || item.prompt || "";
                        const itemType = item.tipoItem || item.itemType || "";
                        const responseType = item.tipoRespuesta || item.responseType || "";
                        const itemImg = getImageUrl(item.images || item.imagenes);
                        
                        // Resolve selected and correct options from item and nested response object
                        const response = item.response || {};
                        const selectedIds = item.selectedOptionIds || [];
                        const isItemCorrect = response.isCorrect ?? item.correct ?? item.esCorrecto ?? null;
                        const itemScore = response.scoreObtained ?? item.puntaje ?? item.score ?? null;
                        const requiresReview = response.requiresManualReview ?? item.requiresManualReview ?? false;
                        
                        const textAnswer = response.textAnswer ?? item.textAnswer ?? null;
                        const numericAnswer = response.numericAnswer ?? item.numericAnswer ?? null;

                        return (
                          <Card key={`item-${itemId}`} className="border-0 shadow-sm bg-white overflow-hidden">
                            <CardHeader className="bg-muted/10 border-b pb-3 pt-4 px-5 flex flex-row items-center justify-between gap-4 flex-wrap">
                              <div className="space-y-0.5">
                                <CardTitle className="text-sm text-foreground font-bold">
                                  Reactivo #{order} <span className="font-mono text-xs text-muted-foreground font-medium">({itemType} / {responseType})</span>
                                </CardTitle>
                              </div>
                              <div className="flex items-center gap-2">
                                {requiresReview ? (
                                  <Badge className="bg-amber-100 text-amber-800 border-none font-semibold text-[10px]">
                                    <AlertTriangle className="h-3 w-3 mr-1" /> Revisión manual
                                  </Badge>
                                ) : isItemCorrect === true ? (
                                  <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold text-[10px]">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Correcto ({itemScore ?? 0} pts)
                                  </Badge>
                                ) : isItemCorrect === false ? (
                                  <Badge className="bg-rose-100 text-rose-800 border-none font-semibold text-[10px]">
                                    <XCircle className="h-3 w-3 mr-1" /> Incorrecto ({itemScore ?? 0} pts)
                                  </Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-700 border-none font-semibold text-[10px]">
                                    Sin calificar
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            
                            <CardContent className="p-5 space-y-4">
                              {/* Enunciado y sus imágenes */}
                              <div className="space-y-3">
                                {promptText && (
                                  <p className="text-sm font-semibold text-foreground leading-relaxed whitespace-pre-wrap">{promptText}</p>
                                )}
                                {itemImg && (
                                  <div className="border rounded-lg overflow-hidden bg-[#fbfbfb] p-2 max-w-lg">
                                    <AuthenticatedImage 
                                      src={itemImg} 
                                      alt={`Reactivo ${order}`}
                                      className="max-h-60 mx-auto object-contain rounded"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Opciones o Respuestas Abiertas */}
                              {responseType === "TEXTO_ABIERTO" || responseType === "NUMERICA" ? (
                                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                                  <div className="p-3 border rounded-lg bg-muted/10 space-y-1">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Respuesta del Participante</span>
                                    <p className="text-sm font-semibold text-foreground whitespace-pre-wrap">
                                      {responseType === "NUMERICA" ? (numericAnswer ?? "Sin responder") : (textAnswer ?? "Sin responder")}
                                    </p>
                                  </div>
                                  {isFinished && (
                                    <div className="p-3 border border-emerald-100 bg-emerald-50/20 rounded-lg space-y-1">
                                      <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Patrón Correcto Esperado</span>
                                      <p className="text-sm font-semibold text-emerald-900">
                                        {/* Since answer key is not fully structured in attempt result, we display correct flag */}
                                        {isItemCorrect === true ? "Coincide con patrón de calificación" : "Revisar reglas de clave de respuesta"}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                /* Listado de opciones de selección única, múltiple o verdadero/falso */
                                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                                  {(item.options || []).map((opt) => {
                                    const optId = opt.id || opt.optionId || 0;
                                    const optText = opt.texto || opt.text || "";
                                    const isSelected = opt.selected === true || selectedIds.includes(optId);
                                    const isCorrectOpt = opt.isCorrect ?? opt.correct ?? opt.esCorrecta ?? null;
                                    const optImg = getImageUrl(opt.images || opt.imagenes);

                                    // Determinar bordes e iconos basados en correctitud y selección
                                    let cardStyle = "border-muted-foreground/20 bg-white";
                                    let badgeEl = null;

                                    if (isSelected) {
                                      if (isCorrectOpt === true) {
                                        cardStyle = "border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500";
                                        badgeEl = (
                                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-semibold text-[9px] h-5 py-0 px-2 flex items-center gap-1 border-none shrink-0 ml-auto">
                                            <Check className="h-3 w-3" /> Seleccionada y Correcta
                                          </Badge>
                                        );
                                      } else if (isCorrectOpt === false) {
                                        cardStyle = "border-rose-500 bg-rose-50/20 ring-1 ring-rose-500";
                                        badgeEl = (
                                          <Badge className="bg-rose-600 hover:bg-rose-600 text-white font-semibold text-[9px] h-5 py-0 px-2 flex items-center gap-1 border-none shrink-0 ml-auto">
                                            <XCircle className="h-3 w-3" /> Seleccionada (Incorrecta)
                                          </Badge>
                                        );
                                      } else {
                                        // No calificado / en progreso / sin baremo de claves expuesto
                                        cardStyle = "border-primary bg-primary/5 ring-1 ring-primary";
                                        badgeEl = (
                                          <Badge className="bg-primary text-white font-semibold text-[9px] h-5 py-0 px-2 flex items-center gap-1 border-none shrink-0 ml-auto">
                                            Seleccionada
                                          </Badge>
                                        );
                                      }
                                    } else {
                                      if (isCorrectOpt === true && isFinished) {
                                        cardStyle = "border-emerald-300 bg-emerald-50/10 border-dashed";
                                        badgeEl = (
                                          <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 font-semibold text-[9px] h-5 py-0 px-2 flex items-center gap-1 border-none shrink-0 ml-auto">
                                            Correcta (No seleccionada)
                                          </Badge>
                                        );
                                      }
                                    }

                                    return (
                                      <div 
                                        key={`opt-${optId}`} 
                                        className={`flex flex-col p-3.5 border rounded-xl text-xs transition duration-200 ${cardStyle}`}
                                      >
                                        <div className="flex items-start gap-2.5">
                                          <span className="font-bold font-mono text-[10px] text-muted-foreground bg-muted/60 h-5 w-5 rounded-full flex items-center justify-center shrink-0">
                                            {opt.orden ?? opt.order ?? ""}
                                          </span>
                                          <div className="space-y-2 flex-grow min-w-0">
                                            {optText && (
                                              <p className="font-semibold text-foreground leading-snug break-words">{optText}</p>
                                            )}
                                            {optImg && (
                                              <div className="border rounded overflow-hidden max-w-[140px] bg-white p-1">
                                                <AuthenticatedImage 
                                                  src={optImg} 
                                                  alt={`Opción ${opt.orden}`}
                                                  className="max-h-20 object-contain mx-auto"
                                                />
                                              </div>
                                            )}
                                          </div>
                                          {badgeEl}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </div>
  );
}
