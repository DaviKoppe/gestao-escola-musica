from datetime import date, time, timedelta

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    Aluno,
    Aula,
    Curso,
    ExcecaoDisponibilidade,
    HorarioProfessor,
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
            horario=time(9, 30),
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


    def test_filtra_aulas_por_professor_aluno_e_status(self):
        aula = self.criar_aula()
        aula.status = "realizada"
        aula.save(update_fields=["status"])

        outro_professor = Professor.objects.create(
            nome="Outro professor",
            ativo=True,
        )
        outro_professor.cursos.add(self.curso)

        outro_aluno = Aluno.objects.create(
            nome="Outro aluno",
            curso=self.curso,
            data_nascimento=date(2001, 1, 1),
            telefone="21988888888",
            endereco="Outra rua",
            valor_mensalidade="190.00",
            dia_vencimento=10,
        )
        outro_horario = HorarioProfessor.objects.create(
            professor=outro_professor,
            dia_semana="seg",
            horario=time(9, 0),
        )
        serializer = AulaSerializer(data={
            **self.payload(),
            "aluno": outro_aluno.pk,
            "professor": outro_professor.pk,
            "horario": outro_horario.pk,
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        segunda_aula = serializer.save()

        resposta_professor = self.client.get(
            reverse("aula-list"),
            {"professor": self.professor.pk},
        )
        self.assertEqual(resposta_professor.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in resposta_professor.data], [aula.pk])

        resposta_aluno = self.client.get(
            reverse("aula-list"),
            {"aluno": self.aluno.pk},
        )
        self.assertEqual([item["id"] for item in resposta_aluno.data], [aula.pk])

        resposta_status = self.client.get(
            reverse("aula-list"),
            {"status": "agendada"},
        )
        self.assertEqual(
            [item["id"] for item in resposta_status.data],
            [segunda_aula.pk],
        )

    def test_filtra_aulas_por_intervalo_de_datas(self):
        primeira_aula = self.criar_aula()
        segunda_data = date(2026, 11, 9)
        segunda_aula = self.criar_aula(data=segunda_data.isoformat())

        resposta = self.client.get(
            reverse("aula-list"),
            {
                "data_inicio": "2026-11-02",
                "data_fim": "2026-11-02",
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [item["id"] for item in resposta.data],
            [primeira_aula.pk],
        )
        self.assertNotIn(
            segunda_aula.pk,
            [item["id"] for item in resposta.data],
        )

    def test_rejeita_intervalo_de_datas_invertido(self):
        resposta = self.client.get(
            reverse("aula-list"),
            {
                "data_inicio": "2026-11-10",
                "data_fim": "2026-11-02",
            },
        )

        self.assertEqual(
            resposta.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("data_inicio", resposta.data)

    def test_rejeita_data_em_formato_invalido(self):
        resposta = self.client.get(
            reverse("aula-list"),
            {"data_inicio": "02-11-2026"},
        )

        self.assertEqual(
            resposta.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("data_inicio", resposta.data)

    def test_paginacao_sob_demanda_preserva_lista_padrao(self):
        for semana in range(21):
            data_aula = date(2026, 11, 2) + timedelta(weeks=semana)
            self.criar_aula(data=data_aula.isoformat())

        resposta_padrao = self.client.get(reverse("aula-list"))
        self.assertIsInstance(resposta_padrao.data, list)
        self.assertEqual(len(resposta_padrao.data), 21)

        resposta_paginada = self.client.get(
            reverse("aula-list"),
            {"page": 1, "page_size": 10},
        )

        self.assertEqual(resposta_paginada.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta_paginada.data["count"], 21)
        self.assertEqual(len(resposta_paginada.data["results"]), 10)
        self.assertIsNotNone(resposta_paginada.data["next"])

