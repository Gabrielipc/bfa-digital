import { createFileRoute } from '@tanstack/react-router';
import App from '../app/App'; // Importamos tu App actual temporalmente

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 
        Mientras migramos todas las vistas a TanStack Router, 
        renderizamos la App antigua aquí para que siga funcionando.
        Idealmente, cada ViewKey que tenías en App.tsx se volverá un archivo nuevo 
        en la carpeta src/routes/
      */}
      <App />
    </div>
  );
}
