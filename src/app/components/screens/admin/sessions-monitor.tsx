import { useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAdminStore, Session } from "../../../../store/adminStore";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Progress } from "../../ui/progress";
import { Plus, Calendar, MapPin, Users, Activity, Pause, Play, XCircle } from "lucide-react";

export function SessionsMonitorScreen() {
  const navigate = useNavigate();
  const sessions = useAdminStore((s) => s.sessions);
  const assignments = useAdminStore((s) => s.assignments);
  const updateSessionStatus = useAdminStore((s) => s.updateSessionStatus);
  const fetchSessions = useAdminStore((s) => s.fetchSessions);

  useEffect(() => {
    fetchSessions();
  }, []);

  const getStatusBadge = (status: Session["status"]) => {
    switch (status) {
      case "ACTIVA":
        return <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold">Activa (En vivo)</Badge>;
      case "PLANIFICADA":
        return <Badge className="bg-slate-100 text-slate-700 border-none font-semibold">Planificada</Badge>;
      case "PAUSADA":
        return <Badge className="bg-amber-100 text-amber-800 border-none font-semibold">Pausada</Badge>;
      case "FINALIZADA":
        return <Badge className="bg-muted text-muted-foreground border-none font-semibold">Finalizada</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-primary">Sesiones Evaluativas</h2>
          <p className="text-xs text-muted-foreground">Listado de controles grupales del sistema.</p>
        </div>
        <Button onClick={() => navigate({ to: "/app/sesiones/nueva" })} size="sm" className="h-9">
          <Plus className="h-4 w-4 mr-1" /> Nueva Sesión
        </Button>
      </div>

      <div className="grid gap-4">
        {sessions.map((s) => {
          const asgs = assignments[s.id] || [];
          const completedCount = asgs.filter(a => a.state === "completado").length;
          const inProgressCount = asgs.filter(a => a.state === "en-progreso").length;
          const interruptedCount = asgs.filter(a => a.state === "interrumpido").length;
          
          // Progreso promedio general de los participantes
          const avgProgress = asgs.length > 0 
            ? Math.round(asgs.reduce((acc, curr) => acc + curr.overallProgress, 0) / asgs.length) 
            : 0;

          return (
            <Card key={s.id} className="border-0 shadow-sm hover:shadow transition-all bg-white duration-200">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-base font-bold text-primary hover:underline cursor-pointer truncate" onClick={() => navigate({ to: `/app/sesiones/${s.id}` })}>
                      {s.name}
                    </span>
                    <Badge variant="outline" className="text-xs font-mono font-normal">{s.code}
                  </Badge>
                    {getStatusBadge(s.status)}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> {s.date} · {s.time}</span>
                    <span className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> {s.location}</span>
                    <span className="flex items-center"><Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> {asgs.length} participantes</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {s.subtests.map((sub) => (
                      <Badge key={sub} variant="outline" className="text-[10px] capitalize bg-muted/20 border-muted font-medium">
                        {sub === "figuras" ? "Figuras idénticas" : sub}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 md:shrink-0">
                  {asgs.length > 0 && (
                    <div className="space-y-1.5 w-full sm:w-44">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Progreso medio:</span>
                        <span className="text-primary">{avgProgress}%</span>
                      </div>
                      <Progress value={avgProgress} className="h-1.5" />
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground/80">
                        <span className="text-emerald-600">{completedCount} listos</span>
                        <span className="text-blue-600">{inProgressCount} activos</span>
                        {interruptedCount > 0 && <span className="text-amber-600">{interruptedCount} caídos</span>}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                    {s.status === "PLANIFICADA" && (
                      <Button variant="outline" size="sm" onClick={() => updateSessionStatus(s.id, "ACTIVA")}>
                        <Activity className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Iniciar
                      </Button>
                    )}
                    {s.status === "ACTIVA" && (
                      <Button variant="outline" size="sm" className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800" onClick={() => updateSessionStatus(s.id, "PAUSADA")}>
                        <Pause className="h-3.5 w-3.5 mr-1" /> Pausar
                      </Button>
                    )}
                    {s.status === "PAUSADA" && (
                      <Button variant="outline" size="sm" className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800" onClick={() => updateSessionStatus(s.id, "ACTIVA")}>
                        <Play className="h-3.5 w-3.5 mr-1" /> Reanudar
                      </Button>
                    )}
                    {(s.status === "ACTIVA" || s.status === "PAUSADA") && (
                      <Button variant="outline" size="sm" className="border-destructive/20 text-destructive hover:bg-destructive/5" onClick={() => updateSessionStatus(s.id, "FINALIZADA")}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Cerrar
                      </Button>
                    )}
                    <Button size="sm" asChild className="h-9 shadow-sm bg-primary hover:bg-primary/95 text-white">
                      <Link to={`/app/sesiones/${s.id}`}>
                        Monitorear
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
