import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAdminStore } from "../../../../store/adminStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { SearchableCombobox } from "../../ui/searchable-combobox";
import { Plus, Search, Trash2 } from "lucide-react";
import { Field } from "./shared";

export function ParticipantsScreen() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const list = useAdminStore((s) => s.participants);
  const addParticipant = useAdminStore((s) => s.addParticipant);
  const fetchParticipants = useAdminStore((s) => s.fetchParticipants);
  const carreras = useAdminStore((s) => s.carreras);
  const gruposAcademicos = useAdminStore((s) => s.gruposAcademicos);
  const cohortes = useAdminStore((s) => s.cohortes);
  const sexos = useAdminStore((s) => s.sexos);
  const fetchCarreras = useAdminStore((s) => s.fetchCarreras);
  const fetchGrupos = useAdminStore((s) => s.fetchGrupos);
  const fetchCohortes = useAdminStore((s) => s.fetchCohortes);
  const fetchSexos = useAdminStore((s) => s.fetchSexos);

  useEffect(() => {
    fetchParticipants();
    fetchCarreras();
    fetchGrupos();
    fetchCohortes();
    fetchSexos();
  }, []);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [careerFilter, setCareerFilter] = useState("");

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [selectedSexoId, setSelectedSexoId] = useState("");
  const [selectedCarreraId, setSelectedCarreraId] = useState("");
  const [selectedCohorteId, setSelectedCohorteId] = useState("");
  const [selectedGrupoId, setSelectedGrupoId] = useState("");
  const activeCarreras = useMemo(
    () => carreras.filter((c) => c.estado === "ACTIVO" && c.id != null),
    [carreras],
  );
  const activeCohortes = useMemo(
    () => cohortes.filter((c) => c.estado === "ACTIVO" && c.id != null),
    [cohortes],
  );
  const activeGrupos = useMemo(
    () => gruposAcademicos.filter((g) => g.estado === "ACTIVO" && g.id != null),
    [gruposAcademicos],
  );
  const activeSexos = useMemo(
    () => sexos.filter((s) => s.estado === "ACTIVO" && s.id != null),
    [sexos],
  );
  const carreraFilterOptions = activeCarreras.map((c) => ({
    value: String(c.id),
    label: c.nombreCarrera,
    description: c.codigoCarrera,
  }));
  const carreraOptions = activeCarreras.map((c) => ({
    value: String(c.id),
    label: c.nombreCarrera,
    description: c.codigoCarrera,
  }));
  const cohorteOptions = activeCohortes.map((c) => ({
    value: String(c.id),
    label: c.nombreCohorte,
    description: [c.codigoCohorte, c.anio, c.periodo].filter(Boolean).join(" · "),
  }));
  const grupoOptions = activeGrupos.map((g) => {
    const careerName = g.carrera?.nombreCarrera || (g.carrera?.id ? carreras.find(c => c.id === g.carrera?.id)?.nombreCarrera : undefined);
    return {
      value: String(g.id),
      label: g.nombreGrupo || g.codigoGrupo,
      description: [g.codigoGrupo, careerName].filter(Boolean).join(" · "),
    };
  });
  const sexoOptions = activeSexos.map((s) => ({
    value: String(s.id),
    label: s.nombre,
    description: s.codigo,
  }));
  const selectedGrupo = activeGrupos.find((g) => String(g.id) === selectedGrupoId);

  useEffect(() => {
    if (selectedGrupo?.carrera?.id && selectedCarreraId !== String(selectedGrupo.carrera.id)) {
      setSelectedCarreraId(String(selectedGrupo.carrera.id));
    }
  }, [selectedGrupo, selectedCarreraId]);

  const handleOpenDialog = () => {
    setCode("");
    setName("");
    setBirthDate("");
    setSelectedSexoId("");
    setSelectedCarreraId("");
    setSelectedCohorteId("");
    setSelectedGrupoId("");
    setOpen(true);
  };

  const handleSaveParticipant = () => {
    if (!code || !name) {
      alert("El código y nombre son requeridos.");
      return;
    }

    if (!selectedSexoId || !selectedCarreraId || !selectedCohorteId || !selectedGrupoId) {
      alert("Debes seleccionar sexo, carrera, cohorte y grupo.");
      return;
    }

    const parts = name.trim().split(" ");
    const firstNames = parts[0] || "";
    const lastNames = parts.slice(1).join(" ") || "S/A";

    addParticipant({
      code,
      firstNames,
      lastNames,
      fechaNacimiento: birthDate || undefined,
      sexoId: Number(selectedSexoId),
      carreraId: Number(selectedCarreraId),
      cohorteId: Number(selectedCohorteId),
      grupoAcademicoId: Number(selectedGrupoId)
    }).catch(err => {
      alert("Error al registrar participante: " + err.message);
    });

    setOpen(false);
  };

  // Filtrado de participantes
  const filteredList = list.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCareer = !careerFilter || String(p.carreraId) === careerFilter;
    return matchesSearch && matchesCareer;
  });

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap bg-white border-b rounded-t-xl">
        <div>
          <CardTitle className="text-lg text-primary font-bold">Participantes</CardTitle>
          <CardDescription>Registro e información demográfica de los evaluados.</CardDescription>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Buscar por código o nombre…" 
              className="pl-8 w-60 h-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-52">
            <SearchableCombobox
              value={careerFilter}
              onValueChange={setCareerFilter}
              options={carreraFilterOptions}
              placeholder="Todas las carreras"
              searchPlaceholder="Buscar carrera..."
              emptyMessage="No hay carreras activas."
            />
          </div>
          <Button onClick={handleOpenDialog} size="sm" className="h-9">
            <Plus className="h-4 w-4 mr-1" /> Nuevo Participante
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Participante</DialogTitle>
                <DialogDescription>Añada un nuevo evaluado. Los datos demográficos son confidenciales.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <Field label="Código">
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="P-XXXX" />
                </Field>
                <Field label="Nombre completo">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej: Juan Pérez" />
                </Field>
                <Field label="Fecha de nacimiento">
                  <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                </Field>
                <Field label="Sexo">
                  <SearchableCombobox
                    value={selectedSexoId}
                    onValueChange={setSelectedSexoId}
                    options={sexoOptions}
                    placeholder="Seleccione sexo"
                    searchPlaceholder="Buscar sexo..."
                    emptyMessage="No hay sexos activos."
                  />
                </Field>
                <Field label="Carrera">
                  <SearchableCombobox
                    value={selectedCarreraId}
                    onValueChange={setSelectedCarreraId}
                    options={carreraOptions}
                    placeholder="Seleccione carrera"
                    searchPlaceholder="Buscar carrera..."
                    emptyMessage="No hay carreras activas."
                  />
                </Field>
                <Field label="Cohorte">
                  <SearchableCombobox
                    value={selectedCohorteId}
                    onValueChange={setSelectedCohorteId}
                    options={cohorteOptions}
                    placeholder="Seleccione cohorte"
                    searchPlaceholder="Buscar cohorte..."
                    emptyMessage="No hay cohortes activas."
                  />
                </Field>
                <Field label="Grupo">
                  <SearchableCombobox
                    value={selectedGrupoId}
                    onValueChange={setSelectedGrupoId}
                    options={grupoOptions}
                    placeholder="Seleccione grupo"
                    searchPlaceholder="Buscar grupo..."
                    emptyMessage="No hay grupos activos."
                  />
                </Field>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveParticipant}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-semibold py-3 pl-6">Código</TableHead>
              <TableHead className="font-semibold py-3">Nombre</TableHead>
              <TableHead className="font-semibold py-3">Fecha de Nacimiento</TableHead>
              <TableHead className="font-semibold py-3">Edad</TableHead>
              <TableHead className="font-semibold py-3">Sexo</TableHead>
              <TableHead className="font-semibold py-3">Carrera</TableHead>
              <TableHead className="font-semibold py-3">Grupo</TableHead>
              <TableHead className="font-semibold py-3">Último Estado</TableHead>
              <TableHead className="w-20 text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                  No se encontraron participantes.
                </TableCell>
              </TableRow>
            ) : (
              filteredList.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/10 transition">
                  <TableCell className="font-mono text-xs pl-6 py-3">{p.code}</TableCell>
                  <TableCell className="font-medium text-foreground py-3">{p.name}</TableCell>
                  <TableCell className="py-3 text-xs">{p.fechaNacimiento}</TableCell>
                  <TableCell className="py-3">{p.fechaNacimiento && p.fechaNacimiento !== "-" ? `${p.age} años` : "-"}</TableCell>
                  <TableCell className="py-3">{p.sex === "F" ? "Femenino" : p.sex === "M" ? "Masculino" : "Otro"}</TableCell>
                  <TableCell className="py-3">{p.carrera}</TableCell>
                  <TableCell className="py-3"><Badge variant="secondary" className="font-medium">{p.grupo}</Badge></TableCell>
                  <TableCell className="py-3">
                    <Badge className={
                      p.latestAttemptStatus === "COMPLETADO" ? "bg-emerald-100 text-emerald-800 border-none font-medium hover:bg-emerald-100" :
                      p.latestAttemptStatus === "EN_PROGRESO" ? "bg-blue-100 text-blue-800 border-none font-medium hover:bg-blue-100" :
                      p.latestAttemptStatus === "INTERRUMPIDO" ? "bg-amber-100 text-amber-800 border-none font-medium hover:bg-amber-100" :
                      p.latestAttemptStatus === "ANULADO" ? "bg-rose-100 text-rose-800 border-none font-medium hover:bg-rose-100" :
                      "bg-slate-100 text-slate-700 border-none font-medium hover:bg-slate-100"
                    }>
                      {p.latestAttemptStatus.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 py-3">
                    <Button variant="ghost" size="sm" asChild className="h-8 hover:bg-primary/5 hover:text-primary">
                      <Link to={`/app/participantes/${p.id}`}>
                        Detalles
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
