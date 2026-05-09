import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Pega o token direto dos cookies do navegador
  const token = request.cookies.get('auth_token')?.value;

  // 1. Se o usuário tentar acessar qualquer rota do /dashboard sem token, vai pro login
  if (request.nextUrl.pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. Se o usuário já estiver logado (com token) e tentar acessar a tela de login (/), vai pro dashboard
  if (request.nextUrl.pathname === '/' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Se estiver tudo certo, deixa o usuário passar
  return NextResponse.next();
}

// Configuração para dizer ao Next.js em quais rotas esse escudo deve atuar
export const config = {
  matcher: ['/', '/dashboard/:path*'],
};