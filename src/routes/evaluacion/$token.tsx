import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { Brand } from "../../app/components/brand";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent } from "../../app/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { participantService } from "../../api/participantService";
import { useEvaluationStore } from "../../store/evaluationStore";

export const Route = createFileRoute("/evaluacion/$token")({
  component: EvaluacionTokenLayout,
});

export interface ParticipantEvaluationAccessDTO {
  assignmentId: string;
  participantDisplayName?: string;
  sessionName: string;
  sessionStatus: "ACTIVA" | "PAUSADA" | "CERRADA" | "VENCIDA";
  attemptStatus: "NO_INICIADO" | "EN_PROGRESO" | "FINALIZADO";
  allowedActions: string[];
  subtests: Array<{
    id: string;
    name: "Figuras idénticas" | "Desplazamiento" | "Espacial";
    instructionsAvailable: boolean;
    status: "NO_INICIADO" | "EN_PROGRESO" | "COMPLETADO" | "BLOQUEADO";
    totalItems: number;
    answeredItems: number;
    timeLimitSeconds?: number;
  }>;
}

function EvaluacionTokenLayout() {
  const { token } = useParams({ from: "/evaluacion/$token" });
  const navigate = useNavigate();
  
  const setAccessData = useEvaluationStore((s) => s.setAccessData);
  const accessData = useEvaluationStore((s) => s.accessData);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await participantService.validateAccess(token);
        
        // Redirección si la sesión o token está vencido
        if (result.sessionStatus === "CERRADA" || result.sessionStatus === "VENCIDA") {
          navigate({ to: "/sesion-vencida" });
          return;
        }
        
        setAccessData(result);
      } catch (err: any) {
        if (err.status === 410) {
          navigate({ to: "/sesion-vencida" });
        } else {
          setError(err.message || "Error al validar el código de acceso.");
        }
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, navigate, setAccessData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md border-0 shadow-lg bg-white">
          <CardContent className="p-8 text-center space-y-4">
            <Brand />
            <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin" />
            <div>
              <div className="font-semibold text-primary">Validando acceso a la evaluación…</div>
              <div className="text-xs text-muted-foreground mt-1">Verificando token y estado de sesión.</div>
            </div>
            <div className="text-xs text-muted-foreground font-mono bg-muted rounded px-3 py-2 break-all">
              token={token}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md border-0 shadow-lg bg-white">
          <CardContent className="p-8 text-center space-y-4">
            <Brand />
            <div className="text-destructive font-bold text-lg">Error de Validación</div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button className="w-full mt-2" onClick={() => navigate({ to: "/evaluacion/acceso" })}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Reintentar con otro código
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!accessData) return null;

  // Si la sesión está pausada, mostramos bloqueo visual directo según el especificado
  if (accessData.sessionStatus === "PAUSADA") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md border-0 shadow-lg bg-white">
          <CardContent className="p-8 text-center space-y-4">
            <Brand />
            <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-primary">Aplicación Pausada</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La sesión de evaluación ha sido pausada temporalmente por el aplicador. Por favor, espere indicaciones del responsable de laboratorio.
            </p>
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-semibold">
              Sesión: {accessData.sessionName}
            </div>
            <Button variant="ghost" className="w-full" onClick={() => navigate({ to: "/evaluacion/acceso" })}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Regresar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Outlet />;
}
