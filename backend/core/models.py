from django.db import models
from datetime import date
from django.utils import timezone

class Curso(models.Model):
    nome = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ['nome']

    def __str__(self):
        return self.nome

# Aluno
class Aluno(models.Model):
    ordering = ['nome']
    
    nome = models.CharField(max_length=255)
    curso = models.ForeignKey(Curso, on_delete=models.PROTECT, related_name='alunos')
    data_nascimento = models.DateField()
    responsavel = models.CharField(max_length=255, blank=True,null=True)
    telefone = models.CharField(max_length=20)
    email = models.CharField(blank=True,null=True)
    endereco = models.TextField()
    valor_mensalidade = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    dia_vencimento = models.IntegerField()
    data_matricula = models.DateField(auto_now_add=True)
    ativo = models.BooleanField(default=True)
    experimental = models.BooleanField(default=False)

    def __str__(self):
        return self.nome
    
    def save(self,*args,**kwargs):
        novo = self._state.adding
        super().save(*args,**kwargs)

        if novo and not self.experimental:
            from .models import Mensalidade

            hoje = date.today()
            mes_ref = hoje.strftime('%Y-%m')

            data_vencimento = date(hoje.year, hoje.month, self.dia_vencimento)

            Mensalidade.objects.create(
                aluno=self,
                valor=self.valor_mensalidade,
                desconto=0,
                data_vencimento=data_vencimento,
                mes_referencia=mes_ref,
                status='pendente'
            )

# Professor
class Professor(models.Model):
    nome = models.CharField(max_length=255)
    data_nascimento = models.DateField(blank=True, null=True)
    cursos = models.ManyToManyField(
        Curso,
        related_name='professores'
    )
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome

class HorarioProfessor(models.Model):
    DIA_SEMANA_CHOICES = [
        ('seg', 'Segunda'),
        ('ter', 'Terça'),
        ('qua', 'Quarta'),
        ('qui', 'Quinta'),
        ('sex', 'Sexta'),
        ('sab', 'Sábado'),
    ]

    professor = models.ForeignKey(
        Professor,
        on_delete=models.CASCADE,
        related_name='horarios'
    )
    dia_semana = models.CharField(
        max_length=3,
        choices=DIA_SEMANA_CHOICES
    )
    horario = models.TimeField()
    ativo = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['professor', 'dia_semana', 'horario'],
                name='horario_professor_unico'
            )
        ]
        ordering = ['dia_semana', 'horario']

    def __str__(self):
        return f'{self.professor} - {self.get_dia_semana_display()} {self.horario}'


class RecorrenciaAula(models.Model):
    aluno = models.ForeignKey(
        Aluno,
        on_delete=models.PROTECT,
        related_name='recorrencias_aulas'
    )
    horario = models.ForeignKey(
        HorarioProfessor,
        on_delete=models.PROTECT,
        related_name='recorrencias'
    )
    data_inicio = models.DateField()
    data_fim = models.DateField(null=True, blank=True)
    ativo = models.BooleanField(default=True)

    class Meta:
        ordering = ['aluno__nome', 'horario__dia_semana', 'horario__horario']
        constraints = [
            models.UniqueConstraint(
                fields=['aluno', 'horario', 'data_inicio'],
                name='recorrencia_aluno_horario_inicio_unica'
            )
        ]

    def __str__(self):
        return f'{self.aluno} - {self.horario}'


