'use client';
import { useState, useEffect } from 'react';
import AttendanceTable from '@/components/chamada/AttendanceTable';
import Footer from '@/components/Footer';
import ThemeToggle from '@/components/ThemeToggle';
import { LayoutDashboard, Settings, User, Calendar, Users, ChevronDown, TrendingUp } from 'lucide-react';
import Cookies from 'js-cookie';

export default function Dashboard() {
  const [classes, setClasses] = useState<{ id: number; nome: string }[]>([]);
  const [classeAtiva, setClasseAtiva] = useState('Adultos - Classe 1');
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]); 

  // Busca as classes do Back-end ao carregar a página
  useEffect(() => {
    const fetchClasses = async () => {
      const token = Cookies.get('auth_token');
      console.log("🔍 Passo 1: Lendo o Token do Cookie ->", token ? "Token Encontrado!" : "Ausente :(");

      if (!token) {
        console.warn("⚠️ Busca cancelada: Usuário sem token no cookie.");
        setClasses([{ id: 0, nome: "Erro: Faça login novamente" }]); // Feedback visual na tela
        return;
      }

      // Se a variável de ambiente falhar, ele usa o localhost:8000 por padrão
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      console.log("🌐 Passo 2: URL da API ->", apiUrl);

      try {
        const res = await fetch(`${apiUrl}/api/classes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("📡 Passo 3: Status da Resposta do Back-end ->", res.status);

        if (res.ok) {
          const data = await res.json();
          console.log("✅ Passo 4: Classes recebidas com sucesso ->", data);
          setClasses(data);
          if (data.length > 0) {
            setClasseAtiva(data[0].nome);
          }
        } else {
          const erroText = await res.text();
          console.error("❌ Erro retornado pela API:", erroText);
          setClasses([{ id: 0, nome: "Erro de permissão" }]);
        }
      } catch (error) {
        console.error("💥 Erro fatal ao tentar conectar com o Back-end:", error);
        setClasses([{ id: 0, nome: "Servidor offline" }]);
      }
    };

    fetchClasses();
  }, []);

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

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
              <button className="text-slate-500 dark:text-slate-400 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full z-10">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Gestão de Chamada
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Lance e revise os dados da Escola Sabatina com precisão.
            </p>
          </div>














          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 w-full">
  
  {/* SEÇÃO ESQUERDA: Filtros (Classe e Data) */}
  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
    
    {/* Seletor Dinâmico de Classes */}
    <div className="relative group w-full sm:w-auto">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
        <Users className="w-4 h-4" />
      </div>
      <select 
        value={classeAtiva}
        onChange={(e) => setClasseAtiva(e.target.value)}
        className="w-full sm:w-auto pl-10 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 appearance-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all shadow-sm cursor-pointer"
      >
        {classes.length === 0 ? (
          <option>Carregando classes...</option>
        ) : (
          classes.map((cls) => (
            <option key={cls.id} value={cls.nome}>{cls.nome}</option>
          ))
        )}
      </select>
      <ChevronDown className="absolute inset-y-0 right-3 flex items-center my-auto w-4 h-4 text-slate-400 pointer-events-none" />
    </div>

    {/* Seletor de Data */}
    <div className="relative w-full sm:w-auto">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
        <Calendar className="w-4 h-4" />
      </div>
      <input 
        type="date"
        value={dataSelecionada}
        onChange={(e) => setDataSelecionada(e.target.value)}
        className="w-full sm:w-auto pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all shadow-sm color-scheme-light dark:color-scheme-dark"
      />
    </div>

  </div>

  {/* SEÇÃO DIREITA: Botões de Ação */}
  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
    
    {/* NOVO: Botão de Gestão de Alunos */}
    <a href="/dashboard/alunos" className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-2xl transition-all shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 w-full sm:w-auto">
      <Users className="w-4 h-4" />
      Alunos
    </a>

    {/* Botão para Gerenciar as Perguntas/Métricas */}
    <a href="/dashboard/perguntas" className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 w-full sm:w-auto">
      <Settings className="w-4 h-4" />
      Métricas
    </a>

    {/* Botão para os Relatórios */}
    <a href="/dashboard/relatorios" className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 w-full sm:w-auto">
      <TrendingUp className="w-4 h-4" />
      Relatório
    </a>

  </div>

</div>


















        </div>
        
        {/* Passamos as variáveis de estado para a tabela buscar os dados filtrados */}
        <AttendanceTable classeSelecionada={classeAtiva} dataSelecionada={dataSelecionada} />

      </main>

      <Footer />
    </div>
  );
}