import { useState } from "react";
import { Brand } from "../brand";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, Lock, ShieldCheck } from "lucide-react";

const ROLES = [
  { v: "aplicador", l: "Aplicador" },
  { v: "psicologo", l: "Psicólogo / Coordinador" },
  { v: "consultor", l: "Consultor de reportes" },
  { v: "admin", l: "Administrador" },
];

export function LoginScreen({
  onLogin, onParticipant,
}: { onLogin: (role: string) => void; onParticipant: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [role, setRole] = useState("aplicador");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pass) { setErr("Usuario o contraseña incorrectos."); return; }
    onLogin(role);
  };

  return (
    <div className="min-h-full w-full grid lg:grid-cols-2 bg-muted/30">
      <div className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-10 relative overflow-hidden">
        <Brand light />
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">Plataforma de digitalización de la Batería de Funciones Atencionales</h2>
          <p className="mt-4 text-white/80">Aplicación supervisada de los subtests Figuras idénticas, Desplazamiento y Espacial. Resguardo de claves, ítems e imágenes bajo estándares de confidencialidad académica.</p>
          <div className="mt-8 flex items-center gap-2 text-sm text-white/70">
            <ShieldCheck className="h-4 w-4" /> Acceso restringido a personal autorizado UAM.
          </div>
        </div>
        <div className="text-xs text-white/50">© Universidad Americana · BFA Digital</div>
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -right-10 top-20 h-40 w-40 rounded-full bg-destructive/30" />
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="lg:hidden mb-6"><Brand /></div>
            <h1 className="text-2xl font-semibold text-primary">Iniciar sesión</h1>
            <p className="text-sm text-muted-foreground mt-1">Ingrese sus credenciales institucionales.</p>

            {err && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{err}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="u">Correo o usuario</Label>
                <Input id="u" placeholder="usuario@uam.edu.ni" value={user} onChange={(e) => setUser(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p">Contraseña</Label>
                <Input id="p" type="password" placeholder="••••••••" value={pass} onChange={(e) => setPass(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Rol (demo)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button key={r.v} type="button" onClick={() => setRole(r.v)}
                      className={`text-sm rounded-md border px-3 py-2 text-left transition ${role === r.v ? "border-primary bg-accent text-primary" : "hover:bg-muted"}`}>
                      {r.l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" className="text-xs text-primary hover:underline">Olvidé mi contraseña</button>
              </div>
              <Button type="submit" className="w-full"><Lock className="h-4 w-4 mr-1" /> Iniciar sesión</Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> O ACCESO <div className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={onParticipant}>
              Soy participante (acceder con enlace)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
