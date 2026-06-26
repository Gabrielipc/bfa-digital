import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Database, AlertTriangle, ShieldAlert, CloudUpload, Play, ArrowDown, Trash2 } from "lucide-react";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../app/components/ui/table";
import { Badge } from "../../app/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../../app/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../app/components/ui/dialog";
import { Input } from "../../app/components/ui/input";

export const Route = createFileRoute("/app/respaldos")({
  component: RespaldosRoute,
});

function RespaldosRoute() {
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState([
    { id: "bak-2026-06-20", name: "BFA_Backup_2026_06_20.sql", size: "18.4 MB", type: "AUTOMATICO", date: "2026-06-20 03:00" },
    { id: "bak-2026-06-19", name: "BFA_Backup_2026_06_19.sql", size: "18.3 MB", type: "AUTOMATICO", date: "2026-06-19 03:00" },
    { id: "bak-2026-06-15-manual", name: "BFA_Manual_Pre_Publicacion_v2.sql", size: "17.9 MB", type: "MANUAL", date: "2026-06-15 15:42" },
  ]);
  const [confirmText, setConfirmText] = useState("");
  const [activeBackup, setActiveBackup] = useState<any>(null);

  const handleCreateBackup = () => {
    setLoading(true);
    setTimeout(() => {
      const now = new Date();
      const formatNumber = (num: number) => String(num).padStart(2, "0");
      const dateStr = `${now.getFullYear()}_${formatNumber(now.getMonth() + 1)}_${formatNumber(now.getDate())}`;
      const timeStr = `${formatNumber(now.getHours())}:${formatNumber(now.getMinutes())}`;
      
      const newBak = {
        id: `bak-${Date.now()}`,
        name: `BFA_Manual_${dateStr}.sql`,
        size: "18.5 MB",
        type: "MANUAL",
        date: `${now.getFullYear()}-${formatNumber(now.getMonth() + 1)}-${formatNumber(now.getDate())} ${timeStr}`
      };
      setBackups([newBak, ...backups]);
      setLoading(false);
    }, 2000);
  };

  const handleRestore = (id: string) => {
    alert(`Iniciando restauración de respaldo: ${id}. Se recargará el sistema al finalizar.`);
    setConfirmText("");
    setActiveBackup(null);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle>Historial de Respaldos</CardTitle>
              <CardDescription>Visualice y administre copias de seguridad de la base de datos.</CardDescription>
            </div>
            <Button size="sm" onClick={handleCreateBackup} disabled={loading}>
              {loading ? "Creando..." : (
                <><CloudUpload className="h-4 w-4 mr-1.5" /> Generar Respaldo Manual</>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Archivo de Respaldo</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-xs font-semibold">{b.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{b.size}</TableCell>
                    <TableCell>
                      <Badge className={b.type === "MANUAL" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}>
                        {b.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{b.date}</TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-1.5">
                      <Button variant="ghost" size="icon" title="Descargar archivo">
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:text-destructive hover:bg-destructive/15 text-muted-foreground" onClick={() => setActiveBackup(b)}>
                            <Play className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-destructive">
                              <ShieldAlert className="h-5 w-5" /> ¿Restaurar Base de Datos?
                            </DialogTitle>
                            <DialogDescription>
                              Esta acción es irreversible y sobrescribirá todas las respuestas actuales de los participantes, sesiones, reactivos y baremos con el estado almacenado en este archivo.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 my-2">
                            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive-foreground">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              <AlertTitle className="text-destructive font-bold text-xs uppercase tracking-wide">Peligro: Pérdida potencial de datos</AlertTitle>
                              <AlertDescription className="text-muted-foreground text-xs mt-1 leading-relaxed">
                                Si hay evaluaciones activas ejecutándose, la restauración cancelará los intentos de los participantes y descartará sus respuestas no sincronizadas.
                              </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-foreground">
                                Escriba <span className="font-mono text-destructive bg-destructive/10 px-1 py-0.5 rounded">RESTAURAR</span> para confirmar:
                              </label>
                              <Input 
                                placeholder="Escriba aquí para confirmar"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                              />
                            </div>
                          </div>

                          <DialogFooter>
                            <Button variant="outline" size="sm" onClick={() => { setConfirmText(""); setActiveBackup(null); }}>
                              Cancelar
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              disabled={confirmText !== "RESTAURAR"}
                              onClick={() => handleRestore(b.name)}
                            >
                              Restaurar Base de Datos
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Políticas de Respaldo</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-muted-foreground">Respaldos Automáticos</span>
                <Badge className="bg-emerald-100 text-emerald-800">Activo</Badge>
              </div>
              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-muted-foreground">Frecuencia</span>
                <span className="font-semibold text-foreground">Diario a las 03:00 AM</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-muted-foreground">Retención de Archivos</span>
                <span className="font-semibold text-foreground">30 Días</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Destino de Red</span>
                <span className="font-semibold text-foreground">Storage Seguro UAM</span>
              </div>
            </CardContent>
          </Card>

          <Alert className="border-amber-200 bg-amber-50/50">
            <AlertTriangle className="h-4 w-4 text-amber-800" />
            <AlertTitle className="text-amber-800 font-semibold">Trazabilidad Técnica</AlertTitle>
            <AlertDescription className="text-amber-950 text-xs mt-1 leading-relaxed">
              Toda generación de respaldos o restauración de base de datos se registra automáticamente en la bitácora de auditoría inmutable del backend.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
