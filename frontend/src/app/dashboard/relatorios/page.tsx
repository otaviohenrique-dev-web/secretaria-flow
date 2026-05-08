'use client';
import { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import ThemeToggle from '@/components/ThemeToggle';
import { LayoutDashboard, Users, BookOpen, TrendingUp, ChevronLeft, CalendarDays, Hash, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    const fetchRelatorio = async () => {
      const token = Cookies.get('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      try {
        const res = await fetch(`${apiUrl}/api/relatorios/trimestre`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
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

      <main className="grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full z-10">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors mb-4">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar para Chamada
            </Link>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Resumo do Trimestre
            </h1>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
              <CalendarDays className="w-4 h-4" />
              <span>{dados.trimestre} de {dados.ano}</span>
            </div>
          </div>
        </div>

        {/* KPIs GLOBAIS DINÂMICOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* Métricas Numéricas (Ex: Visitas) */}
          {Object.entries(dados.kpis_globais.numericos).map(([label, valor]) => (
            <div key={label} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-4xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400">
                  <Hash className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">{label}</h3>
              <p className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">{valor}</p>
            </div>
          ))}

          {/* Métricas Booleanas (Ex: Lição) */}
          {Object.entries(dados.kpis_globais.booleanos).map(([label, info]) => (
            <div key={label} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-4xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl text-emerald-600 dark:text-emerald-400">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">{label} (Média)</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">{calcPct(info.sim, info.total)}</p>
                <span className="text-2xl font-bold text-slate-400">%</span>
              </div>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-2 bg-emerald-50 dark:bg-emerald-900/20 inline-block px-3 py-1 rounded-lg">
                {info.sim} de {info.total} registros
              </p>
            </div>
          ))}
        </div>

        {/* DESEMPENHO POR CLASSE DINÂMICO */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden p-8">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-8">Performance por Unidade</h2>
          
          <div className="space-y-12">
            {dados.classes.map((cls) => (
              <div key={cls.id} className="border-b border-slate-100 dark:border-slate-800/50 pb-12 last:border-0 last:pb-0">
                <div className="flex justify-between items-end mb-6">
                  <h4 className="text-xl font-black text-slate-800 dark:text-slate-200">{cls.nome}</h4>
                  
                  {/* Números rápidos das métricas numéricas da classe */}
                  <div className="flex gap-3">
                    {Object.entries(cls.numericos).map(([label, valor]) => (
                      <span key={label} className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {label}: <span className="text-blue-600 dark:text-blue-400 ml-1">{valor}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {Object.entries(cls.booleanos).map(([label, info]) => {
                    const pct = calcPct(info.sim, info.total);
                    return (
                      <div key={label}>
                        <div className="flex justify-between items-center text-sm font-bold mb-3">
                          <span className="text-slate-500 dark:text-slate-400">{label}</span>
                          <div className="text-slate-800 dark:text-slate-100 font-black">
                            {info.sim} / {info.total}
                            <span className="text-indigo-500 ml-2 font-semibold">({pct}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden shadow-inner">
                          <div 
                            className="bg-linear-to-r from-blue-500 via-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out shadow-lg" 
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}