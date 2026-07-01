import { createFileRoute } from "@tanstack/react-router";
import { ImageUploadScreen } from "../../app/components/screens/admin/image-upload";

export const Route = createFileRoute("/app/carga-imagenes")({
  component: ImageUploadScreen,
});
