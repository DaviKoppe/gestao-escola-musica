# Sistema de Gestão para Escola de Música

O **Sistema de Gestão para Escola de Música** é um projeto desenvolvido para facilitar o gerenciamento de uma escola de música, centralizando informações de alunos, cursos e mensalidades em um único sistema.

A ideia surgiu de uma necessidade real de organização e, ao longo do desenvolvimento, o projeto também acabou servindo como forma de colocar em prática conhecimentos de desenvolvimento web, principalmente com **React, Django REST Framework e PostgreSQL**.

## Funcionalidades

Atualmente, o sistema conta com:

* Cadastro de alunos
* Edição e exclusão de alunos
* Cadastro de cursos diretamente pela interface
* Associação de alunos aos seus respectivos cursos
* Registro do valor da mensalidade de cada aluno
* Consulta de informações detalhadas dos alunos
* Visualização das mensalidades
* Consulta de status e vencimento das mensalidades
* Cadastro e consulta de pagamentos
* API REST para comunicação entre frontend e backend
* Persistência dos dados em PostgreSQL

O projeto ainda está em desenvolvimento e novas funcionalidades podem ser adicionadas conforme a necessidade do sistema.

## Tecnologias utilizadas

### Frontend

* React
* JavaScript
* Vite
* Axios
* HTML e CSS

### Backend

* Python
* Django
* Django REST Framework
* drf-yasg
* django-cors-headers

### Banco de dados

* PostgreSQL
* Psycopg

### Ferramentas

* Git
* GitHub
* WebStorm

## Estrutura do projeto

```text
gestao-escola-musica/
├── backend/
│   ├── config/
│   ├── core/
│   │   ├── migrations/
│   │   ├── templates/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── services.py
│   │   └── views.py
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── models/
│   │   └── pages/
│   └── package.json
│
├── .gitignore
├── requirements.txt
└── README.md
```

## Como executar o projeto

### 1. Clone o repositório

```bash
git clone https://github.com/DaviKoppe/gestao-escola-musica.git
cd gestao-escola-musica
```

### 2. Backend

Crie e ative um ambiente virtual:

```bash
python -m venv venv
```

No Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Entre na pasta do backend:

```bash
cd backend
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` dentro de `backend/`.

Exemplo:

```env
SECRET_KEY=sua-chave-secreta
DEBUG=True

DB_NAME=nome_do_banco
DB_USER=usuario_do_postgresql
DB_PASSWORD=senha_do_postgresql
DB_HOST=localhost
DB_PORT=5432
```

> O arquivo `.env` não deve ser enviado para o Git. Para isso, ele já está incluído no `.gitignore`.

### 4. Configure o banco de dados

Com o PostgreSQL instalado e o banco criado, execute:

```bash
python manage.py migrate
```

Se necessário, crie um usuário administrador:

```bash
python manage.py createsuperuser
```

### 5. Inicie o backend

```bash
python manage.py runserver
```

O backend estará disponível, por padrão, em:

```text
http://127.0.0.1:8000
```

### 6. Inicie o frontend

Abra outro terminal e entre na pasta `frontend`:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Inicie o Vite:

```bash
npm run dev
```

O frontend estará disponível, por padrão, em:

```text
http://localhost:5173
```

## Comunicação entre frontend e backend

O frontend utiliza **Axios** para consumir a API disponibilizada pelo Django REST Framework.

A comunicação segue, de forma geral, este fluxo:

```text
React
  ↓
Axios
  ↓
Django REST Framework
  ↓
PostgreSQL
```

As URLs da API são centralizadas na configuração do frontend, evitando a repetição do endereço do backend em diferentes componentes.

## Banco de Dados

O projeto utiliza PostgreSQL como banco de dados principal.

Entre as entidades utilizadas pelo sistema estão:

* Aluno
* Curso
* Mensalidade
* Pagamento
* Aula
* Professor

O relacionamento entre essas entidades é controlado pelo Django através dos models e migrations.

## Documentação da API

O backend utiliza `drf-yasg` para geração da documentação da API.

Com o servidor Django em execução, a documentação pode ser acessada pelas rotas configuradas no projeto.

## Objetivo do projeto

O Sistema de Gestão para Escola de Música começou como um projeto de estudo e foi evoluindo para uma aplicação completa o suficiente para representar um cenário real de gestão de uma escola de música.

Além da construção das funcionalidades, o projeto tem como objetivo colocar em prática conceitos como:

* Desenvolvimento de APIs REST
* Integração entre frontend e backend
* Modelagem de banco de dados
* Relacionamentos entre entidades
* Operações CRUD
* Migrations
* Variáveis de ambiente
* Controle de versão com Git
* Organização de uma aplicação frontend/backend

## Próximos passos

Algumas ideias para a evolução do projeto:

* Sistema de autenticação e autorização
* Dashboard com indicadores financeiros
* Controle mais completo de pagamentos e inadimplência
* Gerenciamento de aulas e horários
* Melhorias na interface e experiência do usuário
* Responsividade
* Testes automatizados
* Deploy da aplicação

---

Projeto desenvolvido por **Davi Koppe**.
