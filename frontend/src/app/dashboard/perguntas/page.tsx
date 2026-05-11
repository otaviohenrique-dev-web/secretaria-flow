'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Power, Hash, Check, Loader2, Edit2, Trash2, Save, X } from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import ThemeToggle from '@/components/ThemeToggle';

type Pergunta = { id: number; texto: string; tipo: 'booleano' | 'numero'; escopo: 'individual' | 'global'; ativa: boolean };

export default function GerenciadorPerguntas() {
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [novoTexto, setNovoTexto] = useState('');
  const [novoTipo, setNovoTipo] = useState<'booleano' | 'numero'>('booleano');
  const [novoEscopo, setNovoEscopo] = useState<'individual' | 'global'>('individual');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

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
    fetchPerguntas();
  }, []);

  const fetchPerguntas = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${apiUrl}/api/admin/perguntas`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        Cookies.remove('auth_token');
        window.location.href = "/";
        return;
      }

      if (res.ok) setPerguntas(await res.json());
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTexto) return;
    
    const token = getToken();
    if (!token) return;

    setEnviando(true);
    const metodo = editandoId ? 'PUT' : 'POST';
    const url = editandoId ? `${apiUrl}/api/perguntas/${editandoId}` : `${apiUrl}/api/perguntas`;

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ texto: novoTexto, tipo: novoTipo, escopo: novoEscopo, ativa: true })
      });

      if (res.status === 401) {
        Cookies.remove('auth_token');
        window.location.href = "/";
        return;
      }

      if (res.ok) {
        handleCancelarEdicao();
        fetchPerguntas(); 
      } else {
        alert("Erro ao salvar a métrica.");
      }
    } catch (error) {
      alert("Erro de comunicação com o servidor.");
    } finally {
      setEnviando(false);
    }
  };

  const handleEditar = (p: Pergunta) => {
    setEditandoId(p.id);
    setNovoTexto(p.texto);
    setNovoTipo(p.tipo);
    setNovoEscopo(p.escopo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelarEdicao = () => {
    setEditandoId(null);
    setNovoTexto('');
    setNovoTipo('booleano');
    setNovoEscopo('individual');
  };

  const handleDeletar = async (id: number) => {
    if (!window.confirm("CUIDADO! Excluir esta métrica apagará permanentemente as respostas ligadas a ela nos relatórios. Continuar?")) return;
    
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${apiUrl}/api/perguntas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        Cookies.remove('auth_token');
        window.location.href = "/";
        return;
      }

      if (res.ok) fetchPerguntas();
      else alert("Erro ao excluir. Verifique se há permissões.");
    } catch (error) {
      alert("Erro de comunicação com o servidor.");
    }
  };

  const toggleStatus = async (id: number) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${apiUrl}/api/perguntas/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        Cookies.remove('auth_token');
        window.location.href = "/";
        return;
      }

      if (res.ok) fetchPerguntas(); 
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors flex flex-col">
      <nav className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold hover:text-indigo-600 transition-colors">
            <ChevronLeft className="w-5 h-5" /> Voltar
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <main className="grow max-w-4xl mx-auto px-4 py-12 w-full">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Gerenciar Métricas</h1>
          <p className="text-slate-500 mt-2 font-medium">Adicione, edite, exclua ou desative as métricas da chamada.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-4xl shadow-xl border border-slate-200 dark:border-slate-800 mb-10 flex flex-col gap-4">
          <div className="w-full">
            <input 
              type="text" 
              placeholder="Nome da métrica (Ex: Oferta, Estudo Bíblico...)" 
              value={novoTexto}
              onChange={(e) => setNovoTexto(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-3 px-5 outline-none text-slate-800 dark:text-white font-bold transition-all"
            />
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <select 
              value={novoTipo}
              onChange={(e) => setNovoTipo(e.target.value as 'booleano' | 'numero')}
              className="bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-4 py-3 font-bold text-slate-700 dark:text-slate-200 outline-none w-full md:w-auto grow"
            >
              <option value="booleano">Sim/Não (Booleano)</option>
              <option value="numero">Quantidade (Número)</option>
            </select>

            <select 
              value={novoEscopo}
              onChange={(e) => setNovoEscopo(e.target.value as 'individual' | 'global')}
              className="bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-4 py-3 font-bold text-slate-700 dark:text-slate-200 outline-none w-full md:w-auto grow"
            >
              <option value="individual">Individual (Por Aluno)</option>
              <option value="global">Global (Para a Classe inteira)</option>
            </select>
            
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                type="submit" 
                disabled={enviando || !novoTexto}
                className={`grow md:flex-none flex items-center justify-center gap-2 font-bold px-8 py-3 rounded-2xl text-white transition-all shadow-lg ${editandoId ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'} disabled:opacity-50`}
              >
                {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : (editandoId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
                {editandoId ? 'Salvar' : 'Adicionar'}
              </button>

              {editandoId && (
                <button 
                  type="button" 
                  onClick={handleCancelarEdicao}
                  className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 p-3 rounded-2xl transition-all"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-10"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
          ) : (
            perguntas.map((p) => (
              <div key={p.id} className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border transition-all ${p.ativa ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm' : 'bg-slate-100 dark:bg-slate-950 border-transparent opacity-60'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${p.tipo === 'booleano' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                    {p.tipo === 'booleano' ? <Check className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">{p.texto}</h4>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {p.escopo === 'individual' ? 'Individual' : 'Global da Classe'} • {p.tipo === 'booleano' ? 'Sim/Não' : 'Número'}
                    </span>     
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button onClick={() => handleEditar(p)} className="p-2.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all" title="Editar métrica">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeletar(p.id)} className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all" title="Excluir permanentemente">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>

                  <button 
                    onClick={() => toggleStatus(p.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${p.ativa ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  >
                    <Power className="w-4 h-4" />
                    {p.ativa ? 'Desativar' : 'Reativar'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}