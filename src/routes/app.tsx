import { ReactNode } from "react";
import { createFileRoute, Outlet, Link, redirect, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuthStore, normalizeRole } from "../store/authStore";
import { Brand } from "../app/components/brand";
import {
  LayoutDashboard, Users, ClipboardList, Activity, FileBarChart,
  Settings2, ImageUp, ShieldCheck, UserCog, ListChecks, LogOut, Bell, Search, Database,
  BookOpen, Layers, Calendar
} from "lucide-react";
import { Input } from "../app/components/ui/input";
import { Avatar, AvatarFallback } from "../app/components/ui/avatar";
import { Badge } from "../app/components/ui/badge";
import { Button } from "../app/components/ui/button";

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

interface NavItem {
  to: string;
  label: string;
  icon: any;
  roles: string[];
}

const NAV_GROUPS: { group: string; items: NavItem[] }[] = [
  {
    group: "General",
    items: [
      { to: "/app/dashboard", label: "Inicio", icon: LayoutDashboard, roles: ["aplicador", "psicologo", "consultor", "admin"] },
    ],
  },
  {
    group: "Catálogos",
    items: [
      { to: "/app/carreras", label: "Carreras", icon: BookOpen, roles: ["aplicador", "psicologo", "admin"] },
      { to: "/app/grupos", label: "Grupos Académicos", icon: Layers, roles: ["aplicador", "psicologo", "admin"] },
      { to: "/app/cohortes", label: "Cohortes", icon: Calendar, roles: ["aplicador", "psicologo", "admin"] },
      { to: "/app/sexos", label: "Sexos", icon: Users, roles: ["aplicador", "psicologo", "admin"] },
    ],
  },
  {
    group: "Aplicación",
    items: [
      { to: "/app/sesiones", label: "Monitor de sesiones", icon: Activity, roles: ["aplicador", "psicologo", "admin"] },
      { to: "/app/participantes", label: "Participantes", icon: Users, roles: ["aplicador", "psicologo", "admin"] },
    ],
  },
  {
    group: "Instrumentos",
    items: [
      { to: "/app/instrumentos", label: "Configuración de pruebas", icon: Settings2, roles: ["psicologo", "admin"] },
    ],
  },
  {
    group: "Resultados",
    items: [
      { to: "/app/resultados", label: "Resultados individuales", icon: FileBarChart, roles: ["psicologo", "consultor", "admin"] },
      { to: "/app/dashboard-resultados", label: "Resultados agregados", icon: LayoutDashboard, roles: ["psicologo", "consultor", "admin"] },
      { to: "/app/reportes", label: "Centro de reportes", icon: FileBarChart, roles: ["psicologo", "consultor", "admin"] },
    ],
  },
  {
    group: "Administración",
    items: [
      { to: "/app/auditoria", label: "Auditoría", icon: ShieldCheck, roles: ["admin"] },
      { to: "/app/usuarios", label: "Usuarios", icon: UserCog, roles: ["admin"] },
    ],
  },
];

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const rawRole = user?.roles[0] || "aplicador";
  const role = normalizeRole(rawRole);
  console.log("[AppLayout] Current user:", user, "-> rawRole:", rawRole, "-> resolved role:", role);
  const initials = user?.displayName
    ? user.displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "US";

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  // Título e información dinámica para la cabecera del módulo actual
  const getHeaderInfo = (path: string) => {
    if (path.includes("/app/carreras")) return { t: "Catálogo de Carreras", s: "Gestión de carreras académicas disponibles" };
    if (path.includes("/app/grupos")) return { t: "Catálogo de Grupos Académicos", s: "Gestión de grupos y asignaciones" };
    if (path.includes("/app/cohortes")) return { t: "Catálogo de Cohortes", s: "Gestión de cohortes por año y período" };
    if (path.includes("/app/sexos")) return { t: "Catálogo de Sexos", s: "Gestión de opciones biológicas y de género" };
    if (path.includes("/app/dashboard")) return { t: "Inicio", s: "Resumen general de su actividad" };
    if (path.includes("/app/sesiones/nueva")) return { t: "Nueva sesión", s: "Creación y configuración de sesión de pruebas" };
    if (path.includes("/app/sesiones")) return { t: "Monitor de sesiones", s: "Estado en tiempo real de los participantes" };
    if (path.includes("/app/participantes")) return { t: "Participantes", s: "Registro y consulta de evaluados" };
    if (path.includes("/app/instrumentos")) return { t: "Configuración de pruebas", s: "Tests, versiones, subtests, ítems y claves" };
    if (path.includes("/app/carga-imagenes")) return { t: "Carga de imágenes confidenciales", s: "Recursos visuales de los ítems" };
    if (path.includes("/app/revision-manual")) return { t: "Bandeja de revisión manual", s: "Respuestas abiertas pendientes de calificar" };
    if (path.includes("/app/resultados")) return { t: "Resultados individuales", s: "Reporte psicométrico por participante" };
    if (path.includes("/app/dashboard-resultados")) return { t: "Resultados agregados", s: "Análisis estadístico y demográfico" };
    if (path.includes("/app/reportes")) return { t: "Centro de reportes", s: "Exportación de datos en PDF, Excel y CSV" };
    if (path.includes("/app/auditoria")) return { t: "Auditoría de sistema", s: "Registro completo de acciones sensibles" };
    if (path.includes("/app/usuarios")) return { t: "Usuarios", s: "Gestión de cuentas y accesos" };
    if (path.includes("/app/roles")) return { t: "Roles y Permisos", s: "Matriz de privilegios del sistema" };
    if (path.includes("/app/respaldos")) return { t: "Respaldos y restauración", s: "Base de datos e integridad del sistema" };
    return { t: "BFA Digital Portal", s: "Módulo interno de control" };
  };

  const headerInfo = getHeaderInfo(location.pathname);

  return (
    <div className="flex h-screen w-screen bg-muted/40 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-primary text-primary-foreground">
        <div className="p-4 border-b border-white/10">
          <Brand light />
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {NAV_GROUPS.map((g) => {
            const items = g.items.filter((i) => i.roles.includes(role));
            if (!items.length) return null;
            return (
              <div key={g.group}>
                <div className="px-2 text-[10px] uppercase font-bold tracking-wider text-white/50 mb-1">{g.group}</div>
                <div className="space-y-0.5">
                  {items.map((i) => {
                    const Icon = i.icon;
                    return (
                      <Link
                        key={i.to}
                        to={i.to}
                        activeProps={{ className: "bg-white/15 text-white" }}
                        inactiveProps={{ className: "text-white/80 hover:bg-white/10 hover:text-white" }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition font-medium"
                      >
                        <Icon className="h-4 w-4" />
                        {i.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        
        {/* Perfil del Usuario en Sidebar */}
        <div className="p-3 border-t border-white/10 flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-white/15 text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 leading-tight min-w-0">
            <div className="text-sm font-semibold truncate">{user?.displayName || "Usuario"}</div>
            <div className="text-[11px] text-white/60 capitalize font-medium">{role}</div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="text-white/80 hover:bg-white/10 hover:text-white shrink-0"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b bg-white flex items-center px-4 md:px-6 gap-3 shrink-0">
          <div className="md:hidden"><Brand compact /></div>
          
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar participantes, sesiones, ítems…" className="pl-8 bg-muted/50 border-0 focus-visible:ring-primary/40 focus-visible:bg-white transition" />
            </div>
          </div>
          
          <div className="flex-1 md:hidden" />
          
          <Badge variant="secondary" className="hidden sm:inline-flex bg-destructive/10 text-destructive border-none font-semibold text-[11px] tracking-wide uppercase px-2 py-0.5">
            Confidencial UAM
          </Badge>
          
          <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
        </header>

        {/* Dynamic Section Header */}
        <div className="px-4 md:px-6 py-4 border-b bg-white flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl text-primary font-bold tracking-tight">{headerInfo.t}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{headerInfo.s}</p>
          </div>
        </div>

        {/* Route Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#fafafa]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
