'use client';

import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function HomeApp() {
  const router = useRouter();

    async function logoutClient() {
    try {
        await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        });

        Swal.fire({
          title: 'Logout exitoso',
          text: 'Hasta pronto 👋',
          icon: 'success',
          timer: 1200,
          showConfirmButton: false,
        });
        setTimeout(() => {
          router.replace('/');
        }, 1200);

    } catch (e) {
        Swal.fire({ title: 'Error', text: 'No se pudo cerrar sesión', icon: 'error' });
    }
    }


    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6">
        <div className="w-full max-w-3xl">
          <div className="flex justify-end mb-6">
            <button
              onClick={logoutClient}
              className="rounded-full px-4 py-2 text-sm font-medium bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 transition"
            >
              Logout
            </button>
          </div>

          <section className="glass-card p-6 rounded-2xl shadow-xl">
            <h1 className="text-3xl font-semibold mb-2">Bienvenido</h1>
            <p className="text-sm text-white/80 mb-4">Estás autenticado. Aquí iría la lista de clientes o el dashboard.</p>
          </section>
        </div>

        <style jsx>{`
          .glass-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
            border: 1px solid rgba(255,255,255,0.06);
            box-shadow: 0 8px 30px rgba(2,6,23,0.6);
            backdrop-filter: blur(10px) saturate(140%);
            -webkit-backdrop-filter: blur(10px) saturate(140%);
            color: #fff;
          }
        `}</style>
      </div>
    );
}
