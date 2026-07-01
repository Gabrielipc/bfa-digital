import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Loader2, BookOpen, Layers, Users, Calendar, AlertTriangle } from "lucide-react";
import { useAdminStore } from "../../../store/adminStore";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

/* ------------------------- Catalogo: Carreras ------------------------- */
export function CarrerasScreen() {
  const [open, setOpen] = useState(false);
  const list = useAdminStore((s) => s.carreras);
  const fetchCarreras = useAdminStore((s) => s.fetchCarreras);
  const createCarrera = useAdminStore((s) => s.createCarrera);
  const removeCarrera = useAdminStore((s) => s.removeCarrera);

  useEffect(() => {
    fetchCarreras();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [estado, setEstado] = useState<"ACTIVO" | "INACTIVO">("ACTIVO");

  const handleOpenDialog = () => {
    setCode("");
    setName("");
    setEstado("ACTIVO");
    setOpen(true);
  };

  const handleSave = () => {
    if (!code || !name) {
      alert("El código y nombre son requeridos.");
      return;
    }
    createCarrera({
      codigoCarrera: code.trim(),
      nombreCarrera: name.trim(),
      estado
    }).then(() => setOpen(false))
      .catch((err) => alert("Error al guardar: " + err.message));
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de que desea inactivar esta carrera?")) {
      removeCarrera(id).catch((err) => alert("Error al eliminar: " + err.message));
    }
  };

  const filteredList = list.filter((c) => {
    const matchesSearch = c.codigoCarrera.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.nombreCarrera.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = stateFilter === "all" || c.estado === stateFilter;
    return matchesSearch && matchesState;
  });

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap border-b pb-4">
        <div>
          <CardTitle className="text-lg text-primary font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Carreras
          </CardTitle>
          <CardDescription>Catálogo de carreras y programas académicos registrados.</CardDescription>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por código o nombre…"
              className="pl-8 w-60 h-9 bg-muted/30 border-0 focus-visible:bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="ACTIVO">Activo</SelectItem>
              <SelectItem value="INACTIVO">Inactivo</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleOpenDialog} size="sm" className="h-9">
            <Plus className="h-4 w-4 mr-1" /> Nueva Carrera
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nueva Carrera</DialogTitle>
                <DialogDescription>Añada una carrera académica al catálogo del sistema.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Field label="Código de Carrera">
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ej: PSIC-UAM" />
                </Field>
                <Field label="Nombre de Carrera">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej: Licenciatura en Psicología" />
                </Field>
                <Field label="Estado">
                  <Select value={estado} onValueChange={(v: any) => setEstado(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVO">Activo</SelectItem>
                      <SelectItem value="INACTIVO">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-semibold py-3 pl-6">ID</TableHead>
              <TableHead className="font-semibold py-3">Código</TableHead>
              <TableHead className="font-semibold py-3">Nombre de Carrera</TableHead>
              <TableHead className="font-semibold py-3">Estado</TableHead>
              <TableHead className="w-20 text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                  No se encontraron carreras.
                </TableCell>
              </TableRow>
            ) : (
              filteredList.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/10 transition">
                  <TableCell className="text-xs pl-6 py-3 text-muted-foreground">{c.id}</TableCell>
                  <TableCell className="font-mono text-xs py-3">{c.codigoCarrera}</TableCell>
                  <TableCell className="font-medium text-foreground py-3">{c.nombreCarrera}</TableCell>
                  <TableCell className="py-3">
                    <Badge className={c.estado === "ACTIVO" ? "bg-emerald-100 text-emerald-800 border-none font-medium hover:bg-emerald-100" : "bg-slate-100 text-slate-700 border-none font-medium hover:bg-slate-100"}>
                      {c.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 py-3">
                    {c.id && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id!)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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

/* ------------------------- Catalogo: Grupos Académicos ------------------------- */
export function GruposScreen() {
  const [open, setOpen] = useState(false);
  const list = useAdminStore((s) => s.gruposAcademicos);
  const carreras = useAdminStore((s) => s.carreras);
  const fetchGrupos = useAdminStore((s) => s.fetchGrupos);
  const fetchCarreras = useAdminStore((s) => s.fetchCarreras);
  const createGrupo = useAdminStore((s) => s.createGrupo);
  const removeGrupo = useAdminStore((s) => s.removeGrupo);

  useEffect(() => {
    fetchGrupos();
    fetchCarreras();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [carreraFilter, setCarreraFilter] = useState("all");

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [carreraId, setCarreraId] = useState("none");
  const [estado, setEstado] = useState<"ACTIVO" | "INACTIVO">("ACTIVO");

  const handleOpenDialog = () => {
    setCode("");
    setName("");
    setCarreraId("none");
    setEstado("ACTIVO");
    setOpen(true);
  };

  const handleSave = () => {
    if (!code || !name) {
      alert("El código y nombre son requeridos.");
      return;
    }
    const selectedCarrera = carreras.find(c => String(c.id) === carreraId);

    createGrupo({
      codigoGrupo: code.trim(),
      nombreGrupo: name.trim(),
      carrera: selectedCarrera,
      estado
    }).then(() => setOpen(false))
      .catch((err) => alert("Error al guardar: " + err.message));
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de que desea inactivar este grupo académico?")) {
      removeGrupo(id).catch((err) => alert("Error al eliminar: " + err.message));
    }
  };

  const filteredList = list.filter((g) => {
    const matchesSearch = g.codigoGrupo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.nombreGrupo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCarrera = carreraFilter === "all" || (g.carrera && String(g.carrera.id) === carreraFilter);
    return matchesSearch && matchesCarrera;
  });

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap border-b pb-4">
        <div>
          <CardTitle className="text-lg text-primary font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Grupos Académicos
          </CardTitle>
          <CardDescription>Catálogo de grupos formados para las evaluaciones.</CardDescription>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por código o nombre…"
              className="pl-8 w-60 h-9 bg-muted/30 border-0 focus-visible:bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={carreraFilter} onValueChange={setCarreraFilter}>
            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Carrera" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las carreras</SelectItem>
              {carreras.filter(c => c.estado === "ACTIVO").map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.nombreCarrera}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleOpenDialog} size="sm" className="h-9">
            <Plus className="h-4 w-4 mr-1" /> Nuevo Grupo
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo Grupo Académico</DialogTitle>
                <DialogDescription>Añada un grupo de estudiantes al catálogo.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Field label="Código de Grupo">
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ej: G1-PSIC" />
                </Field>
                <Field label="Nombre de Grupo">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej: Grupo 1 - Psicología Matutino" />
                </Field>
                <Field label="Carrera Asignada">
                  <Select value={carreraId} onValueChange={setCarreraId}>
                    <SelectTrigger><SelectValue placeholder="Seleccione una carrera" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin carrera</SelectItem>
                      {carreras.filter(c => c.estado === "ACTIVO").map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nombreCarrera}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Estado">
                  <Select value={estado} onValueChange={(v: any) => setEstado(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVO">Activo</SelectItem>
                      <SelectItem value="INACTIVO">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-semibold py-3 pl-6">ID</TableHead>
              <TableHead className="font-semibold py-3">Código</TableHead>
              <TableHead className="font-semibold py-3">Nombre del Grupo</TableHead>
              <TableHead className="font-semibold py-3">Carrera</TableHead>
              <TableHead className="font-semibold py-3">Estado</TableHead>
              <TableHead className="w-20 text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                  No se encontraron grupos académicos.
                </TableCell>
              </TableRow>
            ) : (
              filteredList.map((g) => (
                <TableRow key={g.id} className="hover:bg-muted/10 transition">
                  <TableCell className="text-xs pl-6 py-3 text-muted-foreground">{g.id}</TableCell>
                  <TableCell className="font-mono text-xs py-3">{g.codigoGrupo}</TableCell>
                  <TableCell className="font-medium text-foreground py-3">{g.nombreGrupo}</TableCell>
                  <TableCell className="py-3 text-muted-foreground text-xs font-semibold">
                    {(() => {
                      if (!g.carrera || !g.carrera.id) return "-";
                      const career = carreras.find(c => c.id === g.carrera?.id);
                      return career ? career.nombreCarrera : (g.carrera.nombreCarrera || "-");
                    })()}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge className={g.estado === "ACTIVO" ? "bg-emerald-100 text-emerald-800 border-none font-medium hover:bg-emerald-100" : "bg-slate-100 text-slate-700 border-none font-medium hover:bg-slate-100"}>
                      {g.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 py-3">
                    {g.id && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id!)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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

/* ------------------------- Catalogo: Sexos ------------------------- */
export function SexosScreen() {
  const [open, setOpen] = useState(false);
  const list = useAdminStore((s) => s.sexos);
  const fetchSexos = useAdminStore((s) => s.fetchSexos);
  const createSexo = useAdminStore((s) => s.createSexo);
  const removeSexo = useAdminStore((s) => s.removeSexo);

  useEffect(() => {
    fetchSexos();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [estado, setEstado] = useState<"ACTIVO" | "INACTIVO">("ACTIVO");

  const handleOpenDialog = () => {
    setCode("");
    setName("");
    setEstado("ACTIVO");
    setOpen(true);
  };

  const handleSave = () => {
    if (!code || !name) {
      alert("El código y nombre son requeridos.");
      return;
    }
    createSexo({
      codigo: code.trim(),
      nombre: name.trim(),
      estado
    }).then(() => setOpen(false))
      .catch((err) => alert("Error al guardar: " + err.message));
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de que desea inactivar este registro?")) {
      removeSexo(id).catch((err) => alert("Error al eliminar: " + err.message));
    }
  };

  const filteredList = list.filter((s) => {
    return s.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
           s.nombre.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap border-b pb-4">
        <div>
          <CardTitle className="text-lg text-primary font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Sexos / Géneros
          </CardTitle>
          <CardDescription>Catálogo de sexos para el registro demográfico.</CardDescription>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por código o nombre…"
              className="pl-8 w-60 h-9 bg-muted/30 border-0 focus-visible:bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={handleOpenDialog} size="sm" className="h-9">
            <Plus className="h-4 w-4 mr-1" /> Nuevo Registro
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo Registro de Sexo</DialogTitle>
                <DialogDescription>Añada un registro demográfico de sexo/género.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Field label="Código">
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ej: F, M, O" />
                </Field>
                <Field label="Nombre descriptivo">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej: Femenino, Masculino, Otro" />
                </Field>
                <Field label="Estado">
                  <Select value={estado} onValueChange={(v: any) => setEstado(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVO">Activo</SelectItem>
                      <SelectItem value="INACTIVO">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-semibold py-3 pl-6">ID</TableHead>
              <TableHead className="font-semibold py-3">Código</TableHead>
              <TableHead className="font-semibold py-3">Nombre Descriptivo</TableHead>
              <TableHead className="font-semibold py-3">Estado</TableHead>
              <TableHead className="w-20 text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                  No se encontraron registros.
                </TableCell>
              </TableRow>
            ) : (
              filteredList.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/10 transition">
                  <TableCell className="text-xs pl-6 py-3 text-muted-foreground">{s.id}</TableCell>
                  <TableCell className="font-mono text-xs py-3 font-semibold">{s.codigo}</TableCell>
                  <TableCell className="font-medium text-foreground py-3">{s.nombre}</TableCell>
                  <TableCell className="py-3">
                    <Badge className={s.estado === "ACTIVO" ? "bg-emerald-100 text-emerald-800 border-none font-medium hover:bg-emerald-100" : "bg-slate-100 text-slate-700 border-none font-medium hover:bg-slate-100"}>
                      {s.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 py-3">
                    {s.id && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id!)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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

/* ------------------------- Catalogo: Cohortes ------------------------- */
export function CohortesScreen() {
  const [open, setOpen] = useState(false);
  const list = useAdminStore((s) => s.cohortes);
  const fetchCohortes = useAdminStore((s) => s.fetchCohortes);
  const createCohorte = useAdminStore((s) => s.createCohorte);
  const removeCohorte = useAdminStore((s) => s.removeCohorte);

  useEffect(() => {
    fetchCohortes();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [periodo, setPeriodo] = useState("");
  const [estado, setEstado] = useState<"ACTIVO" | "INACTIVO">("ACTIVO");

  const handleOpenDialog = () => {
    setCode("");
    setName("");
    setAnio(new Date().getFullYear());
    setPeriodo("");
    setEstado("ACTIVO");
    setOpen(true);
  };

  const handleSave = () => {
    if (!code || !name) {
      alert("El código y nombre son requeridos.");
      return;
    }
    createCohorte({
      codigoCohorte: code.trim(),
      nombreCohorte: name.trim(),
      anio,
      periodo: periodo.trim(),
      estado
    }).then(() => setOpen(false))
      .catch((err) => alert("Error al guardar: " + err.message));
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de que desea inactivar esta cohorte?")) {
      removeCohorte(id).catch((err) => alert("Error al eliminar: " + err.message));
    }
  };

  const filteredList = list.filter((c) => {
    return c.codigoCohorte.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.nombreCohorte.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.periodo.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap border-b pb-4">
        <div>
          <CardTitle className="text-lg text-primary font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Cohortes
          </CardTitle>
          <CardDescription>Catálogo de cohortes temporales de ingreso de estudiantes.</CardDescription>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por código o nombre…"
              className="pl-8 w-60 h-9 bg-muted/30 border-0 focus-visible:bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={handleOpenDialog} size="sm" className="h-9">
            <Plus className="h-4 w-4 mr-1" /> Nueva Cohorte
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nueva Cohorte</DialogTitle>
                <DialogDescription>Añada una nueva cohorte al sistema.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Field label="Código de Cohorte">
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ej: COH-2026-I" />
                </Field>
                <Field label="Nombre de Cohorte">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej: Cohorte de Ingreso 2026 Semestre I" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Año">
                    <Input type="number" value={anio} onChange={(e) => setAnio(parseInt(e.target.value) || 2026)} min={1900} max={2100} />
                  </Field>
                  <Field label="Período">
                    <Input value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="ej: Semestre I" />
                  </Field>
                </div>
                <Field label="Estado">
                  <Select value={estado} onValueChange={(v: any) => setEstado(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVO">Activo</SelectItem>
                      <SelectItem value="INACTIVO">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-semibold py-3 pl-6">ID</TableHead>
              <TableHead className="font-semibold py-3">Código</TableHead>
              <TableHead className="font-semibold py-3">Nombre</TableHead>
              <TableHead className="font-semibold py-3">Año</TableHead>
              <TableHead className="font-semibold py-3">Período</TableHead>
              <TableHead className="font-semibold py-3">Estado</TableHead>
              <TableHead className="w-20 text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                  No se encontraron cohortes.
                </TableCell>
              </TableRow>
            ) : (
              filteredList.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/10 transition">
                  <TableCell className="text-xs pl-6 py-3 text-muted-foreground">{c.id}</TableCell>
                  <TableCell className="font-mono text-xs py-3">{c.codigoCohorte}</TableCell>
                  <TableCell className="font-medium text-foreground py-3">{c.nombreCohorte}</TableCell>
                  <TableCell className="py-3">{c.anio}</TableCell>
                  <TableCell className="py-3 text-muted-foreground text-xs font-semibold">{c.periodo}</TableCell>
                  <TableCell className="py-3">
                    <Badge className={c.estado === "ACTIVO" ? "bg-emerald-100 text-emerald-800 border-none font-medium hover:bg-emerald-100" : "bg-slate-100 text-slate-700 border-none font-medium hover:bg-slate-100"}>
                      {c.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 py-3">
                    {c.id && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id!)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
