# Generated manually for recurring lesson schedules.
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0004_excecaodisponibilidade_alter_aula_options_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='RecorrenciaAula',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data_inicio', models.DateField()),
                ('data_fim', models.DateField(blank=True, null=True)),
                ('ativo', models.BooleanField(default=True)),
                ('aluno', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='recorrencias_aulas', to='core.aluno')),
                ('horario', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='recorrencias', to='core.horarioprofessor')),
            ],
            options={
                'ordering': ['aluno__nome', 'horario__dia_semana', 'horario__horario'],
            },
        ),
        migrations.AddField(
            model_name='aula',
            name='recorrencia',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='aulas', to='core.recorrenciaaula'),
        ),
        migrations.AddField(
            model_name='aula',
            name='cortesia',
            field=models.BooleanField(default=False),
        ),
        migrations.AddConstraint(
            model_name='recorrenciaaula',
            constraint=models.UniqueConstraint(fields=('aluno', 'horario', 'data_inicio'), name='recorrencia_aluno_horario_inicio_unica'),
        ),
        migrations.AddConstraint(
            model_name='aula',
            constraint=models.UniqueConstraint(condition=models.Q(('recorrencia__isnull', False)), fields=('recorrencia', 'data'), name='aula_recorrencia_data_unica'),
        ),
    ]