class Aula(models.Model):
    TIPO_CHOICES = [
        ('regular', 'Regular'),
        ('experimental', 'Experimental'),
    ]

    STATUS_CHOICES = [
        ('agendada', 'Agendada'),
        ('realizada', 'Realizada'),
        ('cancelada', 'Cancelada'),
        ('falta', 'Falta do aluno'),
    ]

    aluno = models.ForeignKey(
        Aluno,
        on_delete=models.PROTECT,
        related_name='aulas'
    )
    horario = models.ForeignKey(
        HorarioProfessor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='aulas'
    )
    curso = models.ForeignKey(
        Curso,
        on_delete=models.PROTECT,
        related_name='aulas'
    )
    professor = models.ForeignKey(
        Professor,
        on_delete=models.PROTECT,
        related_name='aulas'
    )

    recorrencia = models.ForeignKey(
        'RecorrenciaAula',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='aulas'
    )
    cortesia = models.BooleanField(default=False)
    data = models.DateField(null=True, blank=True)
    hora_inicio = models.TimeField(null=True, blank=True)
    hora_fim = models.TimeField(null=True, blank=True)

    tipo = models.CharField(
        max_length=15,
        choices=TIPO_CHOICES,
        default='regular'
    )
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default='agendada'
    )
    observacoes = models.TextField(blank=True)

    DIA_SEMANA_CHOICES = HorarioProfessor.DIA_SEMANA_CHOICES

    dia_semana = models.CharField(
        max_length=3,
        choices=DIA_SEMANA_CHOICES,
        null=True,
        blank=True
    )

    class Meta:
        ordering = ['data', 'hora_inicio']
        constraints = [
            models.UniqueConstraint(
                fields=['recorrencia', 'data'],
                condition=models.Q(recorrencia__isnull=False),
                name='aula_recorrencia_data_unica'
            )
        ]

    def __str__(self):
        return f'{self.aluno} - {self.curso}'

    def save(self, *args, **kwargs):
        if self.tipo == 'experimental' and self.hora_inicio:
            from datetime import datetime, timedelta

            inicio = datetime.combine(date.today(), self.hora_inicio)
            self.hora_fim = (inicio + timedelta(minutes=30)).time()

        elif self.tipo == 'regular' and self.hora_inicio:
            from datetime import datetime, timedelta

            inicio = datetime.combine(date.today(), self.hora_inicio)
            self.hora_fim = (inicio + timedelta(hours=1)).time()

        if self.data:
            dias = {
                0: 'seg',
                1: 'ter',
                2: 'qua',
                3: 'qui',
                4: 'sex',
                5: 'sab',
            }
            self.dia_semana = dias.get(self.data.weekday())

        super().save(*args, **kwargs)

class ExcecaoDisponibilidade(models.Model):
    TIPO_CHOICES = [
        ('bloqueio', 'Indisponibilidade'),
        ('extra', 'Disponibilidade extraordinária'),
    ]

    professor = models.ForeignKey(
        Professor,
        on_delete=models.CASCADE,
        related_name='excecoes_disponibilidade'
    )
    data = models.DateField()
    hora_inicio = models.TimeField()
    hora_fim = models.TimeField()
    tipo = models.CharField(
        max_length=10,
        choices=TIPO_CHOICES
    )
    motivo = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['data', 'hora_inicio']

    def __str__(self):
        return (
            f'{self.professor} - {self.data} '
            f'{self.hora_inicio}-{self.hora_fim}'
        )

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.hora_fim <= self.hora_inicio:
            raise ValidationError(
                'O horário final deve ser posterior ao horário inicial.'
            )
    
# Mensalidade
class Mensalidade(models.Model):
    STATUS_CHOICES = [
        ('pendente','Pendente'),
        ('pago', 'Pago'),
        ('atrasado', 'Atrasado')
    ]

    aluno = models.ForeignKey(Aluno, on_delete = models.CASCADE)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    desconto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    data_vencimento = models.DateField()
    mes_referencia = models.CharField(max_length=12)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pendente')

    def __str__(self):
        return f'{self.aluno} - {self.mes_referencia}'
    
    def atualizar_status(self):
        if self.status != 'pago':
            if date.today() > self.data_vencimento:
                self.status = 'atrasado'
            else:
                self.status = 'pendente'
    
# Pagamento
from django.utils import timezone

class Pagamento(models.Model):
    mensalidade = models.ForeignKey(Mensalidade, on_delete=models.CASCADE)
    valor_pago = models.DecimalField(max_digits=10, decimal_places=2)
    data_pagamento = models.DateField(default=timezone.localdate)

    FORMA_PAGAMENTO_CHOICES = [
        ('pix', 'Pix'),
        ('dinheiro', 'Dinheiro'),
        ('cartao', 'Cartão'),
    ]

    forma_pagamento = models.CharField(max_length=20, choices=FORMA_PAGAMENTO_CHOICES)
    numero_nota = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.mensalidade} - {self.valor_pago}"



