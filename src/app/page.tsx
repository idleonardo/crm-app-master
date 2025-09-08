'use client';

import React, { useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginGlass() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tokenCookie, setTokenCookie] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = useCallback(() => {
    const e: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Introduce un email válido';
    if (password.length < 6) e.password = 'La contraseña debe tener al menos 6 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [email, password]);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setTokenCookie('cookie-set');
        router.push('/homePage');
        Swal.fire({
          icon: 'success',
          title: '¡Login exitoso!',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2800,
          timerProgressBar: true,
        });
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Credenciales inválidas' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error en login' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (emailInput: string) => {
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire('Éxito', 'Correo de recuperación enviado', 'success');
      } else {
        Swal.fire('Error', data.error || 'Usuario no encontrado', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Error en la solicitud', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 select-none">
      <main className="w-full max-w-md">
        <div className="relative">
          <div className="absolute -inset-4 blur-3xl opacity-40 rounded-3xl" style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.18), rgba(16,185,129,0.12))' }} />

          <form onSubmit={handleLogin} className="glass-card relative p-8 rounded-3xl border border-white/10">
            <h2 className="text-2xl font-bold mb-6 text-white">Iniciar sesión</h2>

            <label className="block mb-4">
              <span className="text-sm text-white/80">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full px-4 py-3 rounded-lg bg-white/6 border border-white/8 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="ejemplo@correo.com"
              />
            </label>

            <label className="block mb-6">
              <span className="text-sm text-white/80">Contraseña</span>

             <div className='flex items-center gap-2'>
                <input
                  type={showPassword ? 'text' : 'password'} 
                  id='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-2 w-full px-4 py-3 rounded-lg bg-white/6 border border-white/8 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="••••••••"
                />
                <div
                  className='bg-white/5 p-3 mt-2 rounded-lg cursor-pointer hover:bg-white/10 transition'
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Image
                    src={showPassword ? "/invisible.png" : "/ojo.png"}
                    alt="Ver/Ocultar contraseña"
                    width={30}
                    height={30}
                  />
                </div>
              </div>

                
              {errors.password && (
                <p id="password-error" className="text-xs text-rose-400 mt-1">
                  {errors.password}
                </p>
              )}

            </label>

            <div className="flex items-center justify-between gap-4">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-indigo-500 to-emerald-400 hover:from-indigo-600 hover:to-emerald-500 shadow-md transition"
                disabled={loading}
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                ) : (
                  'Entrar'
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/registerUX')}
                className="px-4 py-3 rounded-lg border border-white/10 bg-white/3 text-white/90 hover:bg-white/8 transition"
                disabled={loading}
              >
                Crear cuenta
              </button>
            </div>

            <p className="mt-4 text-xs text-white/60">
              ¿Olvidaste tu contraseña?{' '}
              <button
                type="button"
                className="underline"
                onClick={() =>
                  Swal.fire({
                    title: 'Recuperar contraseña',
                    html: `<input type="email" id="swal-email" class="swal2-input" placeholder="Ingresa tu correo">`,
                    showCancelButton: true,
                    confirmButtonText: 'Enviar',
                    preConfirm: () => {
                      const emailInput = (Swal.getPopup()?.querySelector('#swal-email') as HTMLInputElement)?.value;
                      if (!emailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
                        Swal.showValidationMessage(`Introduce un email válido`);
                        return;
                      }
                      return emailInput;
                    },
                  }).then((result) => {
                    if (result.isConfirmed && result.value) handleForgotPassword(result.value);
                  })
                }
              >
                Recuperarla
              </button>
            </p>

            <style jsx>{`
              .glass-card {
                position: relative;
                overflow: hidden;
                background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
                border: 1px solid rgba(255,255,255,0.06);
                box-shadow: 0 10px 30px rgba(2,6,23,0.6);
                backdrop-filter: blur(12px) saturate(140%);
                -webkit-backdrop-filter: blur(12px) saturate(140%);
                color: #fff;
              }

              /* subtle top highlight */
              .glass-card::before {
                content: '';
                position: absolute;
                inset: 0;
                pointer-events: none;
                background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0));
              }
            `}</style>
          </form>
        </div>
      </main>
    </div>
  );
}
