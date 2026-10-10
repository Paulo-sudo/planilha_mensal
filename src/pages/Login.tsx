// src/pages/Login.tsx
import { useState } from 'react';
import { supabase } from '../supabase_client';
import { useNavigate } from 'react-router-dom';
import { HiOutlineWallet } from 'react-icons/hi2';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    const login = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (login.error) {
      setErro(login.error.message);
    } else {
        console.log(login.data);
        sessionStorage.setItem("token", login.data.session.access_token)
        navigate('/faturamento');
      // redirecione ou faça algo
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <HiOutlineWallet className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Planilha Mensal</h1>
          <p className="mt-1 text-sm text-slate-500">Entre para acessar seus débitos</p>
        </div>

        <form onSubmit={handleLogin} className="card space-y-4 p-6">
          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="input"
              required
            />
          </div>

          {erro && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {erro}
            </p>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
