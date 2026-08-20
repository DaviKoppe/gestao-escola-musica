from datetime import date
from .models import Aluno, Mensalidade 

def gerar_mensalidades():
    hoje = date.today()
    mes_ref = hoje.strftime("%Y-%m")

    alunos = Aluno.objects.filter(ativo=True)

    for aluno in alunos:
        existe = Mensalidade.objects.filter(
            aluno=aluno,
            mes_referencia=mes_ref
        ).exists()

    if not existe:
        data_vencimento = date(hoje.year, hoje.month, aluno.dia_vencimento)

        Mensalidade.objects.create(
            aluno=aluno,
            valor=aluno.valor_mensalidade,
            desconto=0,
            data_vencimento=data_vencimento,
            mes_referencia=mes_ref,
            status='pendente'
        )