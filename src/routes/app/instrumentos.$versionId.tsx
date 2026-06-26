import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Plus, Play } from "lucide-react";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../app/components/ui/table";
import { Badge } from "../../app/components/ui/badge";

export const Route = createFileRoute("/app/instrumentos/$versionId")({
  component: InstrumentVersionDetailRoute,
});

function InstrumentVersionDetailRoute() {
  const { versionId } = useParams({ from: "/app/instrumentos/$versionId" });

  const subtests = [
    { id: "figuras", name: "Figuras idénticas", items: 30, state: "publicado", version: "v2.1" },
    { id: "desplazamiento", name: "Desplazamiento", items: 24, state: "publicado", version: "v1.4" },
    { id: "espacial", name: "Espacial", items: 20, state: "borrador", version: "v1.2" },
  ];

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
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Agregar Subtest</Button>
        </CardHeader>
        <CardContent>
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
              {subtests.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-semibold text-foreground">{s.name}</TableCell>
                  <TableCell className="font-mono text-xs">{s.version}</TableCell>
                  <TableCell>{s.items} Reactivos</TableCell>
                  <TableCell>
                    <Badge className={s.state === "publicado" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                      {s.state}
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
