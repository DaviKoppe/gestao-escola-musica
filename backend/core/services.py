from datetime import date
from .models import Aluno, Mensalidade
from django.db import models 

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


def gerar_aulas_recorrentes(mes_referencia):
    """Gera as ocorrências semanais de um mês, sem duplicar aulas."""
    import calendar
    from datetime import datetime
    from django.db import transaction
    from rest_framework.exceptions import ValidationError
    from .models import Aula, RecorrenciaAula
    from .serializers import AulaSerializer

    try:
        if not isinstance(mes_referencia, str):
            raise ValueError
        ano, mes = map(int, mes_referencia.split('-'))
        if len(mes_referencia) != 7 or not 1 <= mes <= 12:
            raise ValueError
        ultimo_dia = calendar.monthrange(ano, mes)[1]
        primeiro_dia = date(ano, mes, 1)
        ultimo_dia_mes = date(ano, mes, ultimo_dia)
    except (ValueError, TypeError, AttributeError):
        raise ValidationError({'mes': 'Informe o mês no formato AAAA-MM.'})

    criadas = []
    existentes = 0

    with transaction.atomic():
        recorrencias = RecorrenciaAula.objects.filter(
            ativo=True,
            data_inicio__lte=ultimo_dia_mes,
        ).filter(
            models.Q(data_fim__isnull=True) | models.Q(data_fim__gte=primeiro_dia)
        ).select_related('aluno', 'aluno__curso', 'horario', 'horario__professor')

        for recorrencia in recorrencias:
            if not recorrencia.aluno.ativo or not recorrencia.horario.ativo:
                continue

            dia_semana = recorrencia.horario.get_dia_semana_display()
            dias = {'Segunda': 0, 'Terça': 1, 'Quarta': 2,
                    'Quinta': 3, 'Sexta': 4, 'Sábado': 5}
            weekday = dias.get(dia_semana)
            if weekday is None:
                continue

            ocorrencias = []
            for numero in range(1, ultimo_dia + 1):
                data_aula = date(ano, mes, numero)
                if (
                    data_aula.weekday() == weekday
                    and data_aula >= recorrencia.data_inicio
                    and (recorrencia.data_fim is None or data_aula <= recorrencia.data_fim)
                ):
                    ocorrencias.append(data_aula)

            for indice, data_aula in enumerate(ocorrencias):
                if Aula.objects.filter(recorrencia=recorrencia, data=data_aula).exists():
                    existentes += 1
                    continue

                payload = {
                    'aluno': recorrencia.aluno_id,
                    'professor': recorrencia.horario.professor_id,
                    'curso': recorrencia.aluno.curso_id,
                    'horario': recorrencia.horario_id,
                    'data': data_aula.isoformat(),
                    'hora_inicio': recorrencia.horario.horario.isoformat(),
                    'tipo': 'regular',
                    'status': 'agendada',
                    'observacoes': '',
                }
                serializer = AulaSerializer(data=payload)
                if not serializer.is_valid():
                    raise ValidationError({
                        'recorrencia': recorrencia.pk,
                        'data': data_aula.isoformat(),
                        'erro': serializer.errors,
                    })
                aula = serializer.save(
                    recorrencia=recorrencia,
                    cortesia=(indice == 4),
                )
                criadas.append(aula.pk)

    return {
        'mes': mes_referencia,
        'aulas_criadas': len(criadas),
        'aulas_ja_existentes': existentes,
        'aulas_ids': criadas,
    }
