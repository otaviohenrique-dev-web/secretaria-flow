import GoogleLoginButton from '@/components/auth/GoogleLoginButton';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="bg-white/80 backdrop-blur-md p-10 rounded-3xl shadow-xl border border-slate-200/60 max-w-md w-full text-center transform transition-all hover:-translate-y-1 hover:shadow-2xl">
        
        {/* Logo ou Ícone (Opcional) */}
        <div className="w-16 h-16 bg-linear-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-slate-800 to-slate-600 mb-2 tracking-tight">
          Secretaria Flow
        </h1>
        
        <p className="text-slate-500 mb-10 font-medium">
          Gestão inteligente e rápida para a Escola Sabatina.
        </p>
        
        {/* O nosso Botão de Login com toda a regra de segurança */}
        <div className="flex justify-center mb-6">
          <GoogleLoginButton />
        </div>
        
        <p className="text-xs text-slate-400 font-medium bg-slate-50 inline-block px-3 py-1 rounded-full border border-slate-100">
          🔒 Acesso restrito à equipe autorizada
        </p>

      </div>
    </main>
  );
}