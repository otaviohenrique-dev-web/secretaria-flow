import os
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env
load_dotenv()

# Pega a URL do banco. O Neon usa postgresql://, o SQLModel lida bem com isso.
DATABASE_URL = os.getenv("DATABASE_URL")

# Engine de conexão com o banco
engine = create_engine(DATABASE_URL, echo=True) # echo=True para vermos os logs no terminal inicialmente

def init_db():
    # Importamos os modelos aqui para garantir que o SQLModel os reconheça antes de criar as tabelas
    from models import Classe, Aluno, Pergunta, Resposta
    
    print("Criando tabelas no banco de dados...")
    SQLModel.metadata.create_all(engine)
    print("Tabelas criadas com sucesso!")

def get_session():
    with Session(engine) as session:
        yield session

# Se rodarmos esse arquivo diretamente, ele cria as tabelas
if __name__ == "__main__":
    init_db()