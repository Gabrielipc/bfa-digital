import { useState, useEffect } from "react";
import { adminService } from "../../../../api/adminService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Plus, MoreHorizontal } from "lucide-react";
import { Field } from "./shared";

export function UsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [perms, setPerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Aplicador");
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      adminService.getUsers(),
      adminService.getPermissionsMatrix()
    ]).then(([usersData, permsData]) => {
      setUsers(usersData);
      setPerms(permsData);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async () => {
    if (!name || !email) {
      alert("Por favor rellene todos los campos.");
      return;
    }
    setSaving(true);
    try {
      await adminService.createUser({
        n: name,
        e: email,
        r: role,
        s: true
      });
      setIsOpen(false);
      setName("");
      setEmail("");
      loadData();
    } catch (e) {
      console.error(e);
      alert("Error al crear usuario.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center p-8">Cargando usuarios y matriz de permisos...</div>;

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Usuarios</CardTitle><CardDescription>Personal interno con acceso al sistema.</CardDescription></div>
          <Button onClick={() => setIsOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo usuario</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Correo</TableHead><TableHead>Rol</TableHead><TableHead>Estado</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-sm text-muted-foreground">
                    No hay usuarios registrados.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.e}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7"><AvatarFallback className="bg-accent text-primary text-xs">{u.n?.split(" ").map((x: string) => x[0]).slice(0, 2).join("") || "U"}</AvatarFallback></Avatar>
                        <span className="text-sm font-medium">{u.n}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.e}</TableCell>
                    <TableCell><Badge variant="secondary">{u.r}</Badge></TableCell>
                    <TableCell>{u.s ? <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">activo</Badge> : <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">inactivo</Badge>}</TableCell>
                    <TableCell><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Matriz de permisos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {perms.map((p) => (
            <div key={p.k}>
              <div className="text-sm font-medium">{p.k}</div>
              <div className="mt-1 flex flex-wrap gap-1">{p.roles.map((r: string) => <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>)}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription>Registra un nuevo usuario en el sistema.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Field label="Nombre Completo">
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Dr. Juan Pérez" />
            </Field>
            <Field label="Correo Electrónico">
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@uam.edu.ni" />
            </Field>
            <Field label="Rol Asignado">
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Psicólogo">Psicólogo</SelectItem>
                  <SelectItem value="Aplicador">Aplicador</SelectItem>
                  <SelectItem value="Consultor">Consultor</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={saving}>
              {saving ? "Registrando..." : "Registrar Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
