import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CloudUpload, Database, Download, ShieldAlert } from "lucide-react";
import { backupService, BackupFileDTO } from "../../api/backupService";
import { Alert, AlertDescription } from "../../app/components/ui/alert";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../app/components/ui/table";

export const Route = createFileRoute("/app/respaldos")({
  component: RespaldosRoute,
});

function RespaldosRoute() {
  const [backups, setBackups] = useState<BackupFileDTO[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setBackups(await backupService.listBackups());
    } catch (err: any) {
      setError(err.message || "No se pudieron listar respaldos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const generate = async () => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const backup = await backupService.generateBackup();
      setNotice(`Respaldo generado: ${backup.fileName}`);
      await load();
    } catch (err: any) {
      setError(err.message || "No se pudo generar respaldo.");
    } finally {
      setLoading(false);
    }
  };

  const requestRestore = async (fileName: string) => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const result = await backupService.requestRestore(fileName);
      setNotice(result.auditId ? `Solicitud de restauracion auditada #${result.auditId}` : "Solicitud de restauracion registrada.");
    } catch (err: any) {
      setError(err.message || "No se pudo solicitar restauracion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {notice && <Alert><AlertDescription>{notice}</AlertDescription></Alert>}

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Respaldos y restauracion</CardTitle>
          <CardDescription>Archivos generados por backend y acciones auditadas.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded border p-4">
            <Database className="h-5 w-5 text-primary" />
            <div className="font-semibold mt-2">Listar respaldos</div>
            <p className="text-xs text-muted-foreground mt-1">Consulta el inventario registrado por backend.</p>
            <Button className="mt-3 w-full" variant="outline" onClick={load} disabled={loading}>Listar</Button>
          </div>
          <div className="rounded border p-4">
            <CloudUpload className="h-5 w-5 text-primary" />
            <div className="font-semibold mt-2">Generar respaldo manual</div>
            <p className="text-xs text-muted-foreground mt-1">Crea un nuevo archivo de respaldo en storage backend.</p>
            <Button className="mt-3 w-full" onClick={generate} disabled={loading}>Generar</Button>
          </div>
          <div className="rounded border p-4">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <div className="font-semibold mt-2">Restauracion</div>
            <p className="text-xs text-muted-foreground mt-1">La restauracion se solicita y queda auditada para ejecucion controlada.</p>
          </div>
          <div className="rounded border p-4 md:col-span-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Tamano</TableHead>
                  <TableHead>Generado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Sin respaldos registrados.
                    </TableCell>
                  </TableRow>
                ) : backups.map((backup) => (
                  <TableRow key={backup.fileName}>
                    <TableCell className="font-mono text-xs">{backup.fileName}</TableCell>
                    <TableCell>{backup.sizeBytes} bytes</TableCell>
                    <TableCell>{backup.generatedAt || "Sin fecha"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => backupService.downloadBackup(backup.fileName)} disabled={loading}>
                        <Download className="h-4 w-4 mr-1" /> Descargar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => requestRestore(backup.fileName)} disabled={loading}>
                        Solicitar restauracion
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
