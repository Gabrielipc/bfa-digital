import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, ShieldCheck, Download, AlertTriangle } from "lucide-react";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../app/components/ui/card";
import { Badge } from "../../app/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../app/components/ui/table";
import { resultsService, IndividualResultDTO } from "../../api/resultsService";

export const Route = createFileRoute("/app/resultados/individual/$resultadoId")({
  component: ResultadoIndividualDetailRoute,
});

function ResultadoIndividualDetailRoute() {
  const { resultadoId } = useParams({ from: "/app/resultados/individual/$resultadoId" });
  const [result, setResult] = useState<IndividualResultDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resultsService.getResultDetail(resultadoId).then((data) => {
      setResult(data);
      setLoading(false);
    });
  }, [resultadoId]);

  if (loading) return <div className="text-center p-8">Cargando reporte individual...</div>;
  if (!result) return <div className="text-center p-8">No se encontró el resultado.</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/resultados">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver a resultados
          </Link>
        </Button>
        <Button size="sm" variant="outline" onClick={() => resultsService.downloadReport("INDIVIDUAL", "PDF", { resultId: resultadoId })}>
          <Download className="h-4 w-4 mr-1" /> Exportar PDF Seguro
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-xl">Reporte Individual Confidencial</CardTitle>
              <CardDescription>Resultado de evaluación del participante</CardDescription>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> {result.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-md border text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Participante</span>
              <span className="font-semibold text-foreground">{result.participant.displayName} ({result.participant.id})</span>
              <span className="block text-xs text-muted-foreground mt-0.5">{result.participant.demographicSummary}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Sesión de Aplicación</span>
              <span className="font-semibold text-foreground">{result.session.name}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">ID: {result.session.id}</span>
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <h3 className="text-sm font-semibold text-foreground">Desglose por Dimensión</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dimensión / Subtest</TableHead>
                  <TableHead className="text-center">Puntaje Directo</TableHead>
                  <TableHead className="text-center">Percentil</TableHead>
                  <TableHead className="text-center">Categoría</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.dimensions.map((d) => (
                  <TableRow key={d.dimensionName}>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-sm text-foreground">{d.dimensionName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{d.interpretation}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-semibold">{d.rawScore}</TableCell>
                    <TableCell className="text-center font-mono text-primary font-semibold">{d.percentile}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-blue-50 text-blue-800 border-blue-100 font-medium">
                        {d.category}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded bg-amber-50 border border-amber-100 mt-6">
            <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              {result.disclaimer}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
