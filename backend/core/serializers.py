from rest_framework import serializers
from .models import Aluno, Curso, Mensalidade, Pagamento, Professor, HorarioProfessor, ExcecaoDisponibilidade, Aula
from django.db import models

class ProfessorSerializer(serializers.ModelSerializer):
    cursos = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Curso.objects.all(),
        required=False
    )

    class Meta:
        model = Professor
        fields = [
            'id',
            'nome',
            'data_nascimento',
            'cursos',
            'ativo',
        ]

class CursoSerializer(serializers.ModelSerializer):
    professores = serializers.SerializerMethodField()
    quantidade_alunos = serializers.IntegerField(read_only=True)

    class Meta:
        model = Curso
        fields = [
            'id',
            'nome',
            'quantidade_alunos',
            'professores',
        ]

    def get_professores(self, curso):
        professores_ativos = curso.professores.filter(ativo=True)
        return ProfessorSerializer(
            professores_ativos,
            many=True
        ).data

class AlunoSerializer(serializers.ModelSerializer):
    curso_nome = serializers.CharField(source='curso.nome', read_only=True)

    def validate_dia_vencimento(self, value):
        if not 1 <= value <= 28:
            raise serializers.ValidationError(
                "Dia de vencimento deve estar entre 1 e 28."
            )
        return value

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

class HorarioProfessorSerializer(serializers.ModelSerializer):
    professor_nome = serializers.CharField(
        source='professor.nome',
        read_only=True
    )
    dia_semana_nome = serializers.CharField(
        source='get_dia_semana_display',
        read_only=True
    )

    class Meta:
        model = HorarioProfessor
        fields = [
            'id',
            'professor',
            'professor_nome',
            'dia_semana',
            'dia_semana_nome',
            'horario',
            'ativo',
        ]

    def validate(self, data):
        professor = data.get(
            'professor',
            getattr(self.instance, 'professor', None)
        )
        dia = data.get(
            'dia_semana',
            getattr(self.instance, 'dia_semana', None)
        )
        horario = data.get(
            'horario',
            getattr(self.instance, 'horario', None)
        )

        if professor and not professor.ativo:
            raise serializers.ValidationError(
                'Não é possível cadastrar horários para um professor inativo.'
            )

        duplicado = HorarioProfessor.objects.filter(
            professor=professor,
            dia_semana=dia,
            horario=horario,
        )

        if self.instance:
            duplicado = duplicado.exclude(pk=self.instance.pk)

        if duplicado.exists():
            raise serializers.ValidationError(
                'Esse professor já possui esse horário cadastrado.'
            )

        return data


class ExcecaoDisponibilidadeSerializer(
    serializers.ModelSerializer
):
    professor_nome = serializers.CharField(
        source='professor.nome',
        read_only=True
    )

    class Meta:
        model = ExcecaoDisponibilidade
        fields = [
            'id',
            'professor',
            'professor_nome',
            'data',
            'hora_inicio',
            'hora_fim',
            'tipo',
            'motivo',
        ]

    def validate(self, data):
        inicio = data.get(
            'hora_inicio',
            getattr(self.instance, 'hora_inicio', None)
        )
        fim = data.get(
            'hora_fim',
            getattr(self.instance, 'hora_fim', None)
        )

        if inicio and fim and fim <= inicio:
            raise serializers.ValidationError({
                'hora_fim': (
                    'O horário final deve ser posterior ao inicial.'
                )
            })

        professor = data.get(
            'professor',
            getattr(self.instance, 'professor', None)
        )

        if professor and not professor.ativo:
            raise serializers.ValidationError({
                'professor': 'O professor está inativo.'
            })

        return data


