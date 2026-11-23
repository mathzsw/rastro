# Metodologia do RASTRO

O RASTRO organiza registros públicos do GitHub em uma sequência cronológica. Ele não tenta reconstruir conversas privadas, intenções ou decisões que não estejam documentadas nos próprios registros.

## Fontes consultadas

A API consulta os seguintes recursos do GitHub:

- Dados básicos do repositório.
- Commits.
- Releases.
- Pull requests, incluindo abertas e encerradas.
- Perfis associados aos registros, quando disponíveis.

Cada evento mantém um link para sua página original no GitHub.

## Como as datas são interpretadas

Uma linha do tempo mistura tipos diferentes de registro. Por isso, o RASTRO identifica o significado da data em cada evento:

| Registro | Data usada |
| --- | --- |
| Repositório | Criação do repositório |
| Commit | Data de autoria registrada no commit |
| Release | Data de publicação |
| Pull request criada | Data de abertura |
| Pull request integrada | Data de merge |
| Pull request encerrada sem merge | Data de encerramento |

Uma pull request integrada aparece como abertura e integração. Quando é encerrada sem merge, aparece como abertura e encerramento. O RASTRO não trata esses acontecimentos como equivalentes.

## Marcos

Os marcos são calculados sobre os dados recuperados. Entre eles estão a criação do repositório, o commit mais antigo encontrado, a primeira release, a primeira pull request, a primeira integração e o mês com mais commits na amostra.

A identificação da primeira contribuição de outro perfil depende do login associado ao commit pela API. Commits sem perfil associado não entram nesse cálculo.

O mês mais ativo é uma contagem de commits por mês. Não é uma medida de esforço, produtividade ou tempo trabalhado.

## Limites da amostra

O backend consulta até 10 páginas de 100 itens para cada categoria de commits, releases e pull requests. Isso significa um limite de 1.000 registros por categoria nesta versão.

Repositórios antigos ou movimentados podem ter registros anteriores ao limite consultado. Portanto, expressões como “primeiro commit encontrado” e “release mais antiga encontrada” descrevem a amostra recuperada, não uma garantia de que o evento seja o primeiro de toda a história.

A API pública do GitHub também pode limitar requisições. Quando isso acontece, o RASTRO informa que a consulta deve ser tentada novamente mais tarde.

## O que o RASTRO não afirma

- Não deduz a intenção por trás de commits ou pull requests.
- Não mede esforço individual a partir da quantidade de commits.
- Não garante que todos os registros históricos foram recuperados.
- Não altera o repositório consultado.
- Não mantém um banco próprio com o histórico dos projetos.

O objetivo é apresentar evidências verificáveis, deixar as limitações visíveis e facilitar a navegação até a fonte.
