import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, ShieldCheck, Download, AlertTriangle } from "lucide-react";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../app/components/ui/card";
import { Badge } from "../../app/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../app/components/ui/table";
import { resultsService, AttemptResultDTO, DetailedAttemptResultDTO } from "../../api/resultsService";

export const Route = createFileRoute("/app/resultados/individual/$attemptId")({
  component: ResultadoIndividualDetailRoute,
});

function ResultadoIndividualDetailRoute() {
  const { attemptId } = useParams({ from: "/app/resultados/individual/$attemptId" });
  const [result, setResult] = useState<AttemptResultDTO | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<DetailedAttemptResultDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      resultsService.getAttemptResult(Number(attemptId)),
      resultsService.getDetailedAttemptResult(Number(attemptId))
    ])
      .then(([resData, detailData]) => {
        setResult(resData);
        setAttemptDetail(detailData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar reporte de baremo:", err);
        setError(err.message || "No se pudo cargar el reporte de baremos.");
        setLoading(false);
      });
  }, [attemptId]);

  if (loading) return <div className="text-center p-8">Cargando reporte individual...</div>;
  if (error || !result || !attemptDetail) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/calificaciones">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
        </Button>
        <div className="text-center p-8 border rounded-lg bg-rose-50 text-rose-700">
          <p className="font-semibold">{error || "No se pudo cargar el resultado de este intento."}</p>
        </div>
      </div>
    );
  }

  // Helper to extract demographics from attempt detail
  const participantName = attemptDetail.participantName || 
    (attemptDetail.demographics ? `${attemptDetail.demographics.nombres || ""} ${attemptDetail.demographics.apellidos || ""}`.trim() : "") ||
    "Participante";
  
  const demographicSummary = `${attemptDetail.carrera || attemptDetail.demographics?.carrera || "Carrera N/A"} · Grupo ${attemptDetail.academicGroup || attemptDetail.demographics?.grupo || "N/A"}`;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/calificaciones">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver a calificaciones
          </Link>
        </Button>
        <Button size="sm" variant="outline" onClick={() => resultsService.downloadReport("INDIVIDUAL", "PDF", { attemptId })}>
          <Download className="h-4 w-4 mr-1" /> Exportar PDF Seguro
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-xl font-bold text-primary">Reporte Individual Confidencial</CardTitle>
              <CardDescription className="text-xs">Resultado de evaluación del participante</CardDescription>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> {result.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-md border text-sm">
            <div>
              <span className="text-xs text-muted-foreground block font-semibold">Participante</span>
              <span className="font-semibold text-foreground">{participantName}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">{demographicSummary}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-semibold">Métricas de Evaluación</span>
              <span className="font-semibold text-foreground">Intento #{attemptId}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">Puntaje total: {result.totalScore} pts</span>
            </div>
          </div>

          {/* Interpretación General / Puntuación Directa */}
          {result.totalInterpretation && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 space-y-4 mt-2">
              <div className="flex items-center justify-between border-b border-primary/10 pb-3 flex-wrap gap-2">
                <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Interpretación General del Test
                </h3>
                <Badge className="bg-primary text-white border-none font-semibold text-xs">
                  Baremo: {result.totalInterpretation.baremoCode}
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-white rounded border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Puntaje Directo</span>
                  <span className="text-xl font-bold text-foreground">{result.totalScore}</span>
                </div>
                <div className="p-3 bg-white rounded border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Percentil Global</span>
                  <span className="text-xl font-bold text-primary">{result.totalInterpretation.percentile}%</span>
                </div>
                <div className="p-3 bg-white rounded border col-span-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Categoría Diagnóstica</span>
                  <span className="text-sm font-bold text-foreground block mt-1">{result.totalInterpretation.category}</span>
                </div>
              </div>
              {result.totalInterpretation.interpretation && (
                <div className="space-y-1 pt-2">
                  <span className="text-xs text-muted-foreground font-bold uppercase tracking-wide block">Interpretación</span>
                  <p className="text-sm text-foreground leading-relaxed font-semibold bg-white p-3 border rounded">
                    {result.totalInterpretation.interpretation}
                  </p>
                </div>
              )}
              {result.totalInterpretation.recommendation && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-bold uppercase tracking-wide block">Recomendación</span>
                  <p className="text-sm text-foreground leading-relaxed bg-white p-3 border rounded">
                    {result.totalInterpretation.recommendation}
                  </p>
                </div>
              )}
            </div>
          )}

          {result.dimensions && result.dimensions.length > 0 && (
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
                    <TableRow key={d.name}>
                      <TableCell>
                        <div>
                          <div className="font-semibold text-sm text-foreground">{d.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{d.interpretation || "Sin interpretación disponible"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">{d.directScore}</TableCell>
                      <TableCell className="text-center font-mono text-primary font-semibold">{d.percentile !== null ? d.percentile : "—"}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-blue-50 text-blue-800 border-blue-100 font-medium">
                          {d.category || "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-start gap-2.5 p-3 rounded bg-amber-50 border border-amber-100 mt-6">
            <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              {result.disclaimer || "El sistema no emite diagnósticos psicológicos definitivos."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
