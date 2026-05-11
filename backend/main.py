from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from pydantic import BaseModel
from datetime import date
from calendar import monthrange
from typing import Dict, Union, Any



# Importações do nosso projeto
from database import get_session
from models import Aluno, Pergunta, Resposta, Classe
from auth import get_current_user

app = FastAPI(title="Secretaria Flow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://secretaria-flow.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
def manter_acordado():
    """Rota pública para o cronjob bater e manter o servidor do Render acordado."""
    return {"status": "Online e operante!", "projeto": "Secretaria Flow"}


@app.get("/api/me")
def read_users_me(current_user: dict = Depends(get_current_user)):
    return {
        "email": current_user.get("email"),
        "nome": current_user.get("name"),
    }

# --- ROTAS PROTEGIDAS DA APLICAÇÃO ---

@app.get("/api/classes")
def listar_classes(session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Retorna todas as classes cadastradas no banco."""
    classes = session.exec(select(Classe)).all()
    return classes

@app.get("/api/perguntas")
def listar_perguntas(session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Retorna apenas as perguntas ativas."""
    perguntas = session.exec(select(Pergunta).where(Pergunta.ativa == True)).all()
    return perguntas

@app.get("/api/alunos")
def listar_alunos(classe_nome: str, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Retorna os alunos filtrados pelo nome da classe."""
    statement = select(Aluno).join(Classe).where(Classe.nome == classe_nome)
    alunos = session.exec(statement).all()
    return alunos

class ChamadaPayload(BaseModel):
    data: date
    respostas: Dict[str, Any] 

@app.post("/api/chamada")
def salvar_chamada(payload: ChamadaPayload, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Recebe as respostas do Front-end e salva no banco de dados."""
    for key, valor in payload.respostas.items():
        
        # Trava 1: Ignora chaves malformadas (caso o Front mande lixo)
        if "-" not in key or "undefined" in key:
            continue

        try:
            aluno_id_str, pergunta_id_str = key.split('-')
            aluno_id = int(aluno_id_str)
            pergunta_id = int(pergunta_id_str)
        except ValueError:
            continue

        statement = select(Resposta).where(
            Resposta.aluno_id == aluno_id,
            Resposta.pergunta_id == pergunta_id,
            Resposta.data_registro == payload.data
        )
        resposta_db = session.exec(statement).first()

        if not resposta_db:
            resposta_db = Resposta(aluno_id=aluno_id, pergunta_id=pergunta_id, data_registro=payload.data)

        # Trava 2: Conversão segura de tipos
        if isinstance(valor, bool):
            resposta_db.valor_booleano = valor
            resposta_db.valor_numerico = None
        else:
            resposta_db.valor_booleano = None
            # Se vier string vazia ("") ou nulo, salva como Zero
            if valor == "" or valor is None:
                resposta_db.valor_numerico = 0
            else:
                try:
                    resposta_db.valor_numerico = int(valor)
                except ValueError:
                    resposta_db.valor_numerico = 0

        session.add(resposta_db)

    session.commit()
    return {"message": "Chamada salva com sucesso!"}

@app.get("/api/relatorios/trimestre")
def relatorio_trimestral(session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Gera um relatório dinâmico calculando todas as métricas ativas do trimestre atual."""
    hoje = date.today()
    
    # 1. Matemática do Trimestre: Descobre as datas de início e fim
    trimestre = (hoje.month - 1) // 3 + 1
    mes_inicio = (trimestre - 1) * 3 + 1
    mes_fim = mes_inicio + 2
    data_inicio = date(hoje.year, mes_inicio, 1)
    ultimo_dia = monthrange(hoje.year, mes_fim)[1]
    data_fim = date(hoje.year, mes_fim, ultimo_dia)

    # 2. Busca o que precisamos no banco
    perguntas = session.exec(select(Pergunta).where(Pergunta.ativa == True)).all()
    classes = session.exec(select(Classe)).all()

    # 3. Estrutura dinâmica (que vai crescer se novas perguntas forem criadas)
    relatorio = {
        "trimestre": f"{trimestre}º Trimestre",
        "ano": hoje.year,
        "kpis_globais": { "booleanos": {}, "numericos": {} },
        "classes": []
    }

    # Inicializa os contadores globais baseados nas perguntas que existem HOJE
    for p in perguntas:
        if p.tipo == 'booleano':
            relatorio["kpis_globais"]["booleanos"][p.texto] = {"sim": 0, "total": 0}
        else:
            relatorio["kpis_globais"]["numericos"][p.texto] = 0

    # 4. Varre classe por classe, aluno por aluno, somando as respostas
    for c in classes:
        alunos_da_classe = session.exec(select(Aluno).where(Aluno.classe_id == c.id)).all()
        aluno_ids = [a.id for a in alunos_da_classe]

        # Pula classes que não tem alunos para não poluir o relatório
        if not aluno_ids:
            continue

        classe_data = {
            "id": c.id,
            "nome": c.nome,
            "booleanos": {},
            "numericos": {}
        }

        for p in perguntas:
            # Busca todas as respostas daquela classe, para aquela métrica, dentro do trimestre
            statement = select(Resposta).where(
                Resposta.pergunta_id == p.id,
                Resposta.aluno_id.in_(aluno_ids),
                Resposta.data_registro >= data_inicio,
                Resposta.data_registro <= data_fim
            )
            respostas = session.exec(statement).all()

            if p.tipo == 'booleano':
                # Conta quantos marcaram 'True' e quantas respostas existem no total
                sim = sum(1 for r in respostas if r.valor_booleano is True)
                total = len(respostas) 
                
                classe_data["booleanos"][p.texto] = {"sim": sim, "total": total}

                # Alimenta o KPI Global (Topo da tela)
                relatorio["kpis_globais"]["booleanos"][p.texto]["sim"] += sim
                relatorio["kpis_globais"]["booleanos"][p.texto]["total"] += total

            elif p.tipo == 'numero':
                # Soma as quantidades (Ex: Visitas)
                total_soma = sum(r.valor_numerico for r in respostas if r.valor_numerico)
                classe_data["numericos"][p.texto] = total_soma

                # Alimenta o KPI Global (Topo da tela)
                relatorio["kpis_globais"]["numericos"][p.texto] += total_soma

        relatorio["classes"].append(classe_data)

    return relatorio
# --- FIM ROTAS PROTEGIDAS DA APLICAÇÃO ---


# --- ROTAS DE GERENCIAMENTO DE PERGUNTAS ---
@app.get("/api/admin/perguntas")
def listar_todas_perguntas(session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Lista todas as perguntas para o gerenciador (ativas e inativas)."""
    return session.exec(select(Pergunta)).all()

@app.post("/api/perguntas")
def criar_pergunta(pergunta: Pergunta, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Cria uma nova métrica no banco."""
    session.add(pergunta)
    session.commit()
    session.refresh(pergunta)
    return pergunta

@app.patch("/api/perguntas/{pergunta_id}/toggle")
def toggle_pergunta(pergunta_id: int, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Ativa ou desativa uma pergunta (Soft Delete)."""
    pergunta = session.get(Pergunta, pergunta_id)
    if not pergunta:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada")
    
    pergunta.ativa = not pergunta.ativa
    session.add(pergunta)
    session.commit()
    return {"message": "Status atualizado", "ativa": pergunta.ativa}
# --- FIM ROTAS DE GERENCIAMENTO DE PERGUNTAS ---


# --- ROTAS DE GERENCIAMENTO DE ALUNOS E CLASSES ---
@app.get("/api/classes")
def listar_classes(session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Retorna todas as classes para popular os selects."""
    return session.exec(select(Classe)).all()

@app.get("/api/admin/alunos")
def listar_todos_alunos(session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Lista todos os alunos de todas as classes para o painel de gestão."""
    return session.exec(select(Aluno)).all()

@app.post("/api/alunos")
def criar_aluno(aluno: Aluno, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Adiciona um novo aluno."""
    session.add(aluno)
    session.commit()
    session.refresh(aluno)
    return aluno

@app.put("/api/alunos/{aluno_id}")
def atualizar_aluno(aluno_id: int, dados_atualizados: Aluno, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Edita os dados de um aluno (Nome ou Classe)."""
    aluno_db = session.get(Aluno, aluno_id)
    if not aluno_db:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    aluno_db.nome = dados_atualizados.nome
    aluno_db.classe_id = dados_atualizados.classe_id
    
    session.add(aluno_db)
    session.commit()
    session.refresh(aluno_db)
    return aluno_db

@app.delete("/api/alunos/{aluno_id}")
def deletar_aluno(aluno_id: int, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Remove um aluno permanentemente."""
    aluno_db = session.get(Aluno, aluno_id)
    if not aluno_db:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    session.delete(aluno_db)
    session.commit()
    return {"message": "Aluno removido com sucesso"}
# --- FIM ROTAS DE GERENCIAMENTO DE ALUNOS E CLASSES ---


# --- ROTAS DE CRUD DE CLASSES ---
@app.post("/api/classes")
def criar_classe(classe: Classe, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Cria uma nova classe."""
    session.add(classe)
    session.commit()
    session.refresh(classe)
    return classe

@app.put("/api/classes/{classe_id}")
def atualizar_classe(classe_id: int, dados: Classe, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Edita uma classe (Nome, Professor, Associado)."""
    classe_db = session.get(Classe, classe_id)
    if not classe_db:
        raise HTTPException(status_code=404, detail="Classe não encontrada")
    
    classe_db.nome = dados.nome
    classe_db.professor = dados.professor
    classe_db.associado = dados.associado
    
    session.add(classe_db)
    session.commit()
    session.refresh(classe_db)
    return classe_db

@app.delete("/api/classes/{classe_id}")
def deletar_classe(classe_id: int, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Deleta uma classe."""
    classe_db = session.get(Classe, classe_id)
    if not classe_db:
        raise HTTPException(status_code=404, detail="Classe não encontrada")
    
    session.delete(classe_db)
    session.commit()
    return {"message": "Classe deletada"}
# --- FIM ROTAS DE CRUD DE CLASSES ---

# --- ROTAS DE EDIÇÃO E EXCLUSÃO DE MÉTRICAS (PERGUNTAS) ---

@app.put("/api/perguntas/{pergunta_id}")
def atualizar_pergunta(pergunta_id: int, dados: Pergunta, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Atualiza o texto, tipo ou escopo de uma métrica."""
    pergunta_db = session.get(Pergunta, pergunta_id)
    if not pergunta_db:
        raise HTTPException(status_code=404, detail="Métrica não encontrada")
    
    pergunta_db.texto = dados.texto
    pergunta_db.tipo = dados.tipo
    pergunta_db.escopo = dados.escopo
    
    session.add(pergunta_db)
    session.commit()
    session.refresh(pergunta_db)
    return pergunta_db

@app.delete("/api/perguntas/{pergunta_id}")
def deletar_pergunta(pergunta_id: int, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Deleta uma métrica e todas as respostas atreladas a ela."""
    pergunta_db = session.get(Pergunta, pergunta_id)
    if not pergunta_db:
        raise HTTPException(status_code=404, detail="Métrica não encontrada")
    
    # IMPORTANTE: Limpar respostas antigas ligadas a esta métrica para não dar erro de banco de dados
    from models import Resposta
    from sqlmodel import select
    respostas_vinculadas = session.exec(select(Resposta).where(Resposta.pergunta_id == pergunta_id)).all()
    for r in respostas_vinculadas:
        session.delete(r)
        
    session.delete(pergunta_db)
    session.commit()
    return {"message": "Métrica e registros atrelados removidos com sucesso."}

# --- ROTA PARA ENCERRAR O TRIMESTRE ---
@app.delete("/api/relatorios/resetar")
def resetar_trimestre(session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    """Apaga TODOS os registros de Respostas para iniciar um novo trimestre, mantendo alunos e classes."""
    
    try:
        from models import Resposta  # Importação com o nome correto do seu model!
        
        # Busca todas as respostas cadastradas no banco
        respostas_antigas = session.exec(select(Resposta)).all()
        
        # Apaga uma por uma
        for r in respostas_antigas:
            session.delete(r)
            
        # Salva o banco limpo
        session.commit()
        return {"message": "Trimestre encerrado e métricas zeradas com sucesso!"}
    
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao zerar trimestre: {str(e)}")
    """Apaga TODOS os registros de chamadas para iniciar um novo trimestre, mantendo alunos e classes."""
    
    try:
        # ATENÇÃO: Substitua "Chamada" pelo nome exato do seu modelo de banco de dados
        # que guarda os registros diários (ex: Chamada, Resposta, RegistroPresenca).
        # Vamos assumir que o modelo se chame `Chamada`.
        from models import Chamada 
        
        chamadas_antigas = session.exec(select(Chamada)).all()
        for c in chamadas_antigas:
            session.delete(c)
            
        session.commit()
        return {"message": "Trimestre encerrado e métricas zeradas com sucesso!"}
    
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao zerar trimestre: {str(e)}")
# --- FIM ROTA PARA ENCERRAR O TRIMESTRE ---






























