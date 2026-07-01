import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { apiClient } from "../../../api/axios";

interface AuthenticatedImageProps {
  src: string;
  alt?: string;
  className?: string;
  draggable?: boolean;
}

const isBackendUrl = (url: string): boolean => {
  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/+$/, "");
  return url.startsWith("/") || url.startsWith(apiBase);
};

const getRelativeApiPath = (url: string): string => {
  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/+$/, "");
  if (url.startsWith(apiBase)) {
    return url.slice(apiBase.length);
  }
  return url;
};

export function AuthenticatedImage({ src, alt = "", className = "", draggable = false }: AuthenticatedImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setObjectUrl(null);
      setLoading(false);
      return;
    }

    if (!isBackendUrl(src)) {
      setObjectUrl(src);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let localUrl: string | null = null;

    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(false);
        const relativePath = getRelativeApiPath(src);
        const response = await apiClient.get(relativePath, { responseType: "blob" });
        
        if (isMounted) {
          localUrl = URL.createObjectURL(response.data);
          setObjectUrl(localUrl);
        }
      } catch (err) {
        console.error("Error loading authenticated image:", err);
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted animate-pulse rounded min-h-[100px] max-w-full ${className}`}>
        <span className="text-xs text-muted-foreground font-semibold">Cargando recurso visual...</span>
      </div>
    );
  }

  if (error || !objectUrl) {
    return (
      <div className={`flex items-center justify-center bg-rose-50 border border-rose-100 rounded text-rose-500 min-h-[100px] max-w-full ${className}`}>
        <div className="text-center p-3">
          <AlertTriangle className="h-4.5 w-4.5 mx-auto mb-1 text-rose-500" />
          <span className="text-[10px] font-semibold">Error al cargar imagen</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={objectUrl}
      alt={alt}
      draggable={draggable}
      className={className}
    />
  );
}
