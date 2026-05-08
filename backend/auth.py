import os
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.oauth2 import id_token
from google.auth.transport import requests
from dotenv import load_dotenv

load_dotenv()

security = HTTPBearer()
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID") 
EMAILS_AUTORIZADOS = ["tecproduz@gmail.com", "emilyn2211@gmail.com"]

def get_current_user(auth: HTTPAuthorizationCredentials = Depends(security)):
    token = auth.credentials
    
    # 1. Valida o token com o Google
    try:
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 2. Verifica se o e-mail está na Lista VIP
    email_logado = idinfo.get("email")
    if email_logado not in EMAILS_AUTORIZADOS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. E-mail não autorizado pela Secretaria.",
        )
        
    # 3. Retorna os dados com sucesso (esta linha resolve o erro 500!)
    return idinfo