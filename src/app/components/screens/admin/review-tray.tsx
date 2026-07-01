import { useState, useEffect } from "react";
import { resultsService } from "../../../../api/resultsService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Hash, XCircle, CheckCircle2 } from "lucide-react";

export function ReviewTrayScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPending = () => {
    setLoading(true);
    resultsService.getPendingReviews().then((data) => {
      setItems(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleGrade = async (reviewId: string, status: "CORRECTA" | "INCORRECTA") => {
    try {
      await resultsService.submitReview(reviewId, status);
      // Remove item from state list
      setItems(prev => prev.filter(item => item.id !== reviewId));
    } catch (error) {
      console.error(error);
      alert("Error al enviar calificación.");
    }
  };

  if (loading) return <div className="text-center p-8">Cargando bandeja de revisión...</div>;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader><CardTitle>Bandeja de revisión manual</CardTitle><CardDescription>Respuestas abiertas que requieren calificación humana.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground p-6">No hay respuestas pendientes de revisión.</div>
        ) : (
          items.map((r) => (
            <div key={r.id} className="rounded border p-4 grid md:grid-cols-[1fr_auto] gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Hash className="h-3 w-3" />{r.id} · {r.p} · {r.sub} · ítem {r.item}</div>
                <div className="mt-2 text-sm bg-muted/50 rounded p-3 italic">"{r.ans}"</div>
              </div>
              <div className="flex md:flex-col gap-2 items-start md:items-end">
                <Badge variant={r.state === "pendiente" ? "secondary" : "outline"}>{r.state}</Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleGrade(r.id, "INCORRECTA")}><XCircle className="h-4 w-4 mr-1" /> Incorrecta</Button>
                  <Button size="sm" onClick={() => handleGrade(r.id, "CORRECTA")}><CheckCircle2 className="h-4 w-4 mr-1" /> Correcta</Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
