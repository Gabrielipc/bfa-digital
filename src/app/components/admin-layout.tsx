import { ReactNode } from "react";
import { Brand } from "./brand";
import {
  LayoutDashboard, Users, ClipboardList, Activity, FileBarChart,
  Settings2, ShieldCheck, UserCog, LogOut, Bell, Search,
  BookOpen, Layers, Calendar
} from "lucide-react";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export type ViewKey =
  | "dashboard" | "session-create" | "sessions-monitor" | "participants"
  | "instruments" | "image-upload" | "review-tray" | "results"
  | "results-dashboard" | "reports" | "audit" | "users"
  | "carreras" | "grupos" | "cohortes" | "sexos";

const NAV: { group: string; items: { key: ViewKey; label: string; icon: any; roles: string[] }[] }[] = [
  {
    group: "General",
    items: [
      { key: "dashboard", label: "Inicio", icon: LayoutDashboard, roles: ["aplicador", "psicologo", "consultor", "admin"] },
    ],
  },
  {
    group: "Aplicación",
    items: [
      { key: "session-create", label: "Nueva sesión", icon: ClipboardList, roles: ["aplicador", "psicologo", "admin"] },
      { key: "sessions-monitor", label: "Monitor de sesiones", icon: Activity, roles: ["aplicador", "psicologo", "admin"] },
      { key: "participants", label: "Participantes", icon: Users, roles: ["aplicador", "psicologo", "admin"] },
    ],
  },
  {
    group: "Instrumentos",
    items: [
      { key: "instruments", label: "Instrumentos", icon: Settings2, roles: ["psicologo", "admin"] },
    ],
  },
  {
    group: "Resultados",
    items: [
      { key: "results", label: "Resultados individuales", icon: FileBarChart, roles: ["psicologo", "consultor", "admin"] },
      { key: "results-dashboard", label: "Resultados agregados", icon: LayoutDashboard, roles: ["psicologo", "consultor", "admin"] },
      { key: "reports", label: "Centro de reportes", icon: FileBarChart, roles: ["psicologo", "consultor", "admin"] },
    ],
  },
  {
    group: "Administración",
    items: [
      { key: "audit", label: "Auditoría", icon: ShieldCheck, roles: ["admin"] },
      { key: "users", label: "Usuarios y roles", icon: UserCog, roles: ["admin"] },
    ],
  },
  {
    group: "Catálogos",
    items: [
      { key: "carreras", label: "Carreras", icon: BookOpen, roles: ["aplicador", "psicologo", "admin"] },
      { key: "grupos", label: "Grupos Académicos", icon: Layers, roles: ["aplicador", "psicologo", "admin"] },
      { key: "cohortes", label: "Cohortes", icon: Calendar, roles: ["aplicador", "psicologo", "admin"] },
      { key: "sexos", label: "Sexos", icon: Users, roles: ["aplicador", "psicologo", "admin"] },
    ],
  },
];

export function AdminLayout({
  role, current, onNavigate, onLogout, children, title, subtitle, actions,
}: {
  role: string;
  current: ViewKey;
  onNavigate: (v: ViewKey) => void;
  onLogout: () => void;
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex h-full w-full bg-muted/40">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-primary text-primary-foreground">
        <div className="p-4 border-b border-white/10">
          <Brand light />
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {NAV.map((g) => {
            const items = g.items.filter((i) => i.roles.includes(role));
            if (!items.length) return null;
            return (
              <div key={g.group}>
                <div className="px-2 text-[11px] uppercase tracking-wider text-white/50 mb-1">{g.group}</div>
                <div className="space-y-1">
                  {items.map((i) => {
                    const Icon = i.icon;
                    const active = current === i.key;
                    return (
                      <button
                        key={i.key}
                        onClick={() => onNavigate(i.key)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${
                          active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {i.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 flex items-center gap-2">
          <Avatar className="h-8 w-8"><AvatarFallback className="bg-white/15 text-white text-xs">UA</AvatarFallback></Avatar>
          <div className="flex-1 leading-tight">
            <div className="text-sm">Usuario UAM</div>
            <div className="text-[11px] text-white/60 capitalize">{role}</div>
          </div>
          <Button size="icon" variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b bg-white flex items-center px-4 md:px-6 gap-3">
          <div className="md:hidden"><Brand compact /></div>
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar participantes, sesiones, ítems…" className="pl-8 bg-muted/50 border-0" />
            </div>
          </div>
          <div className="flex-1 md:hidden" />
          <Badge variant="secondary" className="hidden sm:inline-flex">Confidencial</Badge>
          <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
        </header>

        <div className="px-4 md:px-6 py-4 border-b bg-white flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl text-primary font-semibold">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
