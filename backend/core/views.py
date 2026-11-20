from django.shortcuts import render
from django.shortcuts import redirect, get_object_or_404
from datetime import date, timedelta, datetime
from django.utils.dateparse import parse_date
from .models import Aluno, Mensalidade, Pagamento, Professor, Curso
from django.db.models import Sum, Count, Q
import json
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import AlunoSerializer, CursoSerializer, MensalidadeSerializer, PagamentoSerializer, ProfessorSerializer
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import (
    Aula,
    HorarioProfessor,
    ExcecaoDisponibilidade,
)
from .serializers import (
    AulaSerializer,
    HorarioProfessorSerializer,
    ExcecaoDisponibilidadeSerializer,
)


def dashboard(request):
    hoje = date.today()
    mes_ref = request.GET.get('mes') or hoje.strftime("%Y-%m")

    mensalidades = Mensalidade.objects.filter(mes_referencia=mes_ref)
    alunos_experimentais = Aluno.objects.filter(
        experimental=True,
        ativo=True
    )
    for m in mensalidades:
        m.atualizar_status()

    

    total_recebido = mensalidades.filter(status='pago').aggregate(total=Sum('valor'))['total'] or 0

    total_pendente = mensalidades.filter(status='pendente').aggregate(total=Sum('valor'))['total'] or 0

    total_atrasado = mensalidades.filter(status='atrasado') \
        .aggregate(total=Sum('valor'))['total'] or 0

    inadimplentes = mensalidades_atrasadas = mensalidades.filter(status='atrasado') \
        .values('aluno', 'aluno__nome') \
        .annotate(total=Sum('valor'))
    
    mensalidades_atrasadas = mensalidades_atrasadas = mensalidades.filter(status='atrasado')
    
    qtd_inadimplentes = mensalidades.filter(status='atrasado') \
        .values('aluno') \
        .distinct() \
        .count()
    
    dados_grafico = (
        Mensalidade.objects
        .filter(status='pago')
        .values('mes_referencia')
        .annotate(total=Sum('valor'))
        .order_by('mes_referencia')
    )

    context = {
        'total_recebido': total_recebido,
        'total_pendente': total_pendente,
        'total_atrasado': total_atrasado,
        'quantidade': mensalidades.count(),
        'inadimplentes': inadimplentes,
        'qtd_inadimplentes': qtd_inadimplentes,
        'mes_ref': mes_ref,
        'grafico_labels': json.dumps([d['mes_referencia'] for d in dados_grafico]),
        'grafico_valores': json.dumps([float(d['total']) for d in dados_grafico]),
        'mensalidades_atrasadas': mensalidades_atrasadas,
        'alunos_experimentais': alunos_experimentais,
    }

    return render(request, 'dashboard.html', context)


