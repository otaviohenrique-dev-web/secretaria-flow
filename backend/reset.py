from sqlmodel import SQLModel
from database import engine
# Importamos os modelos para o SQLModel saber o que apagar e criar
from models import Classe, Aluno, Pergunta, Resposta

def resetar_banco():
    print("🗑️ Apagando tabelas com estrutura antiga...")
    SQLModel.metadata.drop_all(engine)
    
    print("🏗️ Recriando tabelas com a nova estrutura Premium...")
    SQLModel.metadata.create_all(engine)
    
    print("✨ Banco de dados zerado e atualizado com sucesso!")

if __name__ == "__main__":
    resetar_banco()