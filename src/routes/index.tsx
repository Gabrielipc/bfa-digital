import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "../store/authStore";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated();
    if (isAuthenticated) {
      throw redirect({ to: "/app/dashboard" });
    } else {
      throw redirect({ to: "/login" });
    }
  },
});
