import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setError('No se pudo iniciar sesión. Intentá de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0faf4] to-[#e8f5ee] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-[0_24px_80px_-12px_rgba(27,67,50,0.22)] border border-gray-100 overflow-hidden w-full max-w-sm">
        <div className="h-1.5 bg-gradient-to-r from-brand-primary via-[#40916C] to-[#74C69D]" />
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/25 mb-5">
            <img src="/icon.svg" alt="" className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-brand-primary mb-1">AgroAsistencia</h1>
          <p className="text-sm text-brand-secondary mb-8">Ingresá con tu cuenta para continuar</p>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-brand-secondary hover:bg-brand-neutral transition-all shadow-sm disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
              <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
              <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
              <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
              <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
            </svg>
            {loading ? 'Iniciando...' : 'Continuar con Google'}
          </button>

          {error && <p className="mt-4 text-xs font-bold text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
