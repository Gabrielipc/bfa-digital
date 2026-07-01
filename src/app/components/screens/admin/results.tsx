import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { resultsService } from "../../../../api/resultsService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";

export function ResultsScreen() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resultsService.getResults().then((data) => {
      setResults(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center p-8">Cargando resultados...</div>;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Resultados de Evaluaciones</CardTitle>
        <CardDescription>Búsqueda y consulta de puntajes individuales.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Resultado</TableHead>
              <TableHead>Participante</TableHead>
              <TableHead>Sesión</TableHead>
              <TableHead>Puntaje Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-sm text-muted-foreground">
                  No hay resultados de evaluaciones registrados.
                </TableCell>
              </TableRow>
            ) : (
              results.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="font-medium">{r.participantName}</TableCell>
                  <TableCell>{r.sessionName}</TableCell>
                  <TableCell className="font-bold">{r.totalScore} pts</TableCell>
                  <TableCell>
                    <Badge className={r.status === "CALCULADO" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/app/resultados/individual/${r.id}`}>
                        Ver Reporte
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
