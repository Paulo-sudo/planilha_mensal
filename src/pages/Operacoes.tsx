// src/pages/Operacoes.tsx
import { useEffect, useState } from "react";
import { supabase } from "../supabase_client";
import { useNavigate } from "react-router-dom";

export default function Operacoes() {
  const [name, setName] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [nameCredit, setNameCredit] = useState("");
  const [imageBase64Credit, setImageBase64Credit] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate]);

  const handleImageChangeCredit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64Credit(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = (await supabase.auth.getUser()).data.user;

    const { error } = await supabase.from("groups").insert({
      name:name.toUpperCase(),
      image: imageBase64,
      user_id: user ? user.id : null
    });

    if (error) {
      alert("Erro ao salvar grupo");
      console.error(error);
    } else {
      alert("Grupo salvo com sucesso!");
      setName("");
      setImageBase64("");
    }
  };

  const handleSubmitCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = (await supabase.auth.getUser()).data.user;

    const { error } = await supabase.from("credit_cards").insert({
      name:nameCredit.toUpperCase(),
      image: imageBase64Credit,
      user_id: user ? user.id : null
    });

    if (error) {
      alert("Erro ao salvar credit_card");
      console.error(error);
    } else {
      alert("Credit_card salvo com sucesso!");
      setNameCredit("");
      setImageBase64Credit("");
    }
  };

  return (
    <div className="bg-indigo-950 w-screen h-screen p-6">

    <div className="mt-8 mx-auto p-4 bg-white shadow-md  rounded-lg">
      <h1 className="text-xl font-bold mb-4 text-indigo-900">Cadastrar Grupo</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Nome do Grupo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Imagem (opcional)</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imageBase64 && (
            <img src={imageBase64} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded" />
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Salvar
        </button>
      </form>
    </div>

    <div className="mt-8 mx-auto p-4 bg-white shadow-md  rounded-lg">
      <h1 className="text-xl font-bold mb-4 text-indigo-900">Cadastrar Cartão de Crédito</h1>
      <form onSubmit={handleSubmitCredit} className="space-y-4">
        <div>
          <label className="block font-medium">Nome do Cartão de Crédito</label>
          <input
            type="text"
            value={nameCredit}
            onChange={(e) => setNameCredit(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Imagem (opcional)</label>
          <input type="file" accept="image/*" onChange={handleImageChangeCredit} />
          {imageBase64Credit && (
            <img src={imageBase64Credit} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded" />
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Salvar
        </button>
      </form>
    </div>
    </div>
  );
}
