import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Plus, Play } from "lucide-react";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../app/components/ui/table";
import { Badge } from "../../app/components/ui/badge";
import { Alert, AlertDescription } from "../../app/components/ui/alert";
import { adminService } from "../../api/adminService";

export const Route = createFileRoute("/app/instrumentos/$versionId")({
  component: InstrumentVersionDetailRoute,
});

function InstrumentVersionDetailRoute() {
  const { versionId } = useParams({ from: "/app/instrumentos/$versionId" });
  const [subtests, setSubtests] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    adminService.listSubtests(versionId)
      .then(setSubtests)
      .catch((err) => setError(err.message || "No se pudieron cargar subtests."));
  }, [versionId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/instrumentos">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver a instrumentos
          </Link>
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle>Versión del Instrumento: {versionId}</CardTitle>
            <CardDescription>Detalle y configuración de los subtests e ítems psicométricos.</CardDescription>
          </div>
          <Button size="sm" asChild title="Abre el panel principal donde se crea el subtest y se valida estado BORRADOR.">
            <Link to="/app/instrumentos"><Plus className="h-4 w-4 mr-1" /> Agregar Subtest</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subtest</TableHead>
                <TableHead>Versión Interna</TableHead>
                <TableHead>Total de Ítems</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subtests.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sin subtests reales.</TableCell></TableRow>
              ) : subtests.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-semibold text-foreground">{s.nombreSubtest}</TableCell>
                  <TableCell className="font-mono text-xs">{s.codigoSubtest}</TableCell>
                  <TableCell>Consultar detalle</TableCell>
                  <TableCell>
                    <Badge className={s.estado === "ACTIVO" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                      {s.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/app/instrumentos/${versionId}/subtests/${s.id}`}>
                        Configurar Ítems
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