def dashboard_api(request):
    hoje = date.today()
    mes_ref = request.GET.get('mes') or hoje.strftime("%Y-%m")

    ano, mes = map(int, mes_ref.split("-"))

    if mes == 1:
        mes_anterior = f"{ano - 1}-12"
    else:
        mes_anterior = f"{ano}-{mes - 1:02d}"

    mensalidades = Mensalidade.objects.filter(
        mes_referencia=mes_ref
    )

    mensalidades.exclude(
        status='pago'
    ).filter(
        data_vencimento__lt=hoje
    ).update(status='atrasado')

    mensalidades.exclude(
        status='pago'
    ).filter(
        data_vencimento__gte=hoje
    ).update(status='pendente')

    total_recebido = mensalidades.filter(
        status='pago'
    ).aggregate(total=Sum('valor'))['total'] or 0

    recebido_mes_anterior = (
            Mensalidade.objects
            .filter(
                mes_referencia=mes_anterior,
                status="pago",
            )
            .aggregate(total=Sum("valor"))["total"] or 0
    )

    diferenca_receita = total_recebido - recebido_mes_anterior

    if recebido_mes_anterior > 0:
        variacao_receita = round(
            float(
                diferenca_receita
                / recebido_mes_anterior
                * 100
            ),
            2,
        )
    else:
        variacao_receita = None

    total_pendente = mensalidades.filter(
        status='pendente'
    ).aggregate(total=Sum('valor'))['total'] or 0

    total_atrasado = mensalidades.filter(
        status='atrasado'
    ).aggregate(total=Sum('valor'))['total'] or 0

    total_previsto = (
            total_recebido + total_pendente + total_atrasado
    )

    quantidade_mensalidades = mensalidades.count()
    quantidade_pagas = mensalidades.filter(status='pago').count()
    quantidade_pendentes = mensalidades.filter(status='pendente').count()
    quantidade_atrasadas = mensalidades.filter(status='atrasado').count()

    qtd_inadimplentes = mensalidades.filter(
        status='atrasado'
    ).values('aluno').distinct().count()

    quantidade_alunos = Aluno.objects.filter(ativo=True).count()

    if total_previsto > 0:
        taxa_recebimento = round(
            float(total_recebido / total_previsto * 100), 2
        )
        taxa_inadimplencia = round(
            float(total_atrasado / total_previsto * 100), 2
        )
    else:
        taxa_recebimento = None
        taxa_inadimplencia = None

    if quantidade_mensalidades > 0:
        ticket_medio = round(
            float(total_previsto / quantidade_mensalidades), 2
        )
    else:
        ticket_medio = None

    return JsonResponse({
        "mes": mes_ref,

        "receitas": {
            "recebido": float(total_recebido),
            "pendente": float(total_pendente),
            "atrasado": float(total_atrasado),
            "previsto": float(total_previsto),
        },

        "mensalidades": {
            "total": quantidade_mensalidades,
            "pagas": quantidade_pagas,
            "pendentes": quantidade_pendentes,
            "atrasadas": quantidade_atrasadas,
        },

        "alunos": {
            "ativos": quantidade_alunos,
            "inadimplentes": qtd_inadimplentes,
        },

        "indicadores": {
            "taxa_recebimento": taxa_recebimento,
            "taxa_inadimplencia": taxa_inadimplencia,
            "ticket_medio": ticket_medio,
        },

        "comparativo": {
            "mes_anterior": mes_anterior,
            "recebido_mes_anterior": float(recebido_mes_anterior),
            "diferenca_receita": float(diferenca_receita),
            "variacao_receita_percentual": variacao_receita,
        },
    })

def registrar_pagamento(request, mensalidade_id):
    mensalidade = get_object_or_404(Mensalidade, id=mensalidade_id)

    if request.method == 'POST':
        forma = request.POST.get('forma_pagamento')
        nota = request.POST.get('numero_nota')

        Pagamento.objects.create(
            mensalidade=mensalidade,
            valor_pago=mensalidade.valor,
            forma_pagamento=forma,
            numero_nota=nota
        )

        mensalidade.status = 'pago'
        mensalidade.save()

        return redirect('dashboard')

    return render(request, 'registrar_pagamento.html', {
        'mensalidade': mensalidade
    })

def historico_aluno(request, aluno_id):
    aluno = get_object_or_404(Aluno, id=aluno_id)

    pagamentos = Pagamento.objects.filter(
        mensalidade__aluno = aluno
    ).order_by('-data_pagamento')

    return render(request, 'historico_aluno.html',{
        'aluno': aluno,
        'pagamentos': pagamentos
    })

def efetivar_aluno(request, aluno_id):
    aluno = get_object_or_404(Aluno, id=aluno_id)
    if aluno.experimental:
        aluno.experimental = False
        aluno.save()

        hoje = date.today()

        mes_ref = hoje.strftime("%Y-%m")

        data_vencimento = date(
            hoje.year,
            hoje.month,
            aluno.dia_vencimento
        )

        Mensalidade.objects.create(
            aluno=aluno,
            valor=aluno.valor_mensalidade,
            desconto=0,
            data_vencimento=data_vencimento,
            mes_referencia=mes_ref,
            status='pendente'
        )
    return redirect('dashboard')

@api_view(['GET', 'POST'])
def lista_dados(request):

    if request.method == 'GET':
        dados = Aluno.objects.filter(ativo=True)
        serializer = AlunoSerializer(dados, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        serializer = AlunoSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)

@api_view(['PATCH', 'DELETE'])
def editar_aluno(request, id):

    try:
        aluno = Aluno.objects.get(id=id)
    except Aluno.DoesNotExist:
        return Response(
            {"erro": "Aluno não encontrado."},
            status=404
        )

    if request.method == 'PATCH':
        serializer = AlunoSerializer(
            aluno,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)

    if request.method == 'DELETE':
        aluno.ativo = False
        aluno.save()

        return Response(
            {"mensagem": "Aluno inativado com sucesso."},
            status=200
        )

