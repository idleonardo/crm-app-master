'use client';

import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { useState } from 'react';

// Calculadoras
import CavityMethodCalculator from '../components/CavityMethodCalculator';
import FlujoTotalMethodCalculator from '../components/CavityMethodLightingApp';
import ConductorCalculator from '../components/ConductorsCalculator';

// Iconos
import { Calculator, Home, Percent } from 'lucide-react';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode | null;
  colorClass: string; // clase de Tailwind para bg/border
}

export default function HomeApp() {
  const router = useRouter();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  async function logoutClient() {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });

      Swal.fire({
        title: 'Logout exitoso',
        text: 'Hasta pronto 👋',
        icon: 'success',
        timer: 1200,
        showConfirmButton: false,
      });

      setTimeout(() => router.replace('/'), 1200);
    } catch (e) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo cerrar sesión',
        icon: 'error',
      });
    }
  }

  const tools: Tool[] = [
    {
      id: 'home',
      title: 'Inicio',
      description: 'Regresa al panel principal.',
      icon: <Home className="w-10 h-10 mb-3 text-green-400" />,
      component: null,
      colorClass: 'green',
    },
    {
      id: 'cavity',
      title: 'Método de Cavidades',
      description: 'Calculadora para iluminación por el método de cavidades.',
      icon: <Calculator className="w-10 h-10 mb-3 text-blue-400" />,
      component: <CavityMethodCalculator />,
      colorClass: 'blue',
    },
    {
      id: 'flujo',
      title: 'Flujo Total',
      description: 'Calculadora para iluminación por el método de flujo total.',
      icon: <Percent className="w-10 h-10 mb-3 text-purple-400" />,
      component: <FlujoTotalMethodCalculator />,
      colorClass: 'purple',
    },
    {
      id: 'conductor',
      title: 'Conductor',
      description: 'Calculadora para dimensionar conductores eléctricos.',
      icon: <Calculator className="w-10 h-10 mb-3 text-blue-400" />,
      component: <ConductorCalculator />,
      colorClass: 'blue',
    },
  ];

  const getClasses = (tool: Tool) => {
    const base = 'p-6 rounded-2xl border transition cursor-pointer hover:scale-105';
    const active = `bg-${tool.colorClass}-600/20 border-${tool.colorClass}-400`;
    const inactive = `bg-slate-800/40 border-slate-600 hover:border-${tool.colorClass}-400`;
    return `${base} ${selectedTool === tool.id ? active : inactive}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6">
      <div className="w-full max-w-5xl">
        <div className="flex justify-end mb-6">
          <button
            onClick={logoutClient}
            className="rounded-full px-4 py-2 text-sm font-medium bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 transition"
          >
            Logout
          </button>
        </div>

        <section className="glass-card p-6 rounded-2xl shadow-xl">
          <h1 className="text-3xl font-semibold mb-4">Bienvenido</h1>
          <p className="text-sm text-white/80 mb-6">
            Estás autenticado. Selecciona una herramienta para comenzar:
          </p>

          {/* Cards dinámicas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {tools.map((tool) => (
              <div
                key={tool.id}
                onClick={() =>
                  setSelectedTool(tool.id === 'home' ? null : tool.id)
                }
                className={getClasses(tool)}
              >
                {tool.icon}
                <h2 className="text-lg font-semibold">{tool.title}</h2>
                <p className="text-sm text-white/70 mt-1">{tool.description}</p>
              </div>
            ))}
          </div>

          {/* Renderizado condicional */}
          <div className="mt-8">
            {tools.map(
              (tool) =>
                selectedTool === tool.id &&
                tool.component && (
                  <div
                    key={tool.id}
                    className="p-4 rounded-xl bg-slate-900/50 border border-slate-700"
                  >
                    {tool.component}
                  </div>
                )
            )}

            {!selectedTool && (
              <p className="text-center text-white/60 text-sm">
                Selecciona una tarjeta para comenzar 🚀
              </p>
            )}
          </div>
        </section>
      </div>

      <style jsx>{`
        .glass-card {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.04),
            rgba(255, 255, 255, 0.02)
          );
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 8px 30px rgba(2, 6, 23, 0.6);
          backdrop-filter: blur(10px) saturate(140%);
          -webkit-backdrop-filter: blur(10px) saturate(140%);
          color: #fff;
        }
      `}</style>
    </div>
  );
}
