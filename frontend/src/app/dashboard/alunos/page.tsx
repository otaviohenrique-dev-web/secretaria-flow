'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Edit2, Trash2, Loader2, Users, Save, X } from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import ThemeToggle from '@/components/ThemeToggle';

type Aluno = { id: number; nome: string; classe_id: number };
type Classe = { id: number; nome: string };

export default function GerenciadorAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  
  const [nome, setNome] = useState('');
  const [classeId, setClasseId] = useState<number | ''>('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const getToken = () => {
    const token = Cookies.get('auth_token');
    if (!token) {
      window.location.href = "/";
      return null;
    }
    return token;
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const [resAlunos, resClasses] = await Promise.all([
        fetch(`${apiUrl}/api/admin/alunos`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/classes`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      // 🚨 VERIFICAÇÃO DE TOKEN EXPIRADO 🚨
      if (resAlunos.status === 401 || resClasses.status === 401) {
        console.warn("⚠️ Token expirado. Redirecionando para login...");
        Cookies.remove('auth_token');
        window.location.href = "/";
        return;
      }

      if (resAlunos.ok && resClasses.ok) {
        setAlunos(await resAlunos.json());
        setClasses(await resClasses.json());
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || classeId === '') return;
    
    const token = getToken();
    if (!token) return;

    setProcessando(true);
    const metodo = editandoId ? 'PUT' : 'POST';
    const url = editandoId ? `${apiUrl}/api/alunos/${editandoId}` : `${apiUrl}/api/alunos`;

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nome, classe_id: Number(classeId) })
      });

      // 🚨 VERIFICAÇÃO  🚨
      if (res.status === 401) {
        Cookies.remove('auth_token');
        window.location.href = "/";
        return;
      }

      if (res.ok) {
        setNome('');
        setClasseId('');
        setEditandoId(null);
        fetchDados();
      } else {
        alert("Erro ao salvar aluno.");
      }
    } catch (error) {
      alert("Erro de comunicação com o servidor.");
    } finally {
      setProcessando(false);
    }
  };

  const handleEditar = (aluno: Aluno) => {
    setEditandoId(aluno.id);
    setNome(aluno.nome);
    setClasseId(aluno.classe_id);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Sobe a tela para o formulário no mobile
  };

  const handleCancelarEdicao = () => {
    setEditandoId(null);
    setNome('');
    setClasseId('');
  };

  const handleDeletar = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este aluno permanentemente?")) return;
    
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${apiUrl}/api/alunos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      // 🚨 VERIFICAÇÃO 🚨
      if (res.status === 401) {
        Cookies.remove('auth_token');
        window.location.href = "/";
        return;
      }

      if (res.ok) fetchDados();
    } catch (error) {
      alert("Erro ao excluir.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors flex flex-col">
      <nav className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold hover:text-indigo-600 transition-colors">
            <ChevronLeft className="w-5 h-5" /> <span className="hidden sm:inline">Voltar</span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <main className="grow max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Users className="text-indigo-500 w-8 h-8 sm:w-10 sm:h-10" />
            Gestão de Alunos
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-sm sm:text-base">Adicione, edite ou remova alunos e as suas respectivas classes.</p>
        </div>

        {/* Formulário (Responsivo: Flex Coluna no Mobile, Linha no PC) */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-4xl shadow-xl border border-slate-200 dark:border-slate-800 mb-10 flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nome do Aluno</label>
            <input 
              type="text" 
              placeholder="Ex: João Silva" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-3 px-5 outline-none text-slate-800 dark:text-white font-bold transition-all"
            />
          </div>
          <div className="w-full md:w-64 shrink-0">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Classe</label>
            <select 
              value={classeId}
              onChange={(e) => setClasseId(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-4 py-3 font-bold text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="" disabled>Selecione...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          
          <div className="w-full md:w-auto flex gap-2">
            <button 
              type="submit" 
              disabled={processando || !nome || classeId === ''}
              className={`grow md:flex-none flex items-center justify-center gap-2 font-bold px-8 py-3 rounded-2xl shadow-lg transition-all text-white ${editandoId ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'} disabled:opacity-50`}
            >
              {processando ? <Loader2 className="w-5 h-5 animate-spin" /> : (editandoId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
              {editandoId ? 'Salvar' : 'Adicionar'}
            </button>
            
            {editandoId && (
              <button 
                type="button" 
                onClick={handleCancelarEdicao}
                className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold p-3 rounded-2xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>

        {/* Lista de Alunos (Tabela com scroll horizontal no mobile) */}
        <div className="bg-white dark:bg-slate-900 rounded-4xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {loading ? (
            <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0 min-w-150">
                <thead>
                  <tr>
                    <th className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800">Aluno</th>
                    <th className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800">Classe</th>
                    <th className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {alunos.map((aluno) => {
                    const nomeClasse = classes.find(c => c.id === aluno.classe_id)?.nome || 'Sem Classe';
                    return (
                      <tr key={aluno.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{aluno.nome}</td>
                        <td className="px-6 py-4">
                          <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg text-sm font-bold">
                            {nomeClasse}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex items-center justify-end gap-2">
                          <button onClick={() => handleEditar(aluno)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeletar(aluno.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}