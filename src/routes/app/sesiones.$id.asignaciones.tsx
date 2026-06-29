import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, Copy, Check, Trash2, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useAdminStore } from "../../store/adminStore";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../app/components/ui/table";
import { Badge } from "../../app/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../app/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../app/components/ui/select";
import { Alert, AlertDescription } from "../../app/components/ui/alert";

export const Route = createFileRoute("/app/sesiones/$id/asignaciones")({
  component: SessionAsignacionesRoute,
});

function SessionAsignacionesRoute() {
  const { id } = useParams({ from: "/app/sesiones/$id/asignaciones" });
  const navigate = useNavigate();
  
  const session = useAdminStore((s) => s.sessions.find(x => x.id === id));
  const assignments = useAdminStore((s) => s.assignments[id] || []);
  const allParticipants = useAdminStore((s) => s.participants);
  
  const assignParticipantToSession = useAdminStore((s) => s.assignParticipantToSession);
  const revokeAssignment = useAdminStore((s) => s.revokeAssignment);

  const fetchSessions = useAdminStore((s) => s.fetchSessions);
  const fetchParticipants = useAdminStore((s) => s.fetchParticipants);
  const fetchAssignments = useAdminStore((s) => s.fetchAssignments);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSessions();
    fetchParticipants();
    fetchAssignments(id);
  }, [id]);

  const handleCopy = (token: string, key: string) => {
    if (token.endsWith("***")) return;
    const url = `${window.location.origin}/evaluacion/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddParticipant = async () => {
    if (!selectedPartId) return;
    try {
      setError("");
      await assignParticipantToSession(id, selectedPartId);
      setSelectedPartId("");
      setIsAddDialogOpen(false);
    } catch (err: any) {
      setError(`Error al asignar participante: ${err.message}`);
    }
  };

  const handleRevoke = async (assignmentId: number) => {
    try {
      setError("");
      await revokeAssignment(id, assignmentId);
    } catch (err: any) {
      setError(`Error al revocar asignación: ${err.message}`);
    }
  };

  if (!session) {
    return (
      <div className="space-y-6 text-center py-10">
        <h2 className="text-xl font-bold text-destructive">Error: Sesión no encontrada</h2>
        <Button onClick={() => navigate({ to: "/app/sesiones" })}>Volver a sesiones</Button>
      </div>
    );
  }

  // Filtrar participantes que no estén ya asignados a esta sesión
  const availableParticipants = allParticipants.filter(
    (p) => !assignments.some((asg) => asg.participantId === p.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border shadow-sm">
        <Button variant="outline" size="sm" asChild className="h-9">
          <Link to={`/app/sesiones/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver al monitor
          </Link>
        </Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 border-b pb-4">
          <div>
            <CardTitle className="text-lg text-primary font-bold">Asignaciones y Tokens - Sesión {session.id}</CardTitle>
            <CardDescription className="text-xs">Gestión de accesos individuales y enlaces seguros para participantes.</CardDescription>
          </div>
          {session.status !== "FINALIZADA" && (
            <Button size="sm" className="h-9" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Agregar Participante
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6 font-semibold py-3">Participante</TableHead>
                <TableHead className="font-semibold py-3">Token Seguro</TableHead>
                <TableHead className="font-semibold py-3">Estado Enlace</TableHead>
                <TableHead className="font-semibold py-3">Estado Evaluación</TableHead>
                <TableHead className="w-60 text-right pr-6 py-3">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Ningún participante asignado a esta sesión.
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((a) => (
                  <TableRow key={a.participantId} className="hover:bg-muted/5 transition">
                    <TableCell className="pl-6 py-3.5">
                      <div>
                        <div className="font-semibold text-foreground text-sm">{a.participantName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono font-medium">{a.participantId}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <code className="font-mono text-xs text-muted-foreground bg-muted/50 border px-2 py-0.5 rounded select-all">
                        {a.token}
                      </code>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Badge className={
                        a.status === "GENERADO" ? "bg-emerald-50 text-emerald-700 border-emerald-100 font-semibold" :
                        a.status === "ACTIVO" ? "bg-blue-50 text-blue-700 border-blue-100 font-semibold" :
                        a.status === "VENCIDO" ? "bg-amber-50 text-amber-700 border-amber-100 font-semibold" :
                        "bg-rose-50 text-rose-700 border-rose-100 font-semibold"
                      }>
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Badge variant="outline" className="capitalize text-xs font-semibold">
                        {a.state.replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => handleCopy(a.token, a.participantId)}
                          disabled={a.status !== "GENERADO" && a.status !== "ACTIVO"}
                        >
                          {copiedId === a.participantId ? (
                            <><Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Copiado</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5 mr-1" /> Copiar Enlace</>
                          )}
                        </Button>
                        
                        {(a.status === "GENERADO" || a.status === "ACTIVO") && session.status !== "FINALIZADA" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 text-destructive hover:bg-destructive/5 hover:text-destructive"
                            onClick={() => handleRevoke(a.assignmentId)}
                          >
                            <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Revocar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* modal to add participant on the fly */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Participante</DialogTitle>
            <DialogDescription>
              Asigne un nuevo participante a esta sesión en caliente. Se le generará un token de acceso al instante.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Seleccionar Participante</label>
            {availableParticipants.length === 0 ? (
              <div className="text-sm text-center py-4 text-muted-foreground border rounded-lg bg-muted/10">
                No hay participantes disponibles para asignar. Todos ya forman parte de esta sesión.
              </div>
            ) : (
              <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione un participante" />
                </SelectTrigger>
                <SelectContent>
                  {availableParticipants.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.id}) — {p.carrera}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddParticipant} disabled={!selectedPartId}>Generar Acceso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
