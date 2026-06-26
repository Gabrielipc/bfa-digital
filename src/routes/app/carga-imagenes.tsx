import { createFileRoute } from "@tanstack/react-router";
import { ImageUploadScreen } from "../../app/components/screens/admin-screens";

export const Route = createFileRoute("/app/carga-imagenes")({
  component: ImageUploadScreen,
});
