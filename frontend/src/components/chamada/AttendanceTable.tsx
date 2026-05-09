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
          setPerguntas(await resPerguntas.json());
          setAlunos(await resAlunos.json());
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data: dataSelecionada, respostas: respostas })
      });

      if (res.ok) alert('✨ Chamada salva com sucesso!');
      else alert(`❌ Erro ao salvar: ${(await res.json()).detail || 'Falha no servidor'}`);
    } catch (error) {
      alert('❌ Erro de conexão ao tentar salvar.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-xl h-64">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse text-sm sm:text-base">Carregando diário de classe...</p>
      </div>
    );
  }

  if (alunos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-xl text-center">
        <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Nenhum aluno encontrado</h3>
        <p className="text-slate-500 text-sm sm:text-base mt-2">Esta classe ainda não possui alunos cadastrados no sistema.</p>
      </div>
    );
  }

  const perguntasAluno = perguntas.filter(p => p.escopo === 'individual');
  const perguntasClasse = perguntas.filter(p => p.escopo === 'global');

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden flex flex-col">
      
      {/* Container da Tabela com Scroll Suave */}
      <div className="overflow-x-auto w-full pb-4 scrollbar-thin scrollbar-thumb-indigo-200 dark:scrollbar-thumb-indigo-800">
        <table className="w-full text-left border-separate border-spacing-0 min-w-max">
          <thead>
            <tr>
              <th className="px-4 sm:px-8 py-4 sm:py-6 bg-slate-50/90 dark:bg-slate-800/90 text-slate-400 dark:text-slate-500 text-[10px] sm:text-xs uppercase font-black tracking-widest sticky left-0 z-20 backdrop-blur-md shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Aluno</th>
              {perguntasAluno.map(p => (
                <th key={p.id} className="px-4 sm:px-8 py-4 sm:py-6 bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-center min-w-[100px] sm:min-w-[120px]">
                  <div className="flex flex-col items-center gap-2">
                    <span className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 text-indigo-500">
                      {getIconForPergunta(p.texto, p.tipo)}
                    </span>
                    <span className="truncate w-full">{p.texto}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {alunos.map((aluno) => (
              <tr key={aluno.id} className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                
                {/* Coluna do Nome (Fixa na Esquerda) */}
                <td className="px-4 sm:px-8 py-3 sm:py-5 sticky left-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10 border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_10px_-4px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-inner ${getAvatarColor(aluno.nome)}`}>
                      {aluno.nome.charAt(0)}
                    </div>
                    <span className="font-bold text-sm sm:text-base text-slate-700 dark:text-slate-200 tracking-tight whitespace-nowrap max-w-[120px] sm:max-w-[200px] truncate">
                      {aluno.nome}
                    </span>
                  </div>
                </td>
                
                {/* Células de Resposta */}
                {perguntasAluno.map(p => {
                  const val = respostas[`${aluno.id}-${p.id}`];
                  return (
                    <td key={p.id} className="px-4 sm:px-8 py-3 sm:py-5 text-center">
                      {p.tipo === 'booleano' ? (
                        <button
                          onClick={() => handleChange(aluno.id, p.id, !val)}
                          className={`w-12 h-6 sm:w-16 sm:h-8 rounded-full relative transition-all duration-300 flex items-center px-1 mx-auto ${val ? 'bg-emerald-500 shadow-sm' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                          <div className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${val ? 'translate-x-6 sm:translate-x-8' : 'translate-x-0'}`}>
                            {val ? <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" /> : <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400" />}
                          </div>
                        </button>
                      ) : (
                        <input
                          type="number"
                          placeholder="0"
                          value={val || ''}
                          onChange={(e) => handleChange(aluno.id, p.id, e.target.value)}
                          className="w-16 sm:w-20 mx-auto bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl py-1.5 sm:py-2 px-2 text-center text-sm sm:text-base font-black outline-none transition-all"
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

      {/* ÁREA DE MÉTRICAS GLOBAIS DA CLASSE (Ajustada para Mobile) */}
      {perguntasClasse.length > 0 && (
        <div className="px-4 sm:px-8 py-6 bg-indigo-50/50 dark:bg-indigo-900/20 border-t border-slate-200 dark:border-slate-800">
          <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-4 text-center sm:text-left">
            Métricas Globais da Unidade
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {perguntasClasse.map(p => {
              const globalKey = `${alunos[0]?.id}-${p.id}`;
              const val = respostas[globalKey];

              return (
                <div key={p.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                      {getIconForPergunta(p.texto, p.tipo)}
                    </div>
                    <span className="font-bold text-sm sm:text-base text-slate-700 dark:text-slate-200">{p.texto}</span>
                  </div>
                  
                  {p.tipo === 'booleano' ? (
                    <button
                      onClick={() => handleChange(alunos[0]?.id, p.id, !val)}
                      className={`w-12 h-6 sm:w-14 sm:h-7 rounded-full relative transition-all duration-300 flex items-center px-1 ${val ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${val ? 'translate-x-6 sm:translate-x-7' : 'translate-x-0'}`}>
                        {val ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <X className="w-2.5 h-2.5 text-slate-400" />}
                      </div>
                    </button>
                  ) : (
                    <input
                      type="number"
                      placeholder="0"
                      value={val || ''}
                      onChange={(e) => handleChange(alunos[0]?.id, p.id, e.target.value)}
                      className="w-16 sm:w-20 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 rounded-xl py-1.5 sm:py-2 px-2 text-center text-sm sm:text-base font-black outline-none transition-all"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FOOTER DA TABELA */}
      <div className="p-4 sm:p-8 bg-slate-50/50 dark:bg-slate-800/30 flex justify-center sm:justify-end border-t border-slate-200 dark:border-slate-800">
        <button 
          onClick={handleSalvar}
          disabled={salvando}
          className="w-full sm:w-auto flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl sm:rounded-3xl font-black shadow-xl shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-70"
        >
          {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {salvando ? 'Salvando...' : 'Finalizar Chamada'}
        </button>
      </div>
    </div>
  );
}