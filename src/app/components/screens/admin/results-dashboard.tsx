import { useState, useEffect } from "react";
import { resultsService } from "../../../../api/resultsService";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { Field, COLORS } from "./shared";

export function ResultsDashboardScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [session, setSession] = useState("a");
  const [grupo, setGrupo] = useState("a");
  const [carrera, setCarrera] = useState("a");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("a");
  const [subtest, setSubtest] = useState("a");

  const loadData = (filters = {}) => {
    setLoading(true);
    resultsService.getDashboardData(filters).then((res) => {
      setData(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApply = () => {
    loadData({
      sessionId: session !== "a" ? session : undefined,
      grupoId: grupo !== "a" ? grupo : undefined,
      carreraId: carrera !== "a" ? carrera : undefined,
      edad: edad || undefined,
      sexo: sexo !== "a" ? sexo : undefined,
      subtestId: subtest !== "a" ? subtest : undefined
    });
  };

  if (loading) return <div className="text-center p-8">Cargando métricas agregadas...</div>;

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <Field label="Sesión">
            <Select value={session} onValueChange={setSession}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Todas</SelectItem>
                <SelectItem value="SES-2026-06-A">SES-2026-06-A</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Grupo">
            <Select value={grupo} onValueChange={setGrupo}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Todos</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Carrera">
            <Select value={carrera} onValueChange={setCarrera}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Todas</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Edad">
            <Input className="w-28" placeholder="18–25" value={edad} onChange={(e) => setEdad(e.target.value)} />
          </Field>
          <Field label="Sexo">
            <Select value={sexo} onValueChange={setSexo}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Todos</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Subtest">
            <Select value={subtest} onValueChange={setSubtest}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Todos</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={handleApply}><Filter className="h-4 w-4 mr-1" /> Aplicar</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Media por subtest</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><BarChart data={data?.bySubtest}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="sub" /><YAxis /><Tooltip /><Bar dataKey="media" fill="#0f2649" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Tendencia por edad</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><LineChart data={data?.byAge}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="age" /><YAxis /><Tooltip /><Line type="monotone" dataKey="m" stroke="#b91c1c" strokeWidth={2} /></LineChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Distribución por sexo</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><PieChart><Pie data={data?.bySex} dataKey="v" nameKey="n" outerRadius={80}>{data?.bySex.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Legend /></PieChart></ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
