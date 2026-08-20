from django.shortcuts import render
from django.shortcuts import redirect, get_object_or_404
from datetime import date
from .models import Mensalidade
from .models import Pagamento
from .models import Aluno
from django.db.models import Sum
import json
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Aluno
from .serializers import AlunoSerializer
from .serializers import AlunoSerializer, CursoSerializer, MensalidadeSerializer, PagamentoSerializer
from .models import Curso
from django.views.decorators.csrf import csrf_exempt

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
        dados = Curso.objects.all()
        serializer = CursoSerializer(dados, many=True)
        return Response(serializer.data)
    if request.method == 'POST':
        serializer = CursoSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET'])
def lista_mensalidades(request):
    dados = Mensalidade.objects.filter(aluno__ativo=True)
    serializer = MensalidadeSerializer(dados, many=True)
    return Response(serializer.data)

@csrf_exempt
@api_view(['POST'])
def registrar_pagamento_api(request, mensalidade_id):
    print("DADOS RECEBIDOS:", request.data)

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