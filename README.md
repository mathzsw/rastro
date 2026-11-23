# RASTRO

*Every code has a story.*

O GitHub guarda commits, releases e pull requests. O RASTRO organiza esses registros em uma linha do tempo para ajudar a entender como um repositório evoluiu.

A proposta não é medir quem programa mais nem adivinhar por que uma decisão foi tomada. É reunir evidências, destacar marcos e manter cada acontecimento ligado à sua fonte original.

**[Abrir demonstração](https://rastro-history-preview-59mettxc2-mathzsw.vercel.app)**

## O que dá para explorar

- Linha do tempo com commits, releases e pull requests.
- Marcos encontrados na história do repositório.
- Autores identificados nos registros consultados.
- Busca por texto, filtros por tipo e ordenação cronológica.
- Exportação CSV dos eventos filtrados.
- Links para abrir os registros diretamente no GitHub.

## Como funciona

1. Informe a URL de um repositório público do GitHub.
2. A API consulta os registros disponíveis.
3. O RASTRO organiza os dados por data e apresenta os acontecimentos em sequência.

As datas têm significados diferentes conforme o registro: commits usam a data de autoria, releases usam a publicação e pull requests mostram abertura, integração ou encerramento. A metodologia e os limites da consulta estão em [docs/METODOLOGIA.md](docs/METODOLOGIA.md).

## Tecnologias

**Frontend:** React, TypeScript, Vite e Axios.  
**Backend:** Node.js, Express e TypeScript.  
**Dados:** GitHub REST API.

## Executar localmente

É necessário ter Node.js 22 ou superior e npm.

Instale as dependências:

```bash
npm install --prefix backend
npm install --prefix frontend
```

Crie o arquivo `frontend/.env` com:

```env
VITE_API_URL=http://localhost:3000/api
```

Em um terminal, inicie a API:

```bash
npm --prefix backend run dev
```

Em outro terminal, inicie o frontend:

```bash
npm --prefix frontend run dev
```

Para executar os testes do backend:

```bash
npm --prefix backend test
```

## API

A API local fica em `http://localhost:3000`. Os endpoints disponíveis e seus parâmetros estão em [docs/API.md](docs/API.md).

## Limites conhecidos

O RASTRO consulta repositórios públicos e não exige autenticação. No estado atual, a consulta percorre até 10 páginas de 100 registros por categoria. O resultado pode não representar todo o histórico de um repositório, e a API do GitHub pode aplicar limites de requisição.

O projeto não altera repositórios nem mantém um banco de dados de histórico.

## Licença

Distribuído sob a licença MIT. Consulte [LICENSE](LICENSE).
