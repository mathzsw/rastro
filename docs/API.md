# API do RASTRO

A API recebe URLs de repositórios públicos do GitHub e retorna os registros usados pela interface.

## Base URL

- Local: `http://localhost:3000`
- Preview: `https://rastro-api-preview.onrender.com`

Todas as rotas abaixo usam o prefixo `/api`.

## Endpoints

| Método e rota | Parâmetro | Retorno |
| --- | --- | --- |
| `GET /api/health` | — | Estado da API |
| `GET /api/repositories` | `url` | Dados básicos do repositório |
| `GET /api/commits` | `url` | Commits encontrados |
| `GET /api/releases` | `url` | Releases encontradas |
| `GET /api/pull-requests` | `url` | Pull requests encontradas |
| `GET /api/contributors` | `url` | Colaboradores retornados pelo GitHub |
| `GET /api/timeline` | `url` | Registros combinados em ordem cronológica |
| `GET /api/history` | `url` | História consolidada, eventos e marcos |
| `GET /api/milestones` | `url` | Marcos encontrados e cobertura consultada |

## Exemplo

Use a URL do repositório como parâmetro de consulta:

```text
GET /api/history?url=https%3A%2F%2Fgithub.com%2Ffacebook%2Freact
```

A API aceita URLs HTTPS de repositórios no domínio `github.com` ou `www.github.com`, no formato `/proprietário/repositório`. Subdiretórios, páginas de issues e domínios externos são rejeitados.

## Respostas e erros

As respostas são JSON. Quando a URL não é válida, o repositório não é encontrado ou a API do GitHub limita a consulta, a rota retorna uma mensagem no campo `error`.

A rota `/api/health` pode ser usada para verificar se o processo da API está respondendo.

## Paginação

Commits, releases e pull requests são consultados em páginas de até 100 registros, com limite de 10 páginas por categoria. Portanto, cada categoria pode retornar no máximo 1.000 registros nesta versão.

A consulta é somente leitura e não exige token do GitHub. Os limites de requisição da API pública continuam aplicáveis.
