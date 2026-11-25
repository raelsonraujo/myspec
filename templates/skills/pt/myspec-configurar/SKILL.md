---
name: myspec-configurar
description: Inicializa ou reconcilia o manifesto do ciclo de vida das specs, ou configura ou revisa o contrato Myspec de todo o repositório, pedindo ao desenvolvedor que defina as métricas de qualidade com suas ferramentas e portões, práticas de código e orientações compartilhadas. Use quando o manifesto estiver ausente ou precisar de reconciliação, antes de medir qualidade, quando minhas-specs/metricas estiver ausente ou ainda for um único ferramentas.md, ou quando esses contratos precisarem mudar.
---

# Myspec Configurar

Estabeleça um contrato reproduzível e aprovado pelo desenvolvedor para o workspace Myspec (`minhas-specs/`, relativo à raiz do repositório).

> **Comandos da CLI:** cada comando tem dois nomes válidos: o em inglês responde em inglês, e o em português responde em português. `gate` ou `portao`, `finish` ou `finalizar`, `activate` ou `ativar`, `approve` ou `aprovar`, `check-patch` ou `conferir-correcao`, `read` ou `ler`, `inspection` ou `inspecao`, `rule` ou `regra`, `metric` ou `metrica`.

## Portão de orientações

Leia toda regra em `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/` (rode `myspec regra -f`, ou `myspec regra` / `myspec regra <nome>`). Trate cada documento aplicável com `Status: Aprovado` como obrigatório e exponha conflitos com instruções de maior prioridade. Arquivos não aprovados, pastas ausentes ou seções `Nenhum` não criam restrição.

## Fluxo

Inicialize ou reconcilie `minhas-specs/specs/manifesto.json` primeiro quando estiver ausente ou inconsistente; um pedido apenas para construir o manifesto não exige redefinir métricas ou orientações.

