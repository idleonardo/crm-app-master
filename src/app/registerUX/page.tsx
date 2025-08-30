'use client';

import React, { useState } from 'react';
import Swal from 'sweetalert2';

export default function RegisterNewClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Swal.fire('Campos requeridos', 'Por favor llena todos los campos', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire('Éxito', 'Usuario registrado exitosamente', 'success');
        setEmail('');
        setPassword('');
      } else {
        Swal.fire('Error', data.error || 'Error al registrar usuario', 'error');
      }
    } catch (e) {
      Swal.fire('Error', 'Error de conexión al registrar usuario', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Registrar nuevo cliente</h2>

      <label className="block mb-2 text-sm font-medium">Correo electrónico</label>
      <input
        type="email"
        className="w-full p-2 border rounded mb-4"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="cliente@email.com"
      />

      <label className="block mb-2 text-sm font-medium">Contraseña</label>
      <input
        type="password"
        className="w-full p-2 border rounded mb-4"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="********"
      />

      <button
        onClick={handleRegister}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        disabled={loading}
      >
        {loading ? 'Registrando...' : 'Registrar'}
      </button>
    </div>
  );
}
