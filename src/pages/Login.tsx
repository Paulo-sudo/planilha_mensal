// src/pages/Login.tsx
import { useState } from 'react';
import { supabase } from '../supabase_client';
import { useNavigate } from 'react-router-dom';

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
    <div className="min-h-screen flex items-center justify-center bg-indigo-950">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

        <label className="block mb-2 text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
          required
        />

        <label className="block mb-2 text-sm font-medium">Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
          required
        />

        {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition font-bold"
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
