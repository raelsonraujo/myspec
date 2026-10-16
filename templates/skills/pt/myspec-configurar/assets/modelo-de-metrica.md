# <Nome da métrica>

Status: Proposto

Criado por: `<git user.name> <git user.email>`

Criado em: `<data>`

## Definição

<O que a métrica mede, sua unidade e granularidade, como por método, por arquivo ou total do projeto.>

## Contexto de execução

- Diretório de trabalho: `<caminho relativo ao repositório>`
- Comando de restauração/bootstrap: `<comando ou Nenhum>`
- Comandos pré-requisito: `<build ou outros comandos que precisam ter sucesso antes da medição, em ordem, ou Nenhum>`
- Fonte de versão: `<manifesto, lock file, arquivo de projeto ou versão explícita>`

## Medição

- Ferramenta: `<nome>`
- Versão: `<versão fixada ou fonte controlada>`
- Instalação ou restauração: `<comando ou mecanismo do repositório>`
- Comando de medição: `<comando exato>`
- Formato e caminho do resultado: `<formato>`; `<caminho relativo>`
- Escopo: `<projetos, caminhos ou seleção>`
- Exclusões: `<código gerado, padrões ou Nenhum>`
- Isolamento de código alterado: `<método>`
- Valores registrados: `<valores que toda inspeção e relatório de qualidade registram, ex.: total do projeto e pior local>`

## Portões

<Uma linha por meta aprovada pelo desenvolvedor para um valor registrado, ou `Nenhum`. Nunca infira um limite.>

| Valor registrado | Limite | Aplica-se a | Efeito |
| --- | --- | --- | --- |
| <valor registrado> | `<comparação e limite>` | <Código alterado / Projeto / Ambos> | <Bloqueante / Atenção> |

<Opcional: como ler os portões em conjunto ou exceções aprovadas pelo desenvolvedor.>

## Documentos relacionados do contrato

- `<orientação geral aprovada da qual a métrica depende, ou Nenhum>`

## Decisões e contrapartidas

- `<decisão>`: <motivo e alternativa rejeitada, quando relevante>.

## Histórico de aprovação

- Aprovado por: `<git user.name> <git user.email>`
- Aprovado em: `<data>`
- Contexto da aprovação: `<descrição concisa da métrica ou revisão aprovada>`
