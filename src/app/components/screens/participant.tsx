import { useEffect, useState } from "react";
import { Brand } from "../brand";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Progress } from "../ui/progress";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
  ShieldCheck, Clock, CheckCircle2, AlertTriangle, WifiOff, Save, ArrowLeft, ArrowRight,
  Loader2, ListChecks, BookOpen, KeyRound
} from "lucide-react";

type Step = "access" | "welcome" | "subtest-intro" | "item" | "summary" | "done";

const SUBTESTS = [
  { id: "figuras", name: "Figuras idénticas", items: 30, mins: 8, desc: "Compare la figura modelo con las opciones y seleccione la idéntica." },
  { id: "desplazamiento", name: "Desplazamiento", items: 24, mins: 6, desc: "Identifique la figura que resulta tras un desplazamiento." },
  { id: "espacial", name: "Espacial", items: 20, mins: 7, desc: "Reconozca la rotación o posición espacial correcta." },
];

export function ParticipantFlow({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState<Step>("access");
  const [subIdx, setSubIdx] = useState(0);
  const [itemIdx, setItemIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "offline">("saved");
  const [timeLeft, setTimeLeft] = useState(8 * 60);

  // access loading -> welcome
  useEffect(() => {
    if (step === "access") {
      const t = setTimeout(() => setStep("welcome"), 1400);
      return () => clearTimeout(t);
    }
  }, [step]);

  useEffect(() => {
    if (step !== "item") return;
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [step]);

  const sub = SUBTESTS[subIdx];
  const itemKey = `${sub?.id}-${itemIdx}`;
  const totalItems = sub?.items ?? 0;

  const setAnswer = (val: string) => {
    setAnswers((a) => ({ ...a, [itemKey]: val }));
    setSaveState("saving");
    setTimeout(() => setSaveState("saved"), 700);
  };

  const next = () => {
    if (itemIdx < totalItems - 1) setItemIdx(itemIdx + 1);
    else if (subIdx < SUBTESTS.length - 1) { setSubIdx(subIdx + 1); setItemIdx(0); setTimeLeft(SUBTESTS[subIdx + 1].mins * 60); setStep("subtest-intro"); }
    else setStep("summary");
  };
  const prev = () => { if (itemIdx > 0) setItemIdx(itemIdx - 1); };

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  if (step === "access") {
    return (
      <Centered>
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <Brand />
            <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin" />
            <div>
              <div className="font-medium text-primary">Validando acceso a la evaluación…</div>
              <div className="text-sm text-muted-foreground mt-1">Verificando token y estado de sesión.</div>
            </div>
            <div className="text-xs text-muted-foreground font-mono bg-muted rounded px-3 py-2 break-all">
              token=4f8a-9b21-77e0-bca5
            </div>
          </CardContent>
        </Card>
      </Centered>
    );
  }

  if (step === "welcome") {
    return (
      <Centered>
        <Card className="w-full max-w-2xl border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <Brand />
              <Badge variant="secondary"><ShieldCheck className="h-3 w-3 mr-1" /> Sesión autorizada</Badge>
            </div>
            <h1 className="text-2xl font-semibold text-primary mt-6">Bienvenido/a a la evaluación BFA Digital</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Participante: <span className="text-foreground">P-2026-0184</span> · Sesión: <span className="text-foreground">SES-2026-06-A</span>
            </p>

            <Separator className="my-6" />

            <div className="space-y-3">
              <div className="text-sm font-medium">Subtests habilitados</div>
              {SUBTESTS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 rounded-md border p-3">
                  <div className="h-8 w-8 rounded-full bg-accent text-primary flex items-center justify-center text-sm font-medium">{i + 1}</div>
                  <div className="flex-1">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.items} ítems · ~{s.mins} min</div>
                  </div>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>

            <Alert className="mt-6">
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Confidencialidad</AlertTitle>
              <AlertDescription>
                Lea cuidadosamente cada instrucción. Sus respuestas se guardan automáticamente. Una vez finalizada la evaluación no podrá modificarlas. Está prohibida la reproducción o difusión de los ítems.
              </AlertDescription>
            </Alert>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={onExit}>Salir</Button>
              <Button onClick={() => { setTimeLeft(SUBTESTS[0].mins * 60); setStep("subtest-intro"); }}>
                Comenzar evaluación <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </Centered>
    );
  }

  if (step === "subtest-intro") {
    return (
      <Centered>
        <Card className="w-full max-w-2xl border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="text-xs text-muted-foreground">Subtest {subIdx + 1} de {SUBTESTS.length}</div>
            <h1 className="text-2xl font-semibold text-primary mt-1">{sub.name}</h1>
            <p className="text-sm text-muted-foreground mt-2">{sub.desc}</p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <Info label="Cantidad de ítems" value={`${sub.items}`} />
              <Info label="Tiempo límite" value={`${sub.mins} minutos`} icon={<Clock className="h-4 w-4" />} />
            </div>

            <Alert className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>El temporizador inicia al presionar Iniciar subtest. No cierre la ventana durante la prueba.</AlertDescription>
            </Alert>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setStep("item")}>Iniciar subtest <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </CardContent>
        </Card>
      </Centered>
    );
  }

  if (step === "summary") {
    return (
      <Centered>
        <Card className="w-full max-w-2xl border-0 shadow-lg">
          <CardContent className="p-8">
            <h1 className="text-2xl font-semibold text-primary">Resumen previo a finalizar</h1>
            <p className="text-sm text-muted-foreground mt-1">Confirme antes de enviar sus respuestas.</p>
            <div className="mt-6 space-y-2">
              {SUBTESTS.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="font-medium">{s.name}</div>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Completado</Badge>
                </div>
              ))}
            </div>
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Al finalizar, sus respuestas quedarán registradas y no podrán modificarse.</AlertDescription>
            </Alert>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setStep("item"); }}>Volver a revisar</Button>
              <Button onClick={() => setStep("done")}>Finalizar evaluación</Button>
            </div>
          </CardContent>
        </Card>
      </Centered>
    );
  }

  if (step === "done") {
    return (
      <Centered>
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-semibold text-primary">Evaluación finalizada</h1>
            <p className="text-sm text-muted-foreground">
              Sus respuestas fueron registradas correctamente. Puede cerrar esta ventana. Los resultados serán entregados por su aplicador.
            </p>
            <Button variant="outline" onClick={onExit}>Salir</Button>
          </CardContent>
        </Card>
      </Centered>
    );
  }

  // item
  const progress = ((itemIdx + 1) / totalItems) * 100;
  const answer = answers[itemKey];
  const options = ["A", "B", "C", "D"];
  return (
    <div className="min-h-full bg-muted/30 flex flex-col">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Brand compact />
          <div className="hidden md:block text-sm">
            <div className="font-medium">{sub.name}</div>
            <div className="text-xs text-muted-foreground">Ítem {itemIdx + 1} de {totalItems}</div>
          </div>
          <div className="flex-1" />
          <SaveBadge state={saveState} />
          <div className="flex items-center gap-1.5 text-sm font-mono bg-muted px-3 py-1.5 rounded">
            <Clock className="h-4 w-4 text-primary" /> {mm}:{ss}
          </div>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </header>

      {saveState === "offline" && (
        <div className="bg-amber-100 text-amber-900 text-sm px-4 py-2 flex items-center gap-2 justify-center">
          <WifiOff className="h-4 w-4" /> Conexión inestable. No cierre la ventana, reintentando guardar…
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 md:p-8">
            <div className="text-xs text-muted-foreground">Ítem {itemIdx + 1}</div>
            <h2 className="text-lg font-medium text-primary mt-1">
              Observe la figura modelo y seleccione la opción idéntica.
            </h2>

            <div className="mt-6 rounded-lg border bg-muted/40 aspect-[16/7] flex items-center justify-center select-none"
              onContextMenu={(e) => e.preventDefault()}>
              <FigureModel />
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {options.map((o, i) => {
                const active = answer === o;
                return (
                  <button key={o} onClick={() => setAnswer(o)}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`group rounded-lg border p-3 text-left transition ${active ? "border-primary ring-2 ring-primary/20 bg-accent" : "hover:border-primary/40 bg-white"}`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center font-medium ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{o}</span>
                      {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="mt-3 aspect-square rounded bg-white border flex items-center justify-center">
                      <FigureOption variant={i} subtle={!active} />
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="outline" onClick={prev} disabled={itemIdx === 0}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <ListChecks className="h-4 w-4" /> {Object.keys(answers).filter((k) => k.startsWith(sub.id)).length} respondidos
          </div>
          <div className="flex-1" />
          {itemIdx === totalItems - 1 && subIdx === SUBTESTS.length - 1 ? (
            <Button onClick={() => setStep("summary")}>Finalizar evaluación</Button>
          ) : (
            <Button onClick={next}>Siguiente <ArrowRight className="h-4 w-4 ml-1" /></Button>
          )}
        </div>
      </footer>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full bg-muted/30 flex items-center justify-center p-4">{children}</div>;
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground flex items-center gap-1">{icon}{label}</div>
      <div className="text-base font-medium mt-1">{value}</div>
    </div>
  );
}

function SaveBadge({ state }: { state: "idle" | "saving" | "saved" | "offline" }) {
  if (state === "saving") return <span className="text-xs flex items-center gap-1 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Guardando…</span>;
  if (state === "offline") return <span className="text-xs flex items-center gap-1 text-amber-700"><WifiOff className="h-3 w-3" /> Conexión inestable</span>;
  return <span className="text-xs flex items-center gap-1 text-emerald-700"><Save className="h-3 w-3" /> Respuesta guardada</span>;
}

function FigureModel() {
  return (
    <svg width="220" height="120" viewBox="0 0 220 120" className="text-primary">
      <rect x="10" y="20" width="60" height="80" rx="6" fill="currentColor" opacity="0.1" />
      <rect x="10" y="20" width="60" height="80" rx="6" fill="none" stroke="currentColor" />
      <circle cx="110" cy="60" r="28" fill="none" stroke="currentColor" />
      <circle cx="110" cy="60" r="10" fill="currentColor" />
      <polygon points="180,30 210,90 150,90" fill="none" stroke="currentColor" />
      <polygon points="180,40 200,82 160,82" fill="currentColor" opacity="0.15" />
    </svg>
  );
}
function FigureOption({ variant, subtle }: { variant: number; subtle?: boolean }) {
  const o = subtle ? 0.7 : 1;
  return (
    <svg width="70" height="70" viewBox="0 0 70 70" className="text-primary" style={{ opacity: o }}>
      {variant === 0 && <><circle cx="35" cy="35" r="22" fill="none" stroke="currentColor" /><circle cx="35" cy="35" r="8" fill="currentColor" /></>}
      {variant === 1 && <><circle cx="35" cy="35" r="22" fill="none" stroke="currentColor" /><circle cx="35" cy="35" r="8" fill="currentColor" opacity="0.4" /></>}
      {variant === 2 && <><rect x="14" y="14" width="42" height="42" rx="4" fill="none" stroke="currentColor" /><circle cx="35" cy="35" r="8" fill="currentColor" /></>}
      {variant === 3 && <><polygon points="35,10 60,55 10,55" fill="none" stroke="currentColor" /><circle cx="35" cy="40" r="6" fill="currentColor" /></>}
    </svg>
  );
}