@api_view(['GET', 'POST'])
def lista_cursos(request):
    if request.method == 'GET':
        dados = Curso.objects.annotate(
            quantidade_alunos=Count(
                'alunos',
                filter=Q(alunos__ativo=True)
            )
        )

        serializer = CursoSerializer(dados, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        serializer = CursoSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)


@swagger_auto_schema(
    methods=['post'],
    request_body=ProfessorSerializer,
)
@api_view(['GET', 'POST'])
def lista_professores(request):

    if request.method == 'GET':
        dados = Professor.objects.all()
        serializer = ProfessorSerializer(dados, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        serializer = ProfessorSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)

@api_view(['PATCH', 'DELETE'])
def editar_professor(request, id):
    try:
        professor = Professor.objects.get(id=id)
    except Professor.DoesNotExist:
        return Response(
            {"erro": "Professor não encontrado."},
            status=404
        )

    if request.method == 'PATCH':
        serializer = ProfessorSerializer(
            professor,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)

    if request.method == 'DELETE':
        professor.ativo = False
        professor.save()

        return Response(
            {"mensagem": "Professor inativado com sucesso."},
            status=200
        )

@api_view(['GET'])
def lista_mensalidades(request):
    dados = Mensalidade.objects.filter(aluno__ativo=True)
    serializer = MensalidadeSerializer(dados, many=True)
    return Response(serializer.data)

@csrf_exempt
@api_view(['POST'])
def registrar_pagamento_api(request, mensalidade_id):

    mensalidade = get_object_or_404(Mensalidade, id=mensalidade_id)

    dados_pagamento = request.data.copy()

    dados_pagamento['mensalidade'] = mensalidade.id
    dados_pagamento['valor_pago'] = mensalidade.valor

    serializer = PagamentoSerializer(data=dados_pagamento)

    if serializer.is_valid():
        serializer.save()

        mensalidade.status = 'pago'
        mensalidade.save()

        return Response(serializer.data, status=201)

    return Response(serializer.errors, status=400)

class HorarioProfessorViewSet(viewsets.ModelViewSet):
    serializer_class = HorarioProfessorSerializer

    def get_queryset(self):
        queryset = HorarioProfessor.objects.select_related(
            'professor'
        ).all()

        professor_id = self.request.query_params.get('professor')
        dia = self.request.query_params.get('dia_semana')

        if professor_id:
            queryset = queryset.filter(professor_id=professor_id)

        if dia:
            queryset = queryset.filter(dia_semana=dia)

        return queryset


class ExcecaoDisponibilidadeViewSet(viewsets.ModelViewSet):
    serializer_class = ExcecaoDisponibilidadeSerializer

    def get_queryset(self):
        queryset = ExcecaoDisponibilidade.objects.select_related(
            'professor'
        ).all()

        professor_id = self.request.query_params.get('professor')
        data = self.request.query_params.get('data')
        tipo = self.request.query_params.get('tipo')

        if professor_id:
            queryset = queryset.filter(professor_id=professor_id)

        if data:
            data_validada = parse_date(data)
            if not data_validada:
                return queryset.none()
            queryset = queryset.filter(data=data_validada)

        if tipo:
            queryset = queryset.filter(tipo=tipo)

        return queryset


class AulaViewSet(viewsets.ModelViewSet):
    serializer_class = AulaSerializer

    def get_queryset(self):
        queryset = Aula.objects.select_related(
            'aluno',
            'professor',
            'curso',
            'horario',
        ).all()

        professor_id = self.request.query_params.get('professor')
        aluno_id = self.request.query_params.get('aluno')
        data = self.request.query_params.get('data')
        status_aula = self.request.query_params.get('status')

        if professor_id:
            queryset = queryset.filter(professor_id=professor_id)

        if aluno_id:
            queryset = queryset.filter(aluno_id=aluno_id)

        if data:
            data_validada = parse_date(data)
            if not data_validada:
                return queryset.none()
            queryset = queryset.filter(data=data_validada)

        if status_aula:
            queryset = queryset.filter(status=status_aula)

        return queryset

    def perform_destroy(self, instance):
        instance.status = 'cancelada'
        instance.save(update_fields=['status'])

