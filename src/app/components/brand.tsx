import { Brain } from "lucide-react";

export function Brand({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-9 w-9 rounded-md flex items-center justify-center ${light ? "bg-white/10" : "bg-primary"}`}>
        <Brain className={`h-5 w-5 ${light ? "text-white" : "text-primary-foreground"}`} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className={`font-semibold ${light ? "text-white" : "text-primary"}`}>BFA Digital</div>
          <div className={`text-xs ${light ? "text-white/70" : "text-muted-foreground"}`}>Universidad Americana · UAM</div>
        </div>
      )}
    </div>
  );
}
