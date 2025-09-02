'use client';

import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!newPassword || !confirmPassword) {
      return Swal.fire('Error', 'Completa todos los campos', 'warning');
    }
    if (newPassword !== confirmPassword) {
      return Swal.fire('Error', 'Las contraseñas no coinciden', 'warning');
    }
    if (newPassword.length < 6) {
      return Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'warning');
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Contraseña actualizada',
          text: data.message,
          timer: 2500,
          showConfirmButton: false,
        });

        // ✅ Redirigir según lo que devuelva el backend
        setTimeout(() => {
          router.push(data.redirect || '/');
        }, 2500);
      } else {
        Swal.fire('Error', data.message || 'Token inválido o expirado', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Error de conexión con el servidor', 'error');
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
            <h2 className="text-2xl font-bold mb-6 text-white">Restablecer contraseña</h2>

            <label className="block mb-4">
              <span className="text-sm text-white/80">Nueva contraseña</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-2 w-full px-4 py-3 rounded-lg bg-white/6 border border-white/8 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </label>

            <label className="block mb-6">
              <span className="text-sm text-white/80">Confirmar contraseña</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
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
                'Actualizar contraseña'
              )}
            </button>

            <p className="mt-4 text-xs text-white/60 text-center">
              Después de cambiar tu contraseña podrás iniciar sesión normalmente
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
