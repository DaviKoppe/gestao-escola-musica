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
    ordering = ['nome']
    nome = models.CharField(max_length=255)
    data_nascimento = models.DateField(blank=True,null=True)
    cursos = models.ManyToManyField(Curso)

    def __str__(self):
        return self.nome

class HorarioProfessor(models.Model):
    professor = models.ForeignKey(Professor, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['professor', 'dia_semana', 'horario']

    DIA_SEMANA_CHOICES = [
        ('seg', 'Segunda'),
        ('ter', 'Terça'),
        ('qua', 'Quarta'),
        ('qui', 'Quinta'),
        ('sex', 'Sexta'),
        ('sab', 'Sábado'),
    ]

    dia_semana = models.CharField(max_length=3, choices=DIA_SEMANA_CHOICES)
    horario = models.TimeField()
    
# Aula
class Aula(models.Model):
    aluno = models.ForeignKey(Aluno, on_delete = models.CASCADE)
    horario = models.ForeignKey(HorarioProfessor, on_delete=models.CASCADE)
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE)
    professor = models.ForeignKey(Professor, on_delete = models.CASCADE)
    DIA_SEMANA_CHOICES = [
        ('seg', 'Segunda'),
        ('ter', 'Terça'),
        ('qua', 'Quarta'),
        ('qui', 'Quinta'),
        ('sex', 'Sexta'),
        ('sab', 'Sábado'),
    ]
    dia_semana = models.CharField(max_length=3, choices=DIA_SEMANA_CHOICES)


    def __str__(self):
        return f'{self.aluno} - {self.curso}'
    
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



