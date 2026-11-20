from datetime import date, time

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    Aluno,
    Aula,
    Curso,
    ExcecaoDisponibilidade,
    HorarioProfessor,
    Mensalidade,
    Professor,
)
from .serializers import AulaSerializer


class AulaAgendamentoTests(APITestCase):
    def setUp(self):
        self.curso = Curso.objects.create(nome="Bateria")
        self.professor = Professor.objects.create(
            nome="Professor de teste",
            ativo=True,
        )
        self.professor.cursos.add(self.curso)

        self.aluno = Aluno.objects.create(
            nome="Aluno de teste",
            curso=self.curso,
            data_nascimento=date(2000, 1, 1),
            telefone="21999999999",
            email="aluno@example.com",
            endereco="Rua de teste",
            valor_mensalidade="190.00",
            dia_vencimento=10,
            ativo=True,
            experimental=False,
        )

        # 02/11/2026 é uma segunda-feira.
        self.data_aula = date(2026, 11, 2)
        self.horario = HorarioProfessor.objects.create(
            professor=self.professor,
            dia_semana="seg",
            horario=time(9, 0),
            ativo=True,
        )

    def payload(self, **overrides):
        data = {
            "aluno": self.aluno.pk,
            "professor": self.professor.pk,
            "curso": self.curso.pk,
            "horario": self.horario.pk,
            "data": self.data_aula.isoformat(),
            "hora_inicio": "09:00:00",
            "tipo": "regular",
            "status": "agendada",
            "observacoes": "",
        }
        data.update(overrides)
        return data

    def criar_aula(self, **overrides):
        serializer = AulaSerializer(data=self.payload(**overrides))
        self.assertTrue(serializer.is_valid(), serializer.errors)
        return serializer.save()

    def test_agenda_aula_regular_com_duracao_de_60_minutos(self):
        aula = self.criar_aula()

        self.assertEqual(aula.hora_fim, time(10, 0))
        self.assertEqual(aula.dia_semana, "seg")
        self.assertEqual(aula.status, "agendada")

    def test_agenda_aula_experimental_com_duracao_de_30_minutos(self):
        aula = self.criar_aula(tipo="experimental")

        self.assertEqual(aula.hora_fim, time(9, 30))

    def test_impede_conflito_de_horario_do_mesmo_professor(self):
        self.criar_aula()

        outro_aluno = Aluno.objects.create(
            nome="Outro aluno",
            curso=self.curso,
            data_nascimento=date(2001, 1, 1),
            telefone="21988888888",
            endereco="Outra rua",
            valor_mensalidade="190.00",
            dia_vencimento=10,
        )
        serializer = AulaSerializer(data=self.payload(aluno=outro_aluno.pk))

        self.assertFalse(serializer.is_valid())
        self.assertIn("já possui uma aula", str(serializer.errors))

    def test_impede_conflito_de_horario_do_mesmo_aluno(self):
        self.criar_aula()
        outro_horario = HorarioProfessor.objects.create(
            professor=self.professor,
            dia_semana="seg",
            horario=time(10, 0),
        )
        serializer = AulaSerializer(data=self.payload(
            horario=outro_horario.pk,
            hora_inicio="09:30:00",
        ))

        self.assertFalse(serializer.is_valid())
        self.assertIn("já possui uma aula", str(serializer.errors))

    def test_respeita_bloqueio_de_disponibilidade(self):
        ExcecaoDisponibilidade.objects.create(
            professor=self.professor,
            data=self.data_aula,
            hora_inicio=time(9, 30),
            hora_fim=time(10, 30),
            tipo="bloqueio",
            motivo="Compromisso",
        )
        serializer = AulaSerializer(data=self.payload())

        self.assertFalse(serializer.is_valid())
        self.assertIn("bloqueio", str(serializer.errors).lower())

    def test_permite_agendamento_em_disponibilidade_extra(self):
        ExcecaoDisponibilidade.objects.create(
            professor=self.professor,
            data=self.data_aula,
            hora_inicio=time(14, 0),
            hora_fim=time(16, 0),
            tipo="extra",
            motivo="Reposição",
        )
        aula = self.criar_aula(
            horario=None,
            hora_inicio="14:00:00",
        )

        self.assertIsNone(aula.horario_id)
        self.assertEqual(aula.hora_fim, time(15, 0))

    def test_impede_agendamento_sem_horario_ou_disponibilidade_extra(self):
        serializer = AulaSerializer(data=self.payload(
            horario=None,
            hora_inicio="14:00:00",
        ))

        self.assertFalse(serializer.is_valid())
        self.assertIn("extraordinária", str(serializer.errors).lower())

    def test_rejeita_aluno_inativo(self):
        self.aluno.ativo = False
        self.aluno.save(update_fields=["ativo"])
        serializer = AulaSerializer(data=self.payload())

        self.assertFalse(serializer.is_valid())
        self.assertIn("aluno inativo", str(serializer.errors).lower())

    def test_rejeita_professor_inativo(self):
        self.professor.ativo = False
        self.professor.save(update_fields=["ativo"])
        serializer = AulaSerializer(data=self.payload())

        self.assertFalse(serializer.is_valid())
        self.assertIn("professor inativo", str(serializer.errors).lower())

    def test_rejeita_professor_sem_vinculo_com_o_curso(self):
        outro_curso = Curso.objects.create(nome="Violão")
        serializer = AulaSerializer(data=self.payload(curso=outro_curso.pk))

        self.assertFalse(serializer.is_valid())
        self.assertIn("não está vinculado", str(serializer.errors).lower())

    def test_rejeita_horario_semanal_inativo(self):
        self.horario.ativo = False
        self.horario.save(update_fields=["ativo"])
        serializer = AulaSerializer(data=self.payload())

        self.assertFalse(serializer.is_valid())
        self.assertIn("inativo", str(serializer.errors).lower())

    def test_cancelamento_preserva_aula_no_historico(self):
        aula = self.criar_aula()

        response = self.client.delete(
            reverse("aula-detail", kwargs={"pk": aula.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        aula.refresh_from_db()
        self.assertEqual(aula.status, "cancelada")
        self.assertTrue(Aula.objects.filter(pk=aula.pk).exists())
