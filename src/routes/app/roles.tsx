import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { roleService, PermissionDTO, RoleDTO } from "../../api/roleService";
import { Alert, AlertDescription } from "../../app/components/ui/alert";
import { Badge } from "../../app/components/ui/badge";
import { Button } from "../../app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Checkbox } from "../../app/components/ui/checkbox";

export const Route = createFileRoute("/app/roles")({
  component: RolesRoute,
});

function RolesRoute() {
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [permissions, setPermissions] = useState<PermissionDTO[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId),
    [roles, selectedRoleId],
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [roleRows, permissionRows] = await Promise.all([
          roleService.listRoles(),
          roleService.listPermissions(),
        ]);
        setRoles(roleRows);
        setPermissions(permissionRows);
        if (roleRows.length > 0) {
          setSelectedRoleId(roleRows[0].id);
        }
      } catch (err: any) {
        setError(err.message || "No se pudieron cargar roles y permisos.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!selectedRoleId) {
      setSelectedPermissionIds([]);
      return;
    }

    const loadPermissionsForRole = async () => {
      setLoading(true);
      setError("");
      try {
        setSelectedPermissionIds(await roleService.listRolePermissionIds(selectedRoleId));
      } catch (err: any) {
        setError(err.message || "No se pudieron cargar los permisos del rol.");
      } finally {
        setLoading(false);
      }
    };

    loadPermissionsForRole();
  }, [selectedRoleId]);

  const togglePermission = (permissionId: number, checked: boolean) => {
    setSelectedPermissionIds((current) => {
      if (checked) {
        return current.includes(permissionId) ? current : [...current, permissionId];
      }
      return current.filter((id) => id !== permissionId);
    });
  };

  const savePermissions = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await roleService.replaceRolePermissions(selectedRoleId, selectedPermissionIds);
      setSelectedPermissionIds(await roleService.listRolePermissionIds(selectedRoleId));
      setNotice("Permisos actualizados.");
    } catch (err: any) {
      setError(err.message || "No se pudieron guardar los permisos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>Seleccione un rol para editar su matriz de permisos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => {
                setNotice("");
                setSelectedRoleId(role.id);
              }}
              className={`w-full rounded border px-3 py-2 text-left text-sm transition ${
                role.id === selectedRoleId ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted"
              }`}
            >
              <div className="font-medium">{role.name}</div>
            </button>
          ))}
          {!loading && roles.length === 0 && (
            <div className="rounded border border-dashed p-4 text-sm text-muted-foreground">No hay roles registrados.</div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Permisos {selectedRole ? `de ${selectedRole.name}` : ""}
            </CardTitle>
            <CardDescription>Los cambios reemplazan la lista completa de permisos del rol seleccionado.</CardDescription>
          </div>
          <Button onClick={savePermissions} disabled={!selectedRoleId || saving || loading}>
            <Save className="mr-1 h-4 w-4" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {notice && <Alert><AlertDescription>{notice}</AlertDescription></Alert>}
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {permissions.map((permission) => {
              const checked = selectedPermissionIds.includes(permission.id);
              return (
                <label key={permission.id} className="flex min-h-24 gap-3 rounded border p-3 text-sm hover:bg-muted/40">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => togglePermission(permission.id, value === true)}
                    disabled={!selectedRoleId || loading || saving}
                  />
                  <span className="min-w-0">
                    <span className="block font-medium">{permission.name}</span>
                    <Badge variant="secondary" className="mt-1 text-[10px]">{permission.code}</Badge>
                    {permission.description && (
                      <span className="mt-2 block text-xs text-muted-foreground">{permission.description}</span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          {!loading && permissions.length === 0 && (
            <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
              No hay permisos registrados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
