import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../app/components/ui/table";
import { Badge } from "../../app/components/ui/badge";

export const Route = createFileRoute("/app/instrumentos/$versionId/subtests/$subtestId")({
  component: SubtestDetailRoute,
});

function SubtestDetailRoute() {
  const { versionId, subtestId } = useParams({ from: "/app/instrumentos/$versionId/subtests/$subtestId" });

  const items = [
    { id: "it-01", ordinal: 1, type: "FIGURAS_IDENTICAS", hasImage: true },
    { id: "it-02", ordinal: 2, type: "FIGURAS_IDENTICAS", hasImage: true },
    { id: "it-03", ordinal: 3, type: "FIGURAS_IDENTICAS", hasImage: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/app/instrumentos/${versionId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver a la versión
          </Link>
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle>Reactivos de Subtest: {subtestId}</CardTitle>
            <CardDescription>Gestión de ítems de la versión {versionId}.</CardDescription>
          </div>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo Reactivo</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Ordinal</TableHead>
                <TableHead>ID Reactivo</TableHead>
                <TableHead>Tipo Reactivo</TableHead>
                <TableHead>Imagen Cargada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-bold">{it.ordinal}</TableCell>
                  <TableCell className="font-mono text-xs">{it.id}</TableCell>
                  <TableCell className="text-xs">{it.type}</TableCell>
                  <TableCell>
                    <Badge className={it.hasImage ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}>
                      {it.hasImage ? "Cargada" : "Falta imagen"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Editar</Button>
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
