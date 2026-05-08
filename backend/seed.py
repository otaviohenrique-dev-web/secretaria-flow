from sqlmodel import Session, select
from database import engine
from models import Classe, Aluno, Pergunta

def seed_data():
    with Session(engine) as session:
        # Verifica se já existem classes para não duplicar se rodar sem querer 2x
        classe_existente = session.exec(select(Classe)).first()
        if classe_existente:
            print("⚠️ O banco já possui dados. Para rodar o seed novamente, limpe as tabelas antes.")
            return

        print("🌱 Iniciando o plantio de dados (Seed) no NeonDB...")

        # 1. Criando as Classes (Refletindo a realidade de múltiplas classes)
        c_adultos_1 = Classe(nome="Adultos - Classe 1")
        c_adultos_2 = Classe(nome="Adultos - Classe 2")
        c_jovens = Classe(nome="Jovens - Classe Base")
        c_adolescentes = Classe(nome="Adolescentes")

        session.add_all([c_adultos_1, c_adultos_2, c_jovens, c_adolescentes])
        session.commit() # Commitamos aqui para que as classes ganhem um 'id' no banco

        # 2. Criando Alunos e vinculando às classes (usando os IDs gerados)
        alunos = [
            Aluno(nome="Otávio Henrique", classe_id=c_adultos_1.id),
            Aluno(nome="João Silva", classe_id=c_adultos_1.id),
            Aluno(nome="Emilyn Oliveira", classe_id=c_adultos_2.id),
            Aluno(nome="Carlos Eduardo", classe_id=c_jovens.id),
            Aluno(nome="Ana Beatriz", classe_id=c_adolescentes.id),
        ]
        session.add_all(alunos)

        # 3. Criando as Perguntas (Métricas da Escola Sabatina)
        perguntas = [
            Pergunta(texto="Lição Estudada", tipo="booleano", escopo="individual"),
            Pergunta(texto="Visitas", tipo="numero", escopo="global"),
            Pergunta(texto="Pequeno Grupo", tipo="booleano", escopo="individual"),
        ]
        session.add_all(perguntas)

        # Salva tudo no banco
        session.commit()
        print("✅ Banco de dados populado com sucesso! Classes, Alunos e Perguntas criados.")

if __name__ == "__main__":
    seed_data()