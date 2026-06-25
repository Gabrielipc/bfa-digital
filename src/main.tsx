import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import "./styles/index.css";

// Crear un cliente para TanStack Query
const queryClient = new QueryClient();

// Crear una instancia de router
const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
});

// Registrar el tipo del router para Type Safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
);