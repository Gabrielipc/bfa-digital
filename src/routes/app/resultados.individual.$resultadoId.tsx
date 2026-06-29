import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Download, AlertTriangle } from "lucide-react";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../app/components/ui/card";
import { Badge } from "../../app/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../app/components/ui/table";
import { Alert, AlertDescription } from "../../app/components/ui/alert";
import { adminService, downloadDataFile, toCsv } from "../../api/adminService";

export const Route = createFileRoute("/app/resultados/individual/$resultadoId")({
  component: ResultadoIndividualDetailRoute,
});

function ResultadoIndividualDetailRoute() {
  const { resultadoId } = useParams({ from: "/app/resultados/individual/$resultadoId" });
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminService.getAttemptResult(resultadoId)
      .then(setResult)
      .catch((err) => setError(err.message || "No se pudo cargar el resultado."));
  }, [resultadoId]);

  const exportCsv = () => {
    if (!result) return;
    downloadDataFile(`resultado-intento-${result.attemptId}.csv`, "text/csv;charset=utf-8", toCsv((result.dimensions || []).map((d: any) => ({
      attemptId: result.attemptId,
      resultId: result.resultId,
      status: result.status,
      totalScore: result.totalScore,
      dimension: d.name,
      directScore: d.directScore,
      percentile: d.percentile,
      category: d.category,
      interpretation: d.interpretation,
    }))));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/resultados">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver a resultados
          </Link>
        </Button>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={!result}>
          <Download className="h-4 w-4 mr-1" /> Exportar CSV
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!result ? (
        <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center text-sm text-muted-foreground">Cargando resultado real del intento {resultadoId}...</CardContent></Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-xl">Reporte Individual Confidencial</CardTitle>
                <CardDescription>Resultado de evaluación por intento</CardDescription>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" /> {result.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-md border text-sm">
              <div><span className="text-xs text-muted-foreground block">Intento</span><span className="font-semibold">{result.attemptId}</span></div>
              <div><span className="text-xs text-muted-foreground block">Resultado</span><span className="font-semibold">{result.resultId}</span></div>
              <div><span className="text-xs text-muted-foreground block">Puntaje total</span><span className="font-semibold">{result.totalScore}</span></div>
            </div>

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
                {(result.dimensions || []).map((d: any) => (
                  <TableRow key={d.dimensionId}>
                    <TableCell>
                      <div className="font-semibold text-sm text-foreground">{d.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{d.interpretation || "Sin interpretación registrada."}</div>
                    </TableCell>
                    <TableCell className="text-center font-semibold">{d.directScore}</TableCell>
                    <TableCell className="text-center font-mono text-primary font-semibold">{d.percentile ?? "—"}</TableCell>
                    <TableCell className="text-center"><Badge className="bg-blue-50 text-blue-800 border-blue-100 font-medium">{d.category || "—"}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-start gap-2.5 p-3 rounded bg-amber-50 border border-amber-100">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed font-medium">{result.disclaimer}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
