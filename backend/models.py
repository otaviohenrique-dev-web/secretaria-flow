from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import date

# --- TABELAS ---

class Classe(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str = Field(unique=True)
    professor: str = Field(default="") # NOVO
    associado: str = Field(default="") # NOVO
    
    alunos: List["Aluno"] = Relationship(back_populates="classe")

class Aluno(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    # FK obrigatória: garante que um aluno não exista sem uma classe
    classe_id: int = Field(foreign_key="classe.id")
    
    classe: Optional[Classe] = Relationship(back_populates="alunos")
    # Relacionamento bidirecional com Resposta
    respostas: List["Resposta"] = Relationship(back_populates="aluno")

class Pergunta(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    texto: str 
    tipo: str  
    escopo: str = Field(default="individual") # NOVO CAMPO: "individual" ou "global"
    ativa: bool = Field(default=True) 
    
    respostas: List["Resposta"] = Relationship(back_populates="pergunta")

class Resposta(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    # FKs obrigatórias: integridade garantida (resposta exige aluno e pergunta)
    aluno_id: int = Field(foreign_key="aluno.id")
    pergunta_id: int = Field(foreign_key="pergunta.id")
    data_registro: date 
    
    # Colunas específicas para armazenar diferentes tipos de dados de forma eficiente
    valor_booleano: Optional[bool] = Field(default=None)
    valor_numerico: Optional[int] = Field(default=None)
    
    # Relacionamentos bidirecionais
    aluno: Optional[Aluno] = Relationship(back_populates="respostas")
    pergunta: Optional[Pergunta] = Relationship(back_populates="respostas")