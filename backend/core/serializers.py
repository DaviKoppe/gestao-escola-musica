from rest_framework import serializers
from .models import Aluno, Curso, Mensalidade, Pagamento

class CursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curso
        fields = ['id', 'nome']

class AlunoSerializer(serializers.ModelSerializer):
    curso_nome = serializers.CharField(source='curso.nome', read_only=True)

    class Meta:
        model = Aluno
        fields = [
            'id',
            'nome',
            'curso',
            'curso_nome',
            'data_nascimento',
            'responsavel',
            'telefone',
            'email',
            'endereco',
            'valor_mensalidade',
            'dia_vencimento',
            'ativo',
            'experimental',
        ]

class MensalidadeSerializer(serializers.ModelSerializer):
    aluno_nome = serializers.CharField(source='aluno.nome', read_only=True)

    class Meta:
        model = Mensalidade
        fields = [
            'id',
            'aluno',
            'aluno_nome',
            'valor',
            'desconto',
            'data_vencimento',
            'mes_referencia',
            'status',
        ]

class PagamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pagamento
        fields = [
            'mensalidade',
            'valor_pago',
            'data_pagamento',
            'forma_pagamento',
            'numero_nota'
        ]


def validate_dia_vencimento(self, value):
    if not 1 <= value <= 28:
        raise serializers.ValidationError("Dia de vencimento deve estar entre 1 e 28.")
    return value