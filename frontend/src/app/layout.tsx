import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { GoogleOAuthProvider } from '@react-oauth/google';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Secretaria Flow | Gestão Inteligente",
  description: "Plataforma premium para gestão de chamadas, métricas dinâmicas e relatórios da Escola Sabatina.",
  applicationName: "Secretaria Flow",
  themeColor: "#4f46e5", 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}