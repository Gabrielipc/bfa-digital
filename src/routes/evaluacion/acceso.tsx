import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Brand } from "../../app/components/brand";
import { Button } from "../../app/components/ui/button";
import { Input } from "../../app/components/ui/input";
import { Label } from "../../app/components/ui/label";
import { Card, CardContent } from "../../app/components/ui/card";
import { Alert, AlertDescription } from "../../app/components/ui/alert";
import { KeyRound, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/evaluacion/acceso")({
  component: EvaluacionAccesoRoute,
});

function EvaluacionAccesoRoute() {
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenInput.trim();
    if (!token) {
      setError("Por favor ingrese el codigo de acceso proporcionado por su aplicador.");
      return;
    }

    if (!/^\d+-.+/.test(token)) {
      setError("El codigo debe tener el formato assignmentId-token.");
      return;
    }

    navigate({ to: `/evaluacion/${token}` });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md border-0 shadow-lg bg-white">
        <CardContent className="p-8">
          <div className="flex justify-center mb-6">
            <Brand />
          </div>

          <h1 className="text-2xl font-semibold text-primary text-center">Acceso a Evaluacion</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Ingrese el codigo de acceso personal que le brindo su aplicador para iniciar su sesion de pruebas.
          </p>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="token" className="sr-only">Codigo de Acceso</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="token"
                  placeholder="Ej. 123-ABCD"
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    setError("");
                  }}
                  className="pl-10 text-center font-mono uppercase tracking-wider text-base"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Continuar <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              className="text-xs text-muted-foreground hover:text-primary gap-1"
              onClick={() => navigate({ to: "/login" })}
            >
              <ArrowLeft className="h-3 w-3" /> Volver al portal interno
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
