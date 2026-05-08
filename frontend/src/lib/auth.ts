import Cookies from 'js-cookie';

const TOKEN_KEY = 'secretaria_flow_token';

export const setToken = (token: string) => {
  // Salva o cookie com validade de 7 dias e regras de segurança básicas
  Cookies.set(TOKEN_KEY, token, { expires: 7, secure: true, sameSite: 'strict' });
};

export const getToken = () => {
  return Cookies.get(TOKEN_KEY);
};

export const removeToken = () => {
  Cookies.remove(TOKEN_KEY);
};