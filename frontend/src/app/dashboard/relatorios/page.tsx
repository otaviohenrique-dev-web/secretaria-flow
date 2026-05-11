'use client';
import { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import ThemeToggle from '@/components/ThemeToggle';
import { LayoutDashboard, BookOpen, TrendingUp, ChevronLeft, CalendarDays, Hash, Loader2, AlertTriangle, Users, Check, Save, X } from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';

// Tipagem para bater com o nosso novo Back-end dinâmico
interface RelatorioDados {
  trimestre: string;
  ano: number;
  kpis_globais: {
    booleanos: Record<string, { sim: number; total: number }>;
    numericos: Record<string, number>;
  };
  classes: Array<{
    id: number;
    nome: string;
    booleanos: Record<string, { sim: number; total: number }>;
    numericos: Record<string, number>;
  }>;
}

export default function RelatorioTrimestral() {
  const [dados, setDados] = useState<RelatorioDados | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para a Auditoria
  const [auditoria, setAuditoria] = useState<any[]>([]);
  const [exibirAuditoria, setExibirAuditoria] = useState(false);
  const [processandoAuditoria, setProcessandoAuditoria] = useState(false);

  useEffect(() => {
    const fetchRelatorio = async () => {
      const token = Cookies.get('auth_token');
      if (!token) {
        window.location.href = "/";
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      try {
        const res = await fetch(`${apiUrl}/api/relatorios/trimestre`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          Cookies.remove('auth_token');
          window.location.href = "/";
          return;
        }

        if (res.ok) {
          const json = await res.json();
          setDados(json);
        }
      } catch (error) {
        console.error("Erro ao carregar relatório:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatorio();
  }, []);

  const calcPct = (sim: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((sim / total) * 100);
  };

  const handleZerarTrimestre = async () => {
    const confirmacao = window.prompt(
      "⚠️ ATENÇÃO: Você está prestes a ENCERRAR O TRIMESTRE.\n\nIsso apagará todas as métricas, presenças e registros deste trimestre. Classes e Alunos serão mantidos.\n\nPara confirmar, digite a palavra: ZERAR"
    );

    if (confirmacao !== "ZERAR") {
      alert("Operação cancelada.");
      return;
    }

    setLoading(true);
    const token = Cookies.get('auth_token');
    if (!token) {
      window.location.href = "/";
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const res = await fetch(`${apiUrl}/api/relatorios/resetar`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        alert("✨ Trimestre encerrado! O sistema está limpo para o próximo ciclo.");
        window.location.reload(); 
      } else {
        alert("❌ Erro ao zerar o trimestre no servidor.");
        setLoading(false);
      }
    } catch (error) {
      alert("❌ Erro de conexão.");
      setLoading(false);
    }
  };

  // Funções de Auditoria
  const buscarAuditoria = async () => {
    const token = Cookies.get('auth_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${apiUrl}/api/relatorios/auditoria`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAuditoria(await res.json());
      setExibirAuditoria(true);
    } catch (error) { console.error(error); }
  };

  const executarCorrecao = async () => {
    if (!window.confirm("Isso registrará a 'Falta' para todos os alunos nas datas listadas. Deseja confirmar?")) return;
    
    setProcessandoAuditoria(true);
    const token = Cookies.get('auth_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const payload = auditoria.map(a => ({ aluno_id: a.aluno_id, datas: a.datas_faltantes }));

    try {
      const res = await fetch(`${apiUrl}/api/relatorios/corrigir-faltas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("✨ Auditoria finalizada! O relatório agora está 100% preciso.");
        window.location.reload();
      }
    } catch (error) { alert("Erro ao processar."); }
    finally { setProcessandoAuditoria(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Processando métricas...</p>
      </div>
    );
  }

  if (!dados) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 flex flex-col relative overflow-hidden">
      
      {/* Background Animado */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] animate-pulse [animation-delay:2s]" />
      </div>

      <nav className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <LayoutDashboard className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">
                Secretaria<span className="text-indigo-600">Flow</span>
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full z-10">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors mb-3 sm:mb-4">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar para Chamada
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Resumo do Trimestre
            </h1>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base">
              <CalendarDays className="w-4 h-4" />
              <span>{dados.trimestre} de {dados.ano}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button 
              onClick={buscarAuditoria}
              className="flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-bold text-sm px-6 py-3 rounded-2xl transition-all border border-amber-200 dark:border-amber-800 grow md:grow-0"
            >
              <Check className="w-4 h-4" /> <span className="hidden sm:inline">Auditoria de Presença</span><span className="sm:hidden">Auditoria</span>
            </button>
            
            <button 
              onClick={handleZerarTrimestre}
              className="flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-sm px-6 py-3 rounded-2xl transition-all border border-rose-200 dark:border-rose-500/30 grow md:grow-0"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Encerrar Trimestre</span>
              <span className="sm:hidden">Zerar Relatórios</span>
            </button>
          </div>
        </div>

        {/* MODAL / SEÇÃO DE AUDITORIA DETALHADA */}
        {exibirAuditoria && (
          <div className="mb-10 bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-800/50 rounded-[2.5rem] p-6 sm:p-8 animate-in fade-in zoom-in duration-300 shadow-lg">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-400">Auditoria: Registros Pendentes</h3>
                <p className="text-amber-700/70 dark:text-amber-500 text-sm font-medium mt-1">Os alunos abaixo não possuem registro de falta ou presença nas seguintes datas de chamada:</p>
              </div>
              <button onClick={() => setExibirAuditoria(false)} className="text-amber-800 dark:text-amber-500 bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>

            {auditoria.length === 0 ? (
              <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl py-8">
                 <p className="font-bold text-emerald-600 dark:text-emerald-400">✅ Tudo em ordem!</p>
                 <p className="text-sm text-emerald-600/80 dark:text-emerald-500 mt-1">Nenhum "buraco" no sistema. Todos os alunos possuem registros em todas as datas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {auditoria.map(a => (
                    <div key={a.aluno_id} className="flex flex-col bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-amber-100 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{a.nome}</span>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-800">
                          {a.datas_faltantes.length} faltas pendentes
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {a.datas_faltantes.map((data: string) => (
                          <span key={data} className="flex items-center gap-1 text-xs font-bold bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 px-2.5 py-1.5 rounded-md border border-amber-200 dark:border-amber-800/50">
                            <CalendarDays className="w-3 h-3" />
                            {data.split('-').reverse().join('/')}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={executarCorrecao}
                  disabled={processandoAuditoria}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 mt-4 transition-colors disabled:opacity-50"
                >
                  {processandoAuditoria ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                  Confirmar Correção: Registrar Falta para os pendentes acima
                </button>
              </div>
            )}
          </div>
        )}

        {/* KPIs GLOBAIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12">
          {Object.entries(dados.kpis_globais.numericos).map(([label, valor]) => (
            <div key={label} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400">
                  <Hash className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">{label}</h3>
              <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{valor}</p>
            </div>
          ))}
          
          {Object.entries(dados.kpis_globais.booleanos).map(([label, info]) => {
              if(label.toLowerCase().includes('falta') || label.toLowerCase().includes('faltou')) return null;

              return (
              <div key={label} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 transition-all hover:-translate-y-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">{label} (Média)</h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{calcPct(info.sim, info.total)}</p>
                  <span className="text-2xl font-bold text-slate-400">%</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* DESEMPENHO POR CLASSE DINÂMICO */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden p-5 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-6 sm:mb-8">Performance por Unidade</h2>
          
          <div className="space-y-8 sm:space-y-12">
            {dados.classes.map((cls) => {
              
              const presencaKey = Object.keys(cls.booleanos).find(k => k.toLowerCase().includes('presente') || k.toLowerCase().includes('presença'));
              const faltaKey = Object.keys(cls.booleanos).find(k => k.toLowerCase().includes('falta') || k.toLowerCase().includes('faltou'));

              const outrasBooleanas = Object.entries(cls.booleanos).filter(([k]) => k !== presencaKey && k !== faltaKey);

              const presentes = presencaKey ? cls.booleanos[presencaKey].sim : 0;
              const totalChamadas = presencaKey ? cls.booleanos[presencaKey].total : 0;
              const faltas = faltaKey ? cls.booleanos[faltaKey].sim : (totalChamadas > 0 ? totalChamadas - presentes : 0);
              const taxaPresenca = totalChamadas > 0 ? calcPct(presentes, totalChamadas) : 0;

              return (
                <div key={cls.id} className="border-b border-slate-100 dark:border-slate-800/50 pb-8 sm:pb-12 last:border-0 last:pb-0">
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 sm:gap-0 mb-5 sm:mb-6">
                    <h4 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-200">{cls.nome}</h4>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {Object.entries(cls.numericos).map(([label, valor]) => (
                        <span key={label} className="text-[10px] sm:text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {label}: <span className="text-blue-600 dark:text-blue-400 ml-1">{valor}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {presencaKey && (
                    <div className="mb-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <Users className="w-5 h-5" />
                          </div>
                          <h5 className="font-black text-slate-800 dark:text-slate-200 text-sm sm:text-base uppercase tracking-widest">
                            Taxa de Frequência
                          </h5>
                        </div>
                        <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                          {taxaPresenca}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-rose-100 dark:bg-rose-950/30 rounded-full h-4 sm:h-5 overflow-hidden flex shadow-inner mb-3">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-1000 ease-out" 
                          style={{ width: `${taxaPresenca}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs sm:text-sm font-bold px-1">
                        <span className="text-emerald-600 dark:text-emerald-400">✅ {presentes} Presentes</span>
                        <span className="text-rose-500 dark:text-rose-400">❌ {faltas} Faltas</span>
                      </div>
                    </div>
                  )}

                  {outrasBooleanas.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6 sm:gap-y-8">
                      {outrasBooleanas.map(([label, info]) => {
                        const pct = calcPct(info.sim, info.total);
                        return (
                          <div key={label}>
                            <div className="flex justify-between items-center text-xs sm:text-sm font-bold mb-2 sm:mb-3">
                              <span className="text-slate-500 dark:text-slate-400">{label}</span>
                              <div className="text-slate-800 dark:text-slate-100 font-black">
                                {info.sim} <span className="text-slate-400 font-medium">/ {info.total}</span>
                                <span className="text-indigo-500 ml-1 sm:ml-2 font-semibold">({pct}%)</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 sm:h-3.5 overflow-hidden shadow-inner">
                              <div 
                                className="bg-linear-to-r from-blue-500 via-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out shadow-lg" 
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}