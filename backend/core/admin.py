from django.contrib import admin
from .models import Aluno, Professor, Aula, Mensalidade, Pagamento, Curso
from .services import gerar_mensalidades

@admin.register(Aluno)
class AlunoAdmin(admin.ModelAdmin):
    list_display = ('nome','telefone','ativo')
    search_fields = ('nome','telefone')
    list_filter = ('ativo',)

    actions = ['gerar_mensalidades_action']

    def gerar_mensalidades_action(self, request, queryset):
        gerar_mensalidades()
        self.message_user(request, "Mensalidades geradas com sucesso!")
    
    gerar_mensalidades_action.short_description = "Gerar mensalidades do mês atual"

@admin.register(Professor)
class ProfessorAdmin(admin.ModelAdmin):
    list_display = ('nome',)
    search_fields = ('nome',)

@admin.register(Aula)
class AulaAdmin(admin.ModelAdmin):
    list_display = ('aluno', 'professor', 'dia_semana', 'horario', 'curso')
    list_filter = ('professor', 'dia_semana')

@admin.register(Mensalidade)
class MensalidadeAdmin(admin.ModelAdmin):
    list_display = ('aluno', 'mes_referencia', 'valor', 'status')
    list_filter = ('status', 'mes_referencia')

admin.site.register(Pagamento)
class PagamentoAdmin(admin.ModelAdmin):
    list_display = ('aluno', 'valor_pago', 'data_pagamento', 'forma_pagamento')
    list_filter = ('forma_pagamento',)

@admin.register(Curso)
class CursoAdmin(admin.ModelAdmin):
    list_display = ('nome',)
