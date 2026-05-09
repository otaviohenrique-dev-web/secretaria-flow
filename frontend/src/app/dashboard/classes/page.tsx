'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Edit2, Trash2, Loader2, BookOpen, Save, X } from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import ThemeToggle from '@/components/ThemeToggle';

type Classe = { id: number; nome: string; professor: string; associado: string };

export default function GerenciadorClasses() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [nome, setNome] = useState('');
  const [professor, setProfessor] = useState('');
  const [associado, setAssociado] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const getToken = () => {
    const token = Cookies.get('auth_token');
    if (!token) { window.location.href = "/"; return null; }
    return token;
  };

  useEffect(() => { fetchDados(); }, []);

  const fetchDados = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/api/classes`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setClasses(await res.json());
    } catch (error) {
      console.error(error);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;
    const token = getToken();
    if (!token) return;

    setProcessando(true);
    const metodo = editandoId ? 'PUT' : 'POST';
    const url = editandoId ? `${apiUrl}/api/classes/${editandoId}` : `${apiUrl}/api/classes`;

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nome, professor, associado })
      });
      if (res.ok) {
        setNome(''); setProfessor(''); setAssociado(''); setEditandoId(null);
        fetchDados();
      }
    } catch (error) { alert("Erro ao salvar."); } 
    finally { setProcessando(false); }
  };

  const handleEditar = (c: Classe) => {
    setEditandoId(c.id); setNome(c.nome); setProfessor(c.professor || ''); setAssociado(c.associado || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletar = async (id: number) => {
    if (!window.confirm("Cuidado! Excluir a classe apagará os alunos vinculados a ela. Continuar?")) return;
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/api/classes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchDados();
    } catch (error) { alert("Erro ao excluir."); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <nav className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold hover:text-indigo-600 transition-colors">
            <ChevronLeft className="w-5 h-5" /> <span className="hidden sm:inline">Voltar</span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <main className="grow max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <BookOpen className="text-indigo-500 w-8 h-8 sm:w-10 sm:h-10" /> Gestão de Unidades
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-4xl shadow-xl border border-slate-200 dark:border-slate-800 mb-10 flex flex-col lg:flex-row gap-4 items-end">
          <div className="w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome da Classe</label>
            <input type="text" placeholder="Ex: Jovens" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-3 px-5 outline-none font-bold" />
          </div>
          <div className="w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Professor</label>
            <input type="text" placeholder="Ex: João Silva" value={professor} onChange={(e) => setProfessor(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-3 px-5 outline-none font-bold" />
          </div>
          <div className="w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Associado</label>
            <input type="text" placeholder="Ex: Maria Lima" value={associado} onChange={(e) => setAssociado(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-3 px-5 outline-none font-bold" />
          </div>
          <div className="w-full lg:w-auto flex gap-2">
            <button type="submit" disabled={processando || !nome} className="grow lg:flex-none flex items-center justify-center gap-2 font-bold px-8 py-3 rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
              {processando ? <Loader2 className="w-5 h-5 animate-spin" /> : (editandoId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
              {editandoId ? 'Salvar' : 'Adicionar'}
            </button>
            {editandoId && (
              <button type="button" onClick={() => {setEditandoId(null); setNome(''); setProfessor(''); setAssociado('');}} className="bg-slate-200 dark:bg-slate-800 p-3 rounded-2xl">
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            )}
          </div>
        </form>

        <div className="bg-white dark:bg-slate-900 rounded-4xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {loading ? <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-150">
                <thead>
                  <tr>
                    <th className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs uppercase font-black">Classe</th>
                    <th className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs uppercase font-black">Liderança</th>
                    <th className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs uppercase font-black text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {classes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="px-6 py-4 font-black text-lg text-slate-800 dark:text-slate-200">{c.nome}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-sm">
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">Prof: <span className="text-slate-700 dark:text-slate-300 font-medium">{c.professor || '-'}</span></span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Assoc: <span className="text-slate-700 dark:text-slate-300 font-medium">{c.associado || '-'}</span></span>
                        </div>
                      </td>
                      <td className="px-6 py-4 flex items-center justify-end gap-2">
                        <button onClick={() => handleEditar(c)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeletar(c.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}