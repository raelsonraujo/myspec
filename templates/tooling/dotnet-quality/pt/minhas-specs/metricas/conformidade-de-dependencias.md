# Conformidade de dependências

Status: Proposto

Criado por: `{{author}}`

Criado em: `{{date}}`

> Gerado por `myspec install --tooling dotnet-quality`. Instale as dependências descritas em `minhas-specs/medicao/README.md`, revise cada valor abaixo frente a este repositório e aprove esta métrica com `myspec-configurar`.

## Definição

Violações das regras de dependência aprovadas em `minhas-specs/orientacoes-gerais/regras-de-dependencia.md`, por regra: cada teste de arquitetura reprovado é uma regra violada, e sua mensagem lista os tipos e as dependências que a violam.

## Contexto de execução

- Diretório de trabalho: raiz do repositório
- Comando de restauração/bootstrap: `dotnet restore {{solution}}`
- Comandos pré-requisito: Nenhum; o comando de medição compila a solução em Release antes de executar os testes
- Fonte de versão: referência de pacote `TngTech.ArchUnitNET` e da integração com o framework de testes no projeto `*.ArchitectureTests`
- Raiz dos resultados gerados: `minhas-specs/medicao/arquitetura/` (ignorada por um `.gitignore` que o script grava nela e recriada a cada execução)

## Medição

- Executor de testes: VSTest via `dotnet test`
- Ferramenta: ArchUnitNET, nos testes do projeto `*.ArchitectureTests` marcados com `[Trait("Category", "Architecture")]`
- Versão: `TngTech.ArchUnitNET` `0.13.4` e a integração correspondente (`TngTech.ArchUnitNET.xUnit`, `TngTech.ArchUnitNET.xUnitV3`, `TngTech.ArchUnitNET.NUnit` ou `TngTech.ArchUnitNET.MSTestV2`) `0.13.4`, fixadas no projeto de testes de arquitetura
- Instalação ou restauração: siga `minhas-specs/medicao/README.md` e depois execute `dotnet restore {{solution}}`
- Comando de medição: `pwsh -NoProfile -File minhas-specs/medicao/executar-testes-de-arquitetura.ps1` ou `bash minhas-specs/medicao/executar-testes-de-arquitetura.sh`, que executam `dotnet test {{solution}} --configuration Release --filter "Category=Architecture" --logger "trx;LogFilePrefix=arquitetura" --results-directory minhas-specs/medicao/arquitetura`
- Formato e caminho do resultado: um TRX por projeto de testes, com o `outcome` e a mensagem de falha de cada teste, cujo nome começa com o ID da regra; `minhas-specs/medicao/arquitetura/arquitetura_*.trx`
- Escopo: as regras aprovadas em `minhas-specs/orientacoes-gerais/regras-de-dependencia.md`, aplicadas aos assemblies de produção carregados pelos testes de arquitetura
- Exclusões: somente as exceções pontuais aprovadas na orientação de regras de dependência
- Isolamento de código alterado: execute apenas as regras cujos namespaces de origem a spec altera, repetindo `-Rules <ID>` (PowerShell, também aceita `-Rules DEP-01,DEP-02`) ou `--rule <ID>` (Bash)
- Valores registrados: quantidade de regras executadas, aprovadas e violadas; e, para cada regra violada, seu ID e os tipos e dependências citados na mensagem de falha

## Portões

| Valor registrado | Limite | Aplica-se a | Efeito |
| --- | --- | --- | --- |
| Regras de dependência violadas | `= 0` | Ambos | Bloqueante |

Cada regra é uma decisão de arquitetura aprovada pelo time, então violá-la bloqueia a inspeção, assim como um orçamento de performance estourado. Regra ausente, sem teste correspondente, é `Evidência insuficiente`. Os testes de arquitetura também rodam no `dotnet test` de `minhas-specs/orientacoes-gerais/comandos-de-build-e-teste.md`, então uma violação já reprova os testes; esta métrica acrescenta a rastreabilidade por regra.

## Documentos relacionados do contrato

- `minhas-specs/orientacoes-gerais/regras-de-dependencia.md`, que lista as regras, seus testes e suas exceções
- `minhas-specs/metricas/acoplamento.md`, que mede quantos tipos cada classe e cada membro usam, sem julgar a direção

## Decisões e contrapartidas

- Expressar as regras como testes do ArchUnitNET: elas rodam com os demais testes, em qualquer sistema operacional, sem servidor de análise.
- Manter as regras em uma orientação aprovada: a IA ainda erra fronteiras de módulos, então quem decide a arquitetura é o time, e a ferramenta só verifica.
- Registrar o ID da regra no nome do teste: o TRX não guarda traits, e o nome é o que liga cada resultado à sua regra.
- Usar portão `Bloqueante`: diferente da complexidade e do acoplamento, cada regra é um limite explícito e aprovado, não um sinal de melhoria.

## Histórico de aprovação

- Nenhuma aprovação registrada.
