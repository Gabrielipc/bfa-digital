import { useState, useEffect } from "react";
import { adminService } from "../../../../api/adminService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Filter } from "lucide-react";

export function AuditScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAuditLogs().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center p-8">Cargando bitácora de auditoría...</div>;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div><CardTitle>Auditoría</CardTitle><CardDescription>Registro inmutable de acciones del sistema.</CardDescription></div>
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Usuario" className="w-32" />
          <Input placeholder="Acción" className="w-32" />
          <Input type="date" className="w-40" />
          <Input placeholder="IP" className="w-32" />
          <Button variant="outline"><Filter className="h-4 w-4 mr-1" /> Filtrar</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Usuario</TableHead><TableHead>Acción</TableHead><TableHead>Entidad</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-sm text-muted-foreground">
                  No hay registros de auditoría disponibles.
                </TableCell>
              </TableRow>
            ) : (
              events.map((e, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{e.d}</TableCell>
                  <TableCell>{e.u}</TableCell>
                  <TableCell><Badge variant="secondary">{e.a}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{e.e}</TableCell>
                  <TableCell className="font-mono text-xs">{e.ip}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
