import { useState } from "react";
import { LoginScreen } from "./components/screens/login";
import { ParticipantFlow } from "./components/screens/participant";
import { AdminLayout, ViewKey } from "./components/admin-layout";
import {
  DashboardScreen, SessionCreateScreen, SessionsMonitorScreen, ParticipantsScreen,
  InstrumentsScreen, ImageUploadScreen, ReviewTrayScreen, ResultsScreen,
  ResultsDashboardScreen, ReportsScreen, AuditScreen, UsersScreen,
} from "./components/screens/admin-screens";
import { CarrerasScreen, GruposScreen, SexosScreen, CohortesScreen } from "./components/screens/catalog-screens";
import { Button } from "./components/ui/button";
import { Plus, Download } from "lucide-react";

type Mode = "login" | "participant" | "admin";

const TITLES: Record<ViewKey, { t: string; s?: string }> = {
  "dashboard": { t: "Inicio", s: "Resumen general del sistema" },
  "session-create": { t: "Nueva sesión", s: "Configure una sesión de evaluación" },
  "sessions-monitor": { t: "Monitor de sesiones", s: "Estado en tiempo real de los participantes" },
  "participants": { t: "Participantes", s: "Registro y consulta" },
  "instruments": { t: "Configuración de instrumentos", s: "Tests, versiones, subtests, ítems y claves" },
  "image-upload": { t: "Carga de imágenes confidenciales", s: "Recursos visuales de los ítems" },
  "review-tray": { t: "Bandeja de revisión manual", s: "Respuestas abiertas pendientes" },
  "results": { t: "Resultados individuales", s: "Detalle por participante" },
  "results-dashboard": { t: "Resultados agregados", s: "Análisis estadístico" },
  "reports": { t: "Centro de reportes", s: "Exportación PDF, Excel y CSV" },
  "audit": { t: "Auditoría", s: "Registro de acciones del sistema" },
  "users": { t: "Usuarios, roles y permisos", s: "Gestión de cuentas internas" },
  "carreras": { t: "Catálogo de Carreras", s: "Gestión de carreras académicas disponibles" },
  "grupos": { t: "Catálogo de Grupos", s: "Gestión de grupos académicos" },
  "cohortes": { t: "Catálogo de Cohortes", s: "Gestión de cohortes por año y período" },
  "sexos": { t: "Catálogo de Sexos", s: "Gestión de opciones biológicas y de género" },
};

export default function App() {
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState("aplicador");
  const [view, setView] = useState<ViewKey>("dashboard");

  if (mode === "login") {
    return (
      <LoginScreen
        onLogin={(r) => { setRole(r); setMode("admin"); setView("dashboard"); }}
        onParticipant={() => setMode("participant")}
      />
    );
  }
  if (mode === "participant") {
    return <ParticipantFlow onExit={() => setMode("login")} />;
  }

  const { t, s } = TITLES[view];
  let actions: React.ReactNode = null;
  if (view === "sessions-monitor") actions = <Button><Plus className="h-4 w-4 mr-1" />Nueva sesión</Button>;
  if (view === "results") actions = <Button variant="outline"><Download className="h-4 w-4 mr-1" />Exportar</Button>;

  return (
    <AdminLayout
      role={role}
      current={view}
      onNavigate={setView}
      onLogout={() => setMode("login")}
      title={t}
      subtitle={s}
      actions={actions}
    >
      {view === "dashboard" && <DashboardScreen />}
      {view === "session-create" && <SessionCreateScreen />}
      {view === "sessions-monitor" && <SessionsMonitorScreen />}
      {view === "participants" && <ParticipantsScreen />}
      {view === "instruments" && <InstrumentsScreen />}
      {view === "image-upload" && <ImageUploadScreen />}
      {view === "review-tray" && <ReviewTrayScreen />}
      {view === "results" && <ResultsScreen />}
      {view === "results-dashboard" && <ResultsDashboardScreen />}
      {view === "reports" && <ReportsScreen />}
      {view === "audit" && <AuditScreen />}
      {view === "users" && <UsersScreen />}
      {view === "carreras" && <CarrerasScreen />}
      {view === "grupos" && <GruposScreen />}
      {view === "cohortes" && <CohortesScreen />}
      {view === "sexos" && <SexosScreen />}
    </AdminLayout>
  );
}
