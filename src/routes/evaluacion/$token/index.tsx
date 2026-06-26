import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/evaluacion/$token/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: `/evaluacion/${params.token}/bienvenida` });
  },
});
