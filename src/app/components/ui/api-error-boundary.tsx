import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "./button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ApiErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in ApiErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border border-destructive/20 rounded-lg bg-destructive/5 text-center min-h-[300px]">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/15 text-destructive mb-4 animate-bounce">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-destructive">Algo salió mal</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
            Ocurrió un error inesperado al procesar la información.
            {this.state.error?.message && (
              <code className="block mt-2 p-2 bg-muted text-xs rounded border border-border/40 text-foreground font-mono text-left max-h-24 overflow-y-auto">
                {this.state.error.message}
              </code>
            )}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={this.handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reintentar
            </Button>
            <Button size="sm" onClick={() => (window.location.href = "/")}>
              <Home className="h-4 w-4 mr-1" /> Ir al inicio
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ApiErrorPanelProps {
  error: any;
  resetErrorBoundary?: () => void;
}

export function ApiErrorPanel({ error, resetErrorBoundary }: ApiErrorPanelProps) {
  const status = error?.response?.status || error?.status;
  const message = error?.response?.data?.message || error?.message || "Error desconocido";

  let title = "Error de Conexión";
  let description = "No pudimos comunicarnos con el servidor. Por favor, verifica tu conexión a internet.";

  if (status === 400) {
    title = "Solicitud Inválida";
    description = "La solicitud no se pudo procesar. Por favor revisa los datos ingresados.";
  } else if (status === 401) {
    title = "Sesión Expirada";
    description = "Tu sesión ha expirado o no estás autenticado. Por favor ingresa nuevamente.";
  } else if (status === 403) {
    title = "Acceso Denegado";
    description = "No tienes permisos suficientes para realizar esta acción.";
  } else if (status === 404) {
    title = "No Encontrado";
    description = "El recurso solicitado no existe o no está disponible.";
  } else if (status === 409) {
    title = "Conflicto de Estado";
    description = "La operación fue rechazada debido a un conflicto. Por favor actualiza la pantalla.";
  } else if (status === 410) {
    title = "Acceso Vencido";
    description = "El token de evaluación o recurso solicitado ha expirado.";
  } else if (status === 500) {
    title = "Error Interno del Servidor";
    description = "El servidor experimentó un error interno. Intente más tarde.";
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 border border-destructive/20 rounded-lg bg-destructive/5 text-center min-h-[300px] w-full max-w-xl mx-auto my-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/15 text-destructive mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-destructive">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 mb-4 max-w-md">
        {description}
      </p>
      <code className="block mb-6 p-2 bg-muted/60 text-xs rounded border border-border/40 text-foreground font-mono text-left max-h-24 overflow-y-auto w-full">
        {message} (HTTP {status || "Unknown"})
      </code>
      <div className="flex items-center gap-3">
        {resetErrorBoundary && (
          <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reintentar
          </Button>
        )}
        <Button size="sm" onClick={() => (window.location.href = "/")}>
          <Home className="h-4 w-4 mr-1" /> Ir al inicio
        </Button>
      </div>
    </div>
  );
}
