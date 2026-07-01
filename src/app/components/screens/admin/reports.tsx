import { resultsService } from "../../../../api/resultsService";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { FileText, FileBarChart, ShieldCheck, ClipboardList, FileSpreadsheet, Download } from "lucide-react";

export function ReportsScreen() {
  const reports = [
    { type: "INDIVIDUAL", name: "Resultados individuales", desc: "Detalle por participante con puntajes y subtests.", icon: FileText },
    { type: "AGREGADO", name: "Resultados agregados", desc: "Resumen estadístico filtrable por grupo y carrera.", icon: FileBarChart },
    { type: "AUDITORIA", name: "Auditoría de sesiones", desc: "Eventos por sesión: inicio, fin, interrupciones.", icon: ShieldCheck },
    { type: "INSTRUMENTOS", name: "Inventario de instrumentos", desc: "Versiones publicadas y subtests activos.", icon: ClipboardList },
  ];

  const handleDownload = async (type: string, format: "PDF" | "XLSX" | "CSV") => {
    try {
      await resultsService.downloadReport(type, format);
    } catch (error) {
      console.error("Error al descargar reporte", error);
      alert("Error al descargar reporte. Asegúrese de que el backend esté disponible.");
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {reports.map((r) => (
        <Card key={r.name} className="border-0 shadow-sm">
          <CardContent className="p-5 flex gap-4 items-start">
            <div className="h-12 w-12 rounded bg-accent text-primary flex items-center justify-center"><r.icon className="h-5 w-5" /></div>
            <div className="flex-1">
              <div className="font-medium">{r.name}</div>
              <div className="text-sm text-muted-foreground">{r.desc}</div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleDownload(r.type, "PDF")}><FileText className="h-4 w-4 mr-1" /> PDF</Button>
                <Button size="sm" variant="outline" onClick={() => handleDownload(r.type, "XLSX")}><FileSpreadsheet className="h-4 w-4 mr-1" /> Excel</Button>
                <Button size="sm" variant="outline" onClick={() => handleDownload(r.type, "CSV")}><Download className="h-4 w-4 mr-1" /> CSV</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