class AulaSerializer(serializers.ModelSerializer):
    aluno_nome = serializers.CharField(
        source='aluno.nome',
        read_only=True
    )
    professor_nome = serializers.CharField(
        source='professor.nome',
        read_only=True
    )
    curso_nome = serializers.CharField(
        source='curso.nome',
        read_only=True
    )
    hora_fim = serializers.TimeField(read_only=True)
    dia_semana = serializers.CharField(read_only=True)

    class Meta:
        model = Aula
        fields = [
            'id',
            'aluno',
            'aluno_nome',
            'professor',
            'professor_nome',
            'curso',
            'curso_nome',
            'horario',
            'data',
            'hora_inicio',
            'hora_fim',
            'dia_semana',
            'tipo',
            'status',
            'observacoes',
        ]

    def validate(self, data):
        atual = self.instance

        aluno = data.get(
            'aluno',
            getattr(atual, 'aluno', None)
        )
        professor = data.get(
            'professor',
            getattr(atual, 'professor', None)
        )
        curso = data.get(
            'curso',
            getattr(atual, 'curso', None)
        )
        data_aula = data.get(
            'data',
            getattr(atual, 'data', None)
        )
        inicio = data.get(
            'hora_inicio',
            getattr(atual, 'hora_inicio', None)
        )
        tipo = data.get(
            'tipo',
            getattr(atual, 'tipo', 'regular')
        )
        horario = data.get(
            'horario',
            getattr(atual, 'horario', None)
        )
        status = data.get(
            'status',
            getattr(atual, 'status', 'agendada')
        )

        if not all([aluno, professor, curso, data_aula, inicio]):
            raise serializers.ValidationError(
                'Aluno, professor, curso, data e horário são obrigatórios.'
            )

        if not aluno.ativo:
            raise serializers.ValidationError({
                'aluno': 'Não é possível agendar para um aluno inativo.'
            })

        if not professor.ativo:
            raise serializers.ValidationError({
                'professor': 'Não é possível agendar com um professor inativo.'
            })

        if curso not in professor.cursos.all():
            raise serializers.ValidationError({
                'curso': 'Esse professor não está vinculado ao curso escolhido.'
            })

        if aluno.curso_id != curso.id:
            raise serializers.ValidationError({
                'curso': 'O curso escolhido não corresponde ao curso do aluno.'
            })

        if horario and (
                not horario.ativo
                or horario.professor_id != professor.id
                or horario.dia_semana != {
                    0: 'seg',
                    1: 'ter',
                    2: 'qua',
                    3: 'qui',
                    4: 'sex',
                    5: 'sab',
                }.get(data_aula.weekday())
                or horario.horario != inicio
        ):
            raise serializers.ValidationError({
                'horario': (
                    'O horário semanal está inativo ou não corresponde '
                    'ao professor, à data ou ao horário de início.'
                )
            })

        from datetime import datetime, timedelta

        duracao = timedelta(minutes=30 if tipo == 'experimental' else 60)
        inicio_dt = datetime.combine(data_aula, inicio)
        fim_dt = inicio_dt + duracao

        if fim_dt.date() != data_aula:
            raise serializers.ValidationError({
                'hora_inicio': 'A aula precisa terminar no mesmo dia.'
            })

        fim = fim_dt.time()

        bloqueios = ExcecaoDisponibilidade.objects.filter(
            professor=professor,
            data=data_aula,
            tipo='bloqueio',
            hora_inicio__lt=fim,
            hora_fim__gt=inicio,
        )

        if bloqueios.exists() and status != 'cancelada':
            raise serializers.ValidationError({
                'hora_inicio': (
                    'O professor possui um bloqueio nesse intervalo.'
                )
            })

        if not horario:
            extras = ExcecaoDisponibilidade.objects.filter(
                professor=professor,
                data=data_aula,
                tipo='extra',
                hora_inicio__lte=inicio,
                hora_fim__gte=fim,
            )

            if not extras.exists():
                raise serializers.ValidationError({
                    'hora_inicio': (
                        'Fora dos horários habituais, cadastre primeiro '
                        'uma disponibilidade extraordinária para o professor.'
                    )
                })

        # Detecta sobreposição com outras aulas ativas.
        conflitos = Aula.objects.filter(
            data=data_aula,
            status='agendada',
            hora_inicio__lt=fim,
            hora_fim__gt=inicio,
        ).filter(
            models.Q(professor=professor) | models.Q(aluno=aluno)
        )

        if atual:
            conflitos = conflitos.exclude(pk=atual.pk)

        if status == 'agendada' and conflitos.exists():
            raise serializers.ValidationError(
                'O aluno ou o professor já possui uma aula nesse intervalo.'
            )

        return data