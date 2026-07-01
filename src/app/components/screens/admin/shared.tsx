import { Label } from "../../ui/label";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export const COLORS = ["#0f2649", "#1e4e8c", "#b91c1c", "#64748b", "#10b981", "#f59e0b"];
