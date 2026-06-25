import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export const Route = createRootRoute({
  component: () => (
    <>
      {/* 
        El Outlet renderizará las rutas hijas. 
        Aquí podrías colocar un Layout global, barra de navegación, etc.
      */}
      <Outlet />
      
      {/* Herramientas de desarrollo de TanStack Router (solo visibles en desarrollo) */}
      <TanStackRouterDevtools position="bottom-right" />
    </>
  ),
});
