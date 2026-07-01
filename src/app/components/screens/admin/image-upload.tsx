import { useState } from "react";
import { instrumentService } from "../../../../api/instrumentService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Upload } from "lucide-react";
import { Field } from "./shared";

export function ImageUploadScreen() {
  const [subtestId, setSubtestId] = useState("figuras");
  const [itemId, setItemId] = useState("1");
  const [optionId, setOptionId] = useState("1");
  const [role, setRole] = useState("modelo");
  const [altText, setAltText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Error: Por favor, seleccione un archivo primero.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      if (role === "modelo") {
        await instrumentService.uploadImage(file, itemId, undefined, altText, "ENUNCIADO");
      } else {
        await instrumentService.uploadOptionImage(file, optionId, undefined, altText);
      }
      setMessage("¡Imagen cargada exitosamente!");
      setFile(null);
    } catch (error: any) {
      console.error(error);
      setMessage("Error al cargar la imagen: " + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 border-0 shadow-sm">
        <CardHeader><CardTitle>Cargar imágenes confidenciales</CardTitle><CardDescription>Las imágenes se cifran y no se mostrarán al participante con opción de descarga.</CardDescription></CardHeader>
        <CardContent>
          <label className="block rounded-lg border-2 border-dashed p-10 text-center cursor-pointer hover:bg-muted/50">
            <Upload className="h-8 w-8 mx-auto text-primary" />
            <div className="mt-2 font-medium">
              {file ? `Seleccionado: ${file.name}` : "Arrastra o haz clic para subir"}
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <div className="text-xs text-muted-foreground mt-1">PNG, JPG hasta 2MB.</div>
          </label>

          {message && (
            <div className={`mt-4 p-2.5 text-sm rounded ${message.startsWith("Error") ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>
              {message}
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Metadatos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label="Subtest">
            <Select value={subtestId} onValueChange={setSubtestId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="figuras">Figuras idénticas</SelectItem>
                <SelectItem value="desplazamiento">Desplazamiento</SelectItem>
                <SelectItem value="espacial">Espacial</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={role === "modelo" ? "Ítem #" : "Opción #"}>
            {role === "modelo" ? (
              <Input type="number" value={itemId} onChange={(e) => setItemId(e.target.value)} placeholder="1" />
            ) : (
              <Input type="number" value={optionId} onChange={(e) => setOptionId(e.target.value)} placeholder="1" />
            )}
          </Field>
          <Field label="Rol en ítem">
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="modelo">Modelo</SelectItem>
                <SelectItem value="opc">Opción</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Texto alternativo (interno)">
            <Textarea rows={2} value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="No visible al participante" />
          </Field>
          <Button className="w-full" onClick={handleUpload} disabled={uploading}>
            {uploading ? "Subiendo..." : "Subir Imagen y Guardar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
