'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function GoogleLoginButton() {
  const router = useRouter();

  const handleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      const token = credentialResponse.credential;
      
      // 1. Salva o token de forma GARANTIDA nos cookies por 1 dia
      Cookies.set('auth_token', token, { expires: 1, path: '/' });

      try {
        // 2. Bate na porta do Back-end para verificar se é VIP
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          console.log('✅ Acesso liberado pelo Backend!');
          router.push('/dashboard');
        } else {
          const errorData = await res.json();
          alert(`❌ Erro: ${errorData.detail || 'Acesso negado'}`);
          Cookies.remove('auth_token'); 
        }
      } catch (error) {
        console.error("Erro de comunicação com o servidor", error);
        alert("Erro ao conectar com o servidor.");
        Cookies.remove('auth_token');
      }
    }
  };

  return (
    <div className="flex w-full justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          console.log('Login falhou no Google');
        }}
        useOneTap={false}
        type="standard"
      />
    </div>
  );
}