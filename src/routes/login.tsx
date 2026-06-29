import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Brand } from "../app/components/brand";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Label } from "../app/components/ui/label";
import { Card, CardContent } from "../app/components/ui/card";
import { Alert, AlertDescription } from "../app/components/ui/alert";
import { AlertCircle, Lock, ShieldCheck, Loader2 } from "lucide-react";
import { authService } from "../api/authService";
import { useAuthStore } from "../store/authStore";

export const Route = createFileRoute("/login")({
  component: LoginRoute,
  beforeLoad: ({ navigate }) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated();
    if (isAuthenticated) {
      throw navigate({ to: "/app/dashboard" });
    }
  }
});

const DEMO_ROLES = [
  { v: "aplicador", l: "Aplicador (Clave: 1234)" },
  { v: "psicologo", l: "Psicólogo (Clave: 1234)" },
  { v: "consultor", l: "Consultor (Clave: 1234)" },
  { v: "admin", l: "Administrador (Clave: 1234)" },
];

function LoginRoute() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [user, setUserInput] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pass) {
      setErr("Usuario y contraseña son requeridos.");
      return;
    }

    setLoading(true);
    setErr("");
    setInfo("");

    try {
      const result = await authService.login(user, pass);
      setToken(result.token);
      setUser(result.user);
      navigate({ to: "/app/dashboard" });
    } catch (error: any) {
      setErr(error.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: string) => {
    setLoading(true);
    setErr("");
    setInfo("");
    try {
      const result = await authService.login(role, "1234");
      setToken(result.token);
      setUser(result.user);
      navigate({ to: "/app/dashboard" });
    } catch (error: any) {
      setErr(error.message || "No se pudo iniciar sesión con el acceso rápido.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user.trim()) {
      setErr("Ingrese usuario o correo para solicitar recuperación.");
      return;
    }
    setLoading(true);
    setErr("");
    setInfo("");
    try {
      await authService.requestPasswordReset(user.trim());
      setInfo("Solicitud de recuperación registrada en backend.");
    } catch (error: any) {
      setErr(error.message || "No se pudo registrar la recuperación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-muted/30">
      <div className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-10 relative overflow-hidden">
        <Brand light />
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Plataforma de digitalización de la Batería de Funciones Atencionales
          </h2>
          <p className="mt-4 text-white/80">
            Aplicación supervisada de los subtests Figuras idénticas, Desplazamiento y Espacial. Resguardo de claves, ítems e imágenes bajo estándares de confidencialidad académica.
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm text-white/70">
            <ShieldCheck className="h-4 w-4" /> Acceso restringido a personal autorizado UAM.
          </div>
        </div>
        <div className="text-xs text-white/50">© Universidad Americana · BFA Digital</div>
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -right-10 top-20 h-40 w-40 rounded-full bg-destructive/30" />
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-lg bg-white">
          <CardContent className="p-8">
            <div className="lg:hidden mb-6">
              <Brand />
            </div>
            <h1 className="text-2xl font-semibold text-primary">Iniciar sesión</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ingrese sus credenciales institucionales.
            </p>

            {err && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{err}</AlertDescription>
              </Alert>
            )}
            {info && (
              <Alert className="mt-4">
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>{info}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="u">Correo o usuario</Label>
                <Input
                  id="u"
                  placeholder="usuario@uam.edu.ni"
                  value={user}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p">Contraseña</Label>
                <Input
                  id="p"
                  type="password"
                  placeholder="••••••••"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Accesos rápidos</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {DEMO_ROLES.map((r) => (
                    <button
                      key={r.v}
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoLogin(r.v)}
                      title="Ejecuta login real contra /auth/login."
                      className="text-xs rounded border border-border bg-muted/40 py-1.5 px-2 text-left transition hover:bg-accent truncate disabled:opacity-60"
                    >
                      {r.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handlePasswordReset}
                  title="Registra solicitud real de recuperación en backend."
                  className="text-xs text-primary hover:underline disabled:text-muted-foreground"
                >
                  Olvidé mi contraseña
                </button>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Incursionando...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-1" /> Iniciar sesión
                  </>
                )}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> O ACCESO <div className="h-px flex-1 bg-border" />
            </div>
            <Button
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={() => navigate({ to: "/evaluacion/acceso" })}
            >
              Soy participante (acceder con enlace/código)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