1. Inspecione manifestos do repositório, projetos de teste, ferramentas locais, scripts de build e CI sem instalar ou alterar dependências.
2. Leia toda métrica em `minhas-specs/metricas/` (rode `myspec metrica -f`, quando existir). Se existir o legado `minhas-specs/ferramentas.md`, proponha dividi-lo (veja [Contrato legado de ferramentas](#contrato-legado-de-ferramentas)).
3. Peça ao desenvolvedor os comandos exatos de build e teste e registre-os em uma orientação geral (como `minhas-specs/orientacoes-gerais/comandos-de-build-e-teste.md`) com um bloco ```` ```json myspec ```` (`{"kind":"verify","workingDir":".","commands":[...]}`) para execução determinística no `myspec gate`. No bloco que executa os testes, seja `verify` ou de métrica, declare em `testResults` onde ficam os resultados (`{"format":"trx","paths":[...],"skipped":"attention"}` ou `"blocking"`): o `myspec gate` os lê em toda execução, mostra a contagem e bloqueia com teste reprovado, com passo que falhou ou com resultado ausente. Qualquer orientação geral ou prática de código aprovada pode trazer o próprio bloco `verify` quando sua regra for conferível por comando que termine com código diferente de zero na violação; o `myspec gate` executa as orientações e depois as práticas, cada pasta em ordem de nome, e qualquer falha bloqueia. Em seguida, pergunte quais métricas de qualidade medir. Nunca suponha, infira ou adote métrica por padrão; sugira candidatas apenas quando solicitado. Não definir métricas é válido.
4. Para cada métrica escolhida, registre: definição (unidade e granularidade), diretório de trabalho, comandos de restauração/pré-requisito, ferramenta e versão fixada, comando exato de medição, formato estruturado e caminho do resultado, escopo/exclusões, isolamento do código alterado, valores registrados, `## Portões` explícitos e o bloco ```` ```json myspec ```` correspondente (`"kind":"metric"`, com os passos da medição em `commands`, formatos `cobertura`, `sarif`, `trx`, `stryker`, `json` ou `manual`) para avaliação determinística no `myspec gate`.
5. Pergunte se deseja adicionar práticas de código em `minhas-specs/praticas-de-codigo/` e orientações gerais em `minhas-specs/orientacoes-gerais/` (por exemplo, substituir o limite de arquivos de correção ou autorizar implementação automática após gerar `arvore-de-arquivos.md`).
6. Crie ou atualize documentos do contrato com `Status: Proposto`, usando `git config user.name` e `git config user.email` em `Criado por` e `Criado em` imutáveis:
   - métricas: um arquivo por métrica com [assets/modelo-de-metrica.md](assets/modelo-de-metrica.md)
   - orientações gerais: um arquivo por orientação com [assets/modelo-de-orientacao-geral.md](assets/modelo-de-orientacao-geral.md)
   - práticas de código: um arquivo por prática com [assets/modelo-de-pratica-de-codigo.md](assets/modelo-de-pratica-de-codigo.md)
7. Apresente a proposta completa e peça aprovação explícita ou revisões. Não marque documentos como aprovados sem confirmação explícita.
8. O desenvolvedor pode aprovar de forma determinística com `myspec aprovar <arquivo-ou-caminho> -c "<contexto>"` (aceita apenas o nome do arquivo, caminho relativo ou caminho absoluto), ou aprovar explicitamente em outra chamada para você mudar para `Status: Aprovado` e acrescentar uma entrada (`Aprovado por`, `Aprovado em`, `Contexto da aprovação`) sem alterar entradas anteriores nem metadados de criação.

## Manifesto de specs

Mantenha `minhas-specs/specs/manifesto.json` (separado do `minhas-specs/myspec.json` da CLI) usando [assets/modelo-de-manifesto-de-specs.json](assets/modelo-de-manifesto-de-specs.json). Esquema:
`{"versao":1,"especificacoes":[{"identificador":"001-exemplo","situacao":"proposta","inspecaoDeConclusao":null,"commitBase":null}]}` (`commitBase` é opcional).

O ciclo só avança `proposta → ativa → finalizada`, e uma spec `proposta` pode terminar em `descartada`:
- `proposta`: implementação não começou (criar `arvore-de-arquivos.md` não ativa a spec).
- `ativa`: implementação iniciada (`myspec <id> activate` registra `commitBase` imediatamente antes da primeira edição de código/teste).
- `finalizada`: concluída via `myspec <id> finish` ou confirmação explícita do desenvolvedor após inspeção `Apta` ou `Apta com ressalvas` (`Ready` ou `Ready with observations` em registros migrados); `inspecaoDeConclusao` guarda a sequência de três dígitos (`"002"`), ou `null` nos demais estados.
- `descartada`: o desenvolvedor decidiu explicitamente não implementar uma spec `proposta`. É situação final, com `inspecaoDeConclusao: null`; a pasta e o `spec.md` ficam como registro, e o identificador não é reutilizado.

Ao reconciliar manifesto ausente ou specs não rastreadas:
- Inspecione cada spec (`myspec <id> ler`), `arvore-de-arquivos.md`, inspeção mais recente (`myspec <id> inspecao` ou `-s` para o veredito), código/testes e histórico Git.
- Atribua `finalizada` somente com confirmação explícita do desenvolvedor sobre a inspeção mais recente apta; `ativa` quando a implementação começou sem confirmação; `proposta` apenas quando não começou; `descartada` somente com decisão explícita do desenvolvedor de não implementar. Pergunte se a evidência for ambígua.
- Preserve entradas existentes, referências de conclusão e campos personalizados; nunca rebaixe situações, reinicie o manifesto ou reabra specs `finalizada` ou `descartada`. Relate dados malformados ou conflitos em vez de sobrescrevê-los.
- Specs finalizadas e descartadas, árvores, inspeções e entradas de conclusão são bases históricas imutáveis; qualquer impacto posterior exige nova spec via `{{skill:myspec-prescrever}}`.

## Regras do contrato

- Mantenha comandos diretamente executáveis, versões fixadas, exclusões explícitas e limites apenas em `## Portões` de cada métrica.
- Torne cada prática e orientação exigível diretamente de seu documento (aplicabilidade, regra e verificação), sem duplicação em critérios de aceitação.
- Use nomes em kebab-case concisos e resolva todo marcador antes da aprovação.
- Nunca instale dependências, altere configurações do projeto ou permita que orientações Myspec sobrescrevam instruções de maior prioridade.

## Contrato legado de ferramentas

Quando existir `minhas-specs/ferramentas.md`, proponha dividi-lo em um arquivo por métrica em `minhas-specs/metricas/` e `minhas-specs/orientacoes-gerais/comandos-de-build-e-teste.md` como `Proposto`, convertendo alvos em `## Portões` somente após confirmação. Exclua `minhas-specs/ferramentas.md` apenas depois que cada arquivo de métrica substituto for aprovado.
