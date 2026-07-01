import { createFileRoute } from "@tanstack/react-router";
import { ReviewTrayScreen } from "../../app/components/screens/admin/review-tray";

export const Route = createFileRoute("/app/revision-manual")({
  component: ReviewTrayScreen,
});
