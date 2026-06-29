import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../app/components/ui/table";
import { Badge } from "../../app/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../app/components/ui/dialog";
import { Input } from "../../app/components/ui/input";
import { Textarea } from "../../app/components/ui/textarea";
import { Alert, AlertDescription } from "../../app/components/ui/alert";
import { adminService } from "../../api/adminService";

export const Route = createFileRoute("/app/instrumentos/$versionId/subtests/$subtestId")({
  component: SubtestDetailRoute,
});

function SubtestDetailRoute() {
  const { versionId, subtestId } = useParams({ from: "/app/instrumentos/$versionId/subtests/$subtestId" });
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form, setForm] = useState({ code: "", prompt: "", instruction: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadItems = async () => {
    setError("");
    try {
      setItems(await adminService.listItems(subtestId));
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar ítems.");
    }
  };

  useEffect(() => {
    loadItems();
  }, [subtestId]);

  const createItem = async () => {
    if (!form.code.trim() || !form.prompt.trim()) {
      setError("Código y enunciado son requeridos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const created = await adminService.createItem(subtestId, {
        code: form.code.trim(),
        itemType: "SOLO_TEXTO",
        responseType: "OPCION_UNICA",
        prompt: form.prompt.trim(),
        instruction: form.instruction.trim() || undefined,
        order: items.length + 1,
        baseScore: 1,
        required: true,
        confidential: true,
      });
      await Promise.all(["A", "B", "C", "D"].map((code, index) => adminService.createOption(created.id, {
        code,
        text: `Opción ${code}`,
        order: index + 1,
      })));
      setForm({ code: "", prompt: "", instruction: "" });
      setOpen(false);
      await loadItems();
    } catch (err: any) {
      setError(err.message || "No se pudo crear el ítem.");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setForm({ code: item.code || "", prompt: item.prompt || "", instruction: item.instruction || "" });
    setEditOpen(true);
  };

  const updateItem = async () => {
    if (!editingItem || !form.code.trim() || !form.prompt.trim()) {
      setError("Código y enunciado son requeridos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await adminService.updateItem(editingItem.id, {
        code: form.code.trim(),
        itemType: editingItem.itemType || "SOLO_TEXTO",
        responseType: editingItem.responseType || "OPCION_UNICA",
        prompt: form.prompt.trim(),
        instruction: form.instruction.trim() || undefined,
        order: editingItem.order || 1,
        baseScore: editingItem.baseScore || 1,
        timeLimitSeconds: editingItem.timeLimitSeconds || undefined,
        required: editingItem.required ?? true,
        confidential: editingItem.confidential ?? true,
      });
      setForm({ code: "", prompt: "", instruction: "" });
      setEditingItem(null);
      setEditOpen(false);
      await loadItems();
    } catch (err: any) {
      setError(err.message || "No se pudo editar el ítem.");
    } finally {
      setLoading(false);
    }
  };

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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo Reactivo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo reactivo</DialogTitle><DialogDescription>Persistido en backend; crea opciones A-D iniciales.</DialogDescription></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                <Textarea placeholder="Enunciado" value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} />
                <Textarea placeholder="Instrucción opcional" value={form.instruction} onChange={(e) => setForm({ ...form, instruction: e.target.value })} />
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={createItem} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
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
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sin ítems reales.</TableCell></TableRow>
              ) : items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-bold">{it.order}</TableCell>
                  <TableCell className="font-mono text-xs">{it.code}</TableCell>
                  <TableCell className="text-xs">{it.itemType}</TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-100 text-emerald-800">Gestionar en carga</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(it)}>Editar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Editar reactivo</DialogTitle><DialogDescription>Actualiza el ítem con PATCH real en backend.</DialogDescription></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                <Textarea placeholder="Enunciado" value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} />
                <Textarea placeholder="Instrucción opcional" value={form.instruction} onChange={(e) => setForm({ ...form, instruction: e.target.value })} />
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button onClick={updateItem} disabled={loading}>{loading ? "Guardando..." : "Guardar cambios"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
