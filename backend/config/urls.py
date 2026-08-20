from django.contrib import admin
from django.urls import path
from core.views import dashboard
from core.views import registrar_pagamento
from core.views import historico_aluno
from core.views import efetivar_aluno
from core.views import lista_cursos
from core.views import editar_aluno
from core.views import lista_mensalidades
from core.views import registrar_pagamento_api

from django.urls import re_path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from core.views import lista_dados  

schema_view = get_schema_view(
   openapi.Info(
      title="Título da API",
      default_version='v1',
      description="Documentação da API do projeto",
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('dashboard/', dashboard, name='dashboard'),
    path('pagar/<int:mensalidade_id>/', registrar_pagamento, name='registrar_pagamento'),
    path('aluno/<int:aluno_id>/historico/', historico_aluno, name='historico_aluno'),
    path('aluno/<int:aluno_id>/efetivar/', efetivar_aluno, name='efetivar_aluno'),
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('api/alunos/', lista_dados, name='lista_dados'),
    path('api/alunos/<int:id>/', editar_aluno, name='editar_aluno'),
    path('api/cursos/', lista_cursos, name='lista_cursos'),
    path('api/mensalidades/', lista_mensalidades, name='lista_mensalidades'),
    path('api/mensalidades/<int:mensalidade_id>/pagar/',registrar_pagamento_api,name='registrar_pagamento_api'),
]

