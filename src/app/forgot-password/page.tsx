'use client';

import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) return Swal.fire('Error', 'Ingresa tu correo', 'warning');

    setLoading(true);
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: data.message,
          timer: 2500,
          showConfirmButton: false,
        });
        setEmail('');
        router.push('/login'); // opcional: redirigir al login
      } else {
        Swal.fire('Error', data.error || 'Error al enviar correo', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 select-none">
      <main className="w-full max-w-md">
        <div className="relative">
          <div
            className="absolute -inset-4 blur-3xl opacity-40 rounded-3xl"
            style={{
              background:
                'linear-gradient(90deg, rgba(99,102,241,0.18), rgba(16,185,129,0.12))',
            }}
          />

          <form
            onSubmit={handleSubmit}
            className="glass-card relative p-8 rounded-3xl border border-white/10"
          >
            <h2 className="text-2xl font-bold mb-6 text-white">
              Recuperar contraseña
            </h2>

            <label className="block mb-6">
              <span className="text-sm text-white/80">Correo electrónico</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                required
                className="mt-2 w-full px-4 py-3 rounded-lg bg-white/6 border border-white/8 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-indigo-500 to-emerald-400 hover:from-indigo-600 hover:to-emerald-500 shadow-md transition"
            >
              {loading ? (
                <svg
                  className="w-5 h-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
              ) : (
                'Enviar correo'
              )}
            </button>

            <p className="mt-4 text-xs text-white/60 text-center">
              Recuerda revisar tu bandeja de entrada
            </p>

            <style jsx>{`
              .glass-card {
                position: relative;
                overflow: hidden;
                background: linear-gradient(
                  135deg,
                  rgba(255, 255, 255, 0.03),
                  rgba(255, 255, 255, 0.01)
                );
                border: 1px solid rgba(255, 255, 255, 0.06);
                box-shadow: 0 10px 30px rgba(2, 6, 23, 0.6);
                backdrop-filter: blur(12px) saturate(140%);
                -webkit-backdrop-filter: blur(12px) saturate(140%);
                color: #fff;
              }

              .glass-card::before {
                content: '';
                position: absolute;
                inset: 0;
                pointer-events: none;
                background: linear-gradient(
                  180deg,
                  rgba(255, 255, 255, 0.02),
                  rgba(255, 255, 255, 0)
                );
              }
            `}</style>
          </form>
        </div>
      </main>
    </div>
  );
}