@swagger_auto_schema(
    method='get',
    manual_parameters=[
        openapi.Parameter(
            'professor',
            openapi.IN_QUERY,
            description='ID do professor',
            type=openapi.TYPE_INTEGER,
            required=True,
        ),
        openapi.Parameter(
            'data',
            openapi.IN_QUERY,
            description='Data da consulta (AAAA-MM-DD)',
            type=openapi.TYPE_STRING,
            required=True,
        ),
        openapi.Parameter(
            'tipo',
            openapi.IN_QUERY,
            description='Tipo de aula: regular ou experimental',
            type=openapi.TYPE_STRING,
            required=False,
            default='regular',
        ),
        openapi.Parameter(
            'aluno',
            openapi.IN_QUERY,
            description='ID do aluno para verificar conflitos',
            type=openapi.TYPE_INTEGER,
            required=False,
        ),
    ],
)
@api_view(['GET'])
def disponibilidade_professor(request):
    professor_id = request.query_params.get('professor')
    data_texto = request.query_params.get('data')
    tipo = request.query_params.get('tipo', 'regular')
    aluno_id = request.query_params.get('aluno')

    if not professor_id or not data_texto:
        return Response(
            {'erro': 'Informe professor e data (AAAA-MM-DD).'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if tipo not in ('regular', 'experimental'):
        return Response(
            {'erro': 'Tipo deve ser regular ou experimental.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data_aula = parse_date(data_texto)
    if not data_aula:
        return Response(
            {'erro': 'Data inválida. Use AAAA-MM-DD.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        professor = Professor.objects.get(
            pk=professor_id,
            ativo=True,
        )
    except (Professor.DoesNotExist, ValueError, TypeError):
        return Response(
            {'erro': 'Professor não encontrado ou inativo.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if aluno_id:
        try:
            aluno = Aluno.objects.get(pk=aluno_id, ativo=True)
        except (Aluno.DoesNotExist, ValueError, TypeError):
            return Response(
                {'erro': 'Aluno não encontrado ou inativo.'},
                status=status.HTTP_404_NOT_FOUND,
            )
    else:
        aluno = None

    dias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab']
    dia_semana = dias[data_aula.weekday()] if data_aula.weekday() < 6 else None

    if dia_semana is None:
        return Response([])

    duracao = timedelta(minutes=30 if tipo == 'experimental' else 60)

    horarios = HorarioProfessor.objects.filter(
        professor=professor,
        dia_semana=dia_semana,
        ativo=True,
    )

    candidatos = {
        horario.horario: horario.id
        for horario in horarios
    }

    extras = ExcecaoDisponibilidade.objects.filter(
        professor=professor,
        data=data_aula,
        tipo='extra',
    )

    for extra in extras:
        inicio_dt = datetime.combine(
            data_aula, extra.hora_inicio
        )
        limite_dt = datetime.combine(
            data_aula, extra.hora_fim
        )

        passo = timedelta(minutes=30 if tipo == 'experimental' else 60)
        candidato_dt = inicio_dt

        while candidato_dt + duracao <= limite_dt:
            candidatos.setdefault(candidato_dt.time(), None)
            candidato_dt += passo

    bloqueios = ExcecaoDisponibilidade.objects.filter(
        professor=professor,
        data=data_aula,
        tipo='bloqueio',
    )

    resultado = []

    for hora_inicio, horario_id in sorted(candidatos.items()):
        inicio_dt = datetime.combine(
            data_aula, hora_inicio
        )
        fim_dt = inicio_dt + duracao

        if fim_dt.date() != data_aula:
            continue

        hora_fim = fim_dt.time()

        bloqueado = bloqueios.filter(
            hora_inicio__lt=hora_fim,
            hora_fim__gt=hora_inicio,
        ).exists()

        if bloqueado:
            continue

        conflitos = Aula.objects.filter(
            data=data_aula,
            status='agendada',
            hora_inicio__lt=hora_fim,
            hora_fim__gt=hora_inicio,
        )

        conflito_professor = conflitos.filter(
            professor=professor
        ).exists()

        conflito_aluno = (
            conflitos.filter(aluno=aluno).exists()
            if aluno else False
        )

        if conflito_professor or conflito_aluno:
            continue

        if horario_id is None and not extras.filter(
                hora_inicio__lte=hora_inicio,
                hora_fim__gte=hora_fim,
        ).exists():
            continue

        resultado.append({
            'data': data_aula.isoformat(),
            'hora_inicio': hora_inicio.strftime('%H:%M'),
            'hora_fim': hora_fim.strftime('%H:%M'),
            'tipo': tipo,
            'horario': horario_id,
            'extraordinario': horario_id is None,
        })

    return Response(resultado)