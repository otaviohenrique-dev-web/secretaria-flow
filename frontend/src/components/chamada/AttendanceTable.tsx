'use client';
import { useState, useEffect } from 'react';
import { Check, X, Hash, Save, Users, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

type Aluno = { id: number; nome: string; classe_id: number };
type Pergunta = { id: number; texto: string; tipo: 'booleano' | 'numero'; escopo: 'individual' | 'global'; ativa: boolean };

const getAvatarColor = (name: string) => {
  const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getIconForPergunta = (texto: string, tipo: string) => {
  if (texto.toLowerCase().includes('grupo')) return <Users className="w-4 h-4" />;
  if (tipo === 'numero') return <Hash className="w-4 h-4" />;
  return <Check className="w-4 h-4" />;
};

export default function AttendanceTable({ classeSelecionada, dataSelecionada }: { classeSelecionada: string, dataSelecionada: string }) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const fetchTableData = async () => {
      setLoading(true);
      const token = Cookies.get('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      if (!token || !classeSelecionada) return;

      try {
        const [resPerguntas, resAlunos] = await Promise.all([
          fetch(`${apiUrl}/api/perguntas`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/api/alunos?classe_nome=${encodeURIComponent(classeSelecionada)}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (resPerguntas.ok && resAlunos.ok) {
          const dataPerguntas = await resPerguntas.json();
          const dataAlunos = await resAlunos.json();
          setPerguntas(dataPerguntas);
          setAlunos(dataAlunos);
        }
      } catch (error) {
        console.error("Erro ao buscar dados da tabela:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTableData();
  }, [classeSelecionada]);

  const handleChange = (alunoId: number, perguntaId: number, valor: any) => {
    setRespostas(prev => ({ ...prev, [`${alunoId}-${perguntaId}`]: valor }));
  };

  const handleSalvar = async () => {
    if (Object.keys(respostas).length === 0) {
      alert('Nenhuma resposta preenchida para salvar.');
      return;
    }

    setSalvando(true);
    const token = Cookies.get('auth_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const res = await fetch(`${apiUrl}/api/chamada`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          data: dataSelecionada,
          respostas: respostas
        })
      });

      if (res.ok) {
        alert('✨ Chamada salva com sucesso!');
      } else {
        const error = await res.json();
        alert(`❌ Erro ao salvar: ${error.detail || 'Falha no servidor'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar chamada:', error);
      alert('❌ Erro de conexão ao tentar salvar.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-slate-200/50 dark:border-slate-800/50 h-64">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Carregando diário de classe...</p>
      </div>
    );
  }

  if (alunos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-slate-200/50 dark:border-slate-800/50">
        <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Nenhum aluno encontrado</h3>
        <p className="text-slate-500 dark:text-slate-400">Esta classe ainda não possui alunos cadastrados no sistema.</p>
      </div>
    );
  }

  // Filtragem agora é baseada no ESCOPO e não no TIPO
  const perguntasAluno = perguntas.filter(p => p.escopo === 'individual');
  const perguntasClasse = perguntas.filter(p => p.escopo === 'global');

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden transition-all flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] sticky left-0 z-20 backdrop-blur-md">Aluno</th>
              {perguntasAluno.map(p => (
                <th key={p.id} className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 text-indigo-500">
                      {getIconForPergunta(p.texto, p.tipo)}
                    </span>
                    {p.texto}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {alunos.map((aluno) => (
              <tr key={aluno.id} className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                <td className="px-8 py-5 sticky left-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10 border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_10px_-4px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner ${getAvatarColor(aluno.nome)}`}>
                      {aluno.nome.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200 tracking-tight whitespace-nowrap">{aluno.nome}</span>
                  </div>
                </td>
                
                {/* Renderização Condicional Individual */}
                {perguntasAluno.map(p => {
                  const val = respostas[`${aluno.id}-${p.id}`];
                  return (
                    <td key={p.id} className="px-8 py-5 text-center">
                      {p.tipo === 'booleano' ? (
                        <button
                          onClick={() => handleChange(aluno.id, p.id, !val)}
                          className={`w-16 h-8 rounded-2xl relative transition-all duration-500 flex items-center px-1 mx-auto ${val ? 'bg-emerald-500 shadow-emerald-200 dark:shadow-none' : 'bg-slate-200 dark:bg-slate-800'}`}
                        >
                          <div className={`w-6 h-6 rounded-xl bg-white shadow-lg transition-all duration-500 flex items-center justify-center ${val ? 'translate-x-8' : 'translate-x-0'}`}>
                            {val ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                          </div>
                        </button>
                      ) : (
                        <input
                          type="number"
                          placeholder="0"
                          value={val || ''}
                          onChange={(e) => handleChange(aluno.id, p.id, e.target.value)}
                          className="w-20 mx-auto bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 rounded-2xl py-2 px-3 text-center font-black text-slate-700 dark:text-slate-200 outline-none transition-all"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ÁREA DEDICADA A MÉTRICAS GLOBAIS DA CLASSE */}
      {perguntasClasse.length > 0 && (
        <div className="px-8 py-6 bg-indigo-50/50 dark:bg-indigo-900/20 border-t border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-4">Métricas Globais da Classe</h4>
          <div className="flex flex-wrap gap-6">
            {perguntasClasse.map(p => {
              const globalKey = `${alunos[0]?.id}-${p.id}`; // Associa ao primeiro aluno como veículo para o banco
              const val = respostas[globalKey];

              return (
                <div key={p.id} className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 pr-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                    {getIconForPergunta(p.texto, p.tipo)}
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{p.texto}</span>
                  
                  {/* Renderização Condicional Global */}
                  {p.tipo === 'booleano' ? (
                    <button
                      onClick={() => handleChange(alunos[0]?.id, p.id, !val)}
                      className={`w-16 h-8 rounded-2xl relative transition-all duration-500 flex items-center px-1 ml-2 ${val ? 'bg-emerald-500 shadow-emerald-200 dark:shadow-none' : 'bg-slate-200 dark:bg-slate-800'}`}
                    >
                      <div className={`w-6 h-6 rounded-xl bg-white shadow-lg transition-all duration-500 flex items-center justify-center ${val ? 'translate-x-8' : 'translate-x-0'}`}>
                        {val ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                      </div>
                    </button>
                  ) : (
                    <input
                      type="number"
                      placeholder="0"
                      value={val || ''}
                      onChange={(e) => handleChange(alunos[0]?.id, p.id, e.target.value)}
                      className="w-20 ml-2 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 rounded-xl py-2 px-3 text-center font-black text-slate-700 dark:text-slate-200 outline-none transition-all"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-8 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end border-t border-slate-200 dark:border-slate-800">
        <button 
          onClick={handleSalvar}
          disabled={salvando}
          className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 text-white px-10 py-4 rounded-3xl font-black shadow-xl shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
        >
          {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {salvando ? 'Salvando...' : 'Finalizar Chamada'}
        </button>
      </div>
    </div>
  );
}