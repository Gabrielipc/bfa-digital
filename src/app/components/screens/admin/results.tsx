import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { resultsService } from "../../../../api/resultsService";
import { useAdminStore } from "../../../../store/adminStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Eye, RefreshCw, Loader2, FileText } from "lucide-react";

export function ResultsScreen() {
  const sessions = useAdminStore((s) => s.sessions);
  const assignmentsBySession = useAdminStore((s) => s.assignments);
  const fetchSessions = useAdminStore((s) => s.fetchSessions);
  const fetchAssignments = useAdminStore((s) => s.fetchAssignments);

  const [selectedSessionId, setSelectedSessionId] = useState("ALL");
  const [resultsByAttempt, setResultsByAttempt] = useState<Record<number, any>>({});
  const [loadingResults, setLoadingResults] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Cargar sesiones al inicio
  useEffect(() => {
    fetchSessions().then(() => setLoading(false));
  }, [fetchSessions]);

  // Cargar asignaciones de todas las sesiones
  useEffect(() => {
    if (sessions.length > 0) {
      sessions.forEach((s) => {
        if (!assignmentsBySession[s.id]) {
          fetchAssignments(s.id);
        }
      });
    }
  }, [sessions, assignmentsBySession, fetchAssignments]);

  // Consolidar todos los intentos de las sesiones cargadas
  const allAttempts = useMemo(() => {
    const list: Array<{
      attemptId: number;
      participantId: string;
      participantName: string;
      sessionId: string;
      sessionName: string;
      state: string;
      progress: number;
    }> = [];

    sessions.forEach((s) => {
      // Filtrar si hay una sesión específica seleccionada
      if (selectedSessionId !== "ALL" && s.id !== selectedSessionId) {
        return;
      }

      const asgs = assignmentsBySession[s.id] || [];
      asgs.forEach((a) => {
        if (a.attemptId) {
          list.push({
            attemptId: a.attemptId,
            participantId: a.participantId,
            participantName: a.participantName,
            sessionId: s.id,
            sessionName: s.name,
            state: a.state,
            progress: a.overallProgress,
          });
        }
      });
    });

    return list;
  }, [sessions, assignmentsBySession, selectedSessionId]);

  // Consultar puntajes de intentos completados de forma asíncrona
  useEffect(() => {
    const completedWithoutResult = allAttempts.filter(
      (att) => 
        att.state === "completado" && 
        !resultsByAttempt[att.attemptId] && 
        !loadingResults[att.attemptId]
    );

    completedWithoutResult.forEach((att) => {
      const attemptId = att.attemptId;
      setLoadingResults((prev) => ({ ...prev, [attemptId]: true }));
      
      resultsService
        .getAttemptResult(attemptId)
        .then((res) => {
          setResultsByAttempt((prev) => ({ ...prev, [attemptId]: res }));
        })
        .catch((err) => {
          console.warn(`No se pudo obtener el resultado del intento #${attemptId}:`, err);
        })
        .finally(() => {
          setLoadingResults((prev) => ({ ...prev, [attemptId]: false }));
        });
    });
  }, [allAttempts, resultsByAttempt, loadingResults]);

  const handleRefresh = () => {
    setLoading(true);
    fetchSessions().then(() => {
      const promises = sessions.map((s) => fetchAssignments(s.id));
      Promise.all(promises).then(() => {
        setResultsByAttempt({});
        setLoading(false);
      });
    });
  };

  const renderAttemptState = (state: string) => {
    switch (state) {
      case "completado":
        return <Badge className="border-none bg-emerald-100 text-emerald-800 font-medium">Completado</Badge>;
      case "en-progreso":
        return <Badge className="border-none bg-blue-100 text-blue-800 font-medium">En progreso</Badge>;
      case "interrumpido":
        return <Badge className="border-none bg-amber-100 text-amber-800 font-medium">Interrumpido</Badge>;
      case "anulado":
        return <Badge className="border-none bg-rose-100 text-rose-800 font-medium">Anulado</Badge>;
      default:
        return <Badge className="border-none bg-slate-100 text-slate-700 font-medium">{state}</Badge>;
    }
  };

  if (loading) return <div className="text-center p-8">Cargando intentos y resultados...</div>;

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4 flex-wrap gap-4">
        <div>
          <CardTitle className="text-lg text-primary font-bold">Resultados y Auditoría de Intentos</CardTitle>
          <CardDescription className="text-xs mt-1">
            Consulta detallada de respuestas, puntajes globales y estado de las evaluaciones por sesión.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
        </Button>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Selector de Sesión */}
        <div className="max-w-xs">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Filtrar por Sesión
          </label>
          <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione una sesión" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las sesiones</SelectItem>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabla de Resultados */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6 font-semibold py-3">Participante</TableHead>
                <TableHead className="font-semibold py-3">Sesión</TableHead>
                <TableHead className="font-semibold py-3">Intento ID</TableHead>
                <TableHead className="font-semibold py-3">Estado</TableHead>
                <TableHead className="font-semibold py-3">Calificación</TableHead>
                <TableHead className="text-right pr-6 py-3 w-64">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allAttempts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                    No se encontraron intentos para mostrar.
                  </TableCell>
                </TableRow>
              ) : (
                allAttempts.map((att) => {
                  const result = resultsByAttempt[att.attemptId];
                  const isLoadingScore = loadingResults[att.attemptId];
                  
                  return (
                    <TableRow key={att.attemptId} className="hover:bg-muted/5 transition">
                      <TableCell className="pl-6 py-3.5">
                        <div className="font-semibold text-foreground">{att.participantName}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{att.participantId}</div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-muted-foreground">
                        {att.sessionName}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                        #{att.attemptId}
                      </TableCell>
                      <TableCell className="py-3.5">
                        {renderAttemptState(att.state)}
                      </TableCell>
                      <TableCell className="py-3.5 font-bold">
                        {isLoadingScore ? (
                          <span className="flex items-center text-xs text-muted-foreground font-medium">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Cargando
                          </span>
                        ) : result ? (
                          <span className="text-primary">{result.totalScore} pts</span>
                        ) : att.state === "completado" ? (
                          <span className="text-xs text-amber-600 font-semibold">Pendiente Calificar</span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Detalle de Respuestas (Nueva Pantalla) */}
                          <Button variant="outline" size="sm" asChild>
                            <Link to="/app/resultados/intento/$attemptId" params={{ attemptId: String(att.attemptId) }}>
                              <FileText className="h-3.5 w-3.5 mr-1" /> Respuestas
                            </Link>
                          </Button>
                          
                          {/* Reporte Baremo (Solo si está calificado) */}
                          {result && result.resultId ? (
                            <Button variant="outline" size="sm" className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary" asChild>
                              <Link to="/app/resultados/individual/$attemptId" params={{ attemptId: String(att.attemptId) }}>
                                <Eye className="h-3.5 w-3.5 mr-1" /> Baremo
                              </Link>
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" disabled title="Este intento aún no tiene un resultado de baremo calculado.">
                              Baremo
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

