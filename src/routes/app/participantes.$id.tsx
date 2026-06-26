import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Hash, BookOpen, Clock, Activity } from "lucide-react";
import { useAdminStore } from "../../store/adminStore";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../app/components/ui/card";
import { Badge } from "../../app/components/ui/badge";

export const Route = createFileRoute("/app/participantes/$id")({
  component: ParticipantDetailRoute,
});

function ParticipantDetailRoute() {
  const { id } = useParams({ from: "/app/participantes/$id" });
  const navigate = useNavigate();

  const participant = useAdminStore((s) => s.participants.find(x => x.id === id));
  const sessions = useAdminStore((s) => s.sessions);
  const assignments = useAdminStore((s) => s.assignments);

  if (!participant) {
    return (
      <div className="space-y-6 text-center py-10">
        <h2 className="text-xl font-bold text-destructive">Error: Participante no encontrado</h2>
        <Button onClick={() => navigate({ to: "/app/participantes" })}>Volver a participantes</Button>
      </div>
    );
  }

  // Obtener historial de aplicaciones de este participante
  const history = sessions
    .map((s) => {
      const asg = (assignments[s.id] || []).find((a) => a.participantId === id);
      if (!asg) return null;
      return {
        sessionId: s.id,
        sessionName: s.name,
        date: s.date,
        state: asg.state,
        progress: asg.overallProgress,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const getSexLabel = (sex: string) => {
    if (sex === "F") return "Femenino";
    if (sex === "M") return "Masculino";
    return "Otro";
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case "no-iniciado":
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none font-medium">No iniciado</Badge>;
      case "en-progreso":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none font-medium">En progreso</Badge>;
      case "completado":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-medium">Completado</Badge>;
      case "interrumpido":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none font-medium">Interrumpido</Badge>;
      case "anulado":
        return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-none font-medium">Anulado</Badge>;
      default:
        return <Badge variant="outline">{state}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border shadow-sm">
        <Button variant="outline" size="sm" asChild className="h-9">
          <Link to="/app/participantes">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver a participantes
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-0 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center gap-4 border-b pb-4">
            <div className="h-14 w-14 rounded-full bg-primary/5 text-primary flex items-center justify-center text-lg font-bold shrink-0">
              {participant.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg text-primary font-bold truncate">{participant.name}</CardTitle>
              <CardDescription className="text-xs">ID de registro: {participant.id}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-x-6 gap-y-4 pt-5">
            <div className="space-y-1 bg-muted/20 p-2.5 rounded-lg border">
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-bold">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" /> Edad / Sexo
              </span>
              <p className="text-sm font-semibold text-foreground">{participant.age} años · {getSexLabel(participant.sex)}</p>
            </div>
            <div className="space-y-1 bg-muted/20 p-2.5 rounded-lg border">
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-bold">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" /> Carrera y Grupo
              </span>
              <p className="text-sm font-semibold text-foreground truncate">{participant.carrera} — Grupo {participant.grupo}</p>
            </div>
            <div className="space-y-1 bg-muted/20 p-2.5 rounded-lg border">
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-bold">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Fecha de Registro
              </span>
              <p className="text-sm font-semibold text-foreground">{participant.registeredAt}</p>
            </div>
            <div className="space-y-1 bg-muted/20 p-2.5 rounded-lg border">
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-bold">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Último Estado
              </span>
              <div className="pt-0.5">
                {getStateBadge(participant.latestAttemptStatus.toLowerCase())}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base text-primary font-bold">Historial de Aplicaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 pt-4">
            {history.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground bg-muted/20 border border-dashed rounded-lg">
                Sin historial de aplicaciones evaluativas.
              </div>
            ) : (
              history.map((h) => (
                <div key={h.sessionId} className="p-3 border rounded-lg text-xs space-y-1.5 bg-muted/20">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground truncate cursor-pointer hover:underline" onClick={() => navigate({ to: `/app/sesiones/${h.sessionId}` })}>
                      {h.sessionName}
                    </span>
                  </div>
                  <div className="text-muted-foreground font-medium flex items-center"><Calendar className="h-3.5 w-3.5 mr-1" />{h.date}</div>
                  <div className="flex items-center gap-2 pt-1">
                    {getStateBadge(h.state)}
                    <span className="text-[10px] text-muted-foreground font-semibold">({h.progress}% progreso)</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
