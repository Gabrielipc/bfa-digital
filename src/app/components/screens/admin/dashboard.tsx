import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Activity, Users, ListChecks, CheckCircle2, Calendar, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function DashboardScreen() {
  const kpis = [
    { label: "Sesiones activas", value: "12", icon: Activity, accent: "text-emerald-600" },
    { label: "Participantes hoy", value: "184", icon: Users, accent: "text-primary" },
    { label: "Pendientes de revisión", value: "7", icon: ListChecks, accent: "text-amber-600" },
    { label: "Intentos completados", value: "1,254", icon: CheckCircle2, accent: "text-primary" },
  ];
  const data = Array.from({ length: 7 }, (_, i) => ({ d: `D${i + 1}`, c: 30 + Math.round(Math.random() * 60) }));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{k.label}</div>
                <k.icon className={`h-4 w-4 ${k.accent}`} />
              </div>
              <div className="text-3xl font-semibold mt-2">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader><CardTitle>Actividad semanal</CardTitle><CardDescription>Intentos completados por día</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="d" /><YAxis /><Tooltip />
                <Bar dataKey="c" fill="#0f2649" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Próximas sesiones</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {["SES-2026-06-A · Psicología I", "SES-2026-06-B · Selección RRHH", "SES-2026-06-C · Reevaluación"].map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded border">
                <div className="h-9 w-9 rounded bg-accent text-primary flex items-center justify-center"><Calendar className="h-4 w-4" /></div>
                <div className="flex-1 text-sm">
                  <div className="font-medium">{s}</div>
                  <div className="text-xs text-muted-foreground">Hoy · 14:00</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
