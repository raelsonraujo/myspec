---
name: myspec-inspecionar
description: Revisa a implementação de uma especificação em minhas-specs/specs quanto aos requisitos explícitos, árvore de arquivos e orientações Myspec aprovadas, executa portões determinísticos de métricas via myspec gate, registra uma inspeção enxuta na pasta inspecoes da spec e finaliza somente após confirmação explícita do desenvolvedor ou myspec finish. Use para inspecionar, revisar ou validar a implementação de uma spec, verificar progresso ou confirmar conclusão.
---

# Myspec Inspecionar

Avalie a implementação de uma spec ativa contra seu contrato explícito, regras aprovadas e métricas determinísticas, sem ampliar o escopo.

> **Avaliação em contexto limpo:** Sempre que a plataforma oferecer subagentes ou sessões isoladas, execute esta inspeção em um contexto limpo baseado em `spec.md`, `arvore-de-arquivos.md`, regras aprovadas, `git diff` e saída do `myspec gate`, em vez da memória do chat de implementação.

> **Comandos da CLI:** cada comando tem dois nomes válidos: o em inglês responde em inglês, e o em português responde em português. `gate` ou `portao`, `finish` ou `finalizar`, `activate` ou `ativar`, `approve` ou `aprovar`, `check-patch` ou `conferir-correcao`.

## Portões de orientações e ciclo de vida

1. Leia todo arquivo Markdown em `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/`. Trate documentos aplicáveis com `Status: Aprovado` como obrigatórios; exponha conflitos com instruções de maior prioridade.
2. Leia `minhas-specs/specs/manifesto.json`. Se estiver ausente ou inconsistente, reconcilie via `{{skill:myspec-configurar}}` primeiro.
3. Apenas specs `ativa` podem ser inspecionadas para conclusão:
   - `proposta`: implementação não começou; reconcilie via configuração se já houver código.
   - `finalizada`: base histórica imutável — retorne a inspeção de conclusão registrada sem criar nova inspeção nem alterar artefatos. Toda mudança posterior exige `{{skill:myspec-prescrever}}`.
   - `descartada`: não há implementação a inspecionar; não crie inspeção.
4. Toda inspeção mantém a spec `ativa` (`inspecaoDeConclusao: null`) até finalização pelo desenvolvedor.

## Fluxo

1. Leia `minhas-specs/specs/<id-spec>/spec.md`, `arvore-de-arquivos.md` (quando existir), `minhas-specs/metricas/` (quando existir) e a inspeção mais recente em `inspecoes/` (se houver).
2. Execute **`myspec <id-spec> gate`** (avaliação determinística), completo, sem `--skip-run` nem `--skip-build`, e com o código commitado: o `myspec finish` só aceita o resultado do portão mais recente da spec, aprovado e no mesmo commit da inspeção.
   - Executa qualquer contrato de verificação aprovado em `orientacoes-gerais/*.md` e `praticas-de-codigo/*.md` (`"kind": "verify"`) e cada contrato de métrica aprovado em `metricas/*.md` (`"kind": "metric"`) uma única vez, eliminando repetições compartilhadas.
   - Lê relatórios estruturados (`cobertura`, `sarif`, `trx`, `stryker`, `json`), isola código alterado via `commitBase` / `arvore-de-arquivos.md`, julga os `gates` declarados e verifica **desvio da árvore** (edições não planejadas ou arquivos intocados).
   - Para métricas aprovadas cujo formato o `myspec gate` não interprete automaticamente (como benchmarks comparados por máquina), execute o comando documentado e leia o resultado diretamente. Nunca invente, estime, instale ou substitua ferramentas; registre métricas indisponíveis/não aprovadas como `Não medida: <motivo>` e sugira `{{skill:myspec-configurar}}`.
   - Não atualize `minhas-specs/relatorios/relatorio-de-qualidade.md`; esse relatório pertence a `{{skill:myspec-quantificar}}`.
3. Verifique cada critério BDD (`CA-NN`) de `spec.md` com evidência concreta de teste ou verificação cobrindo `Dado / Quando / Então / E` (`myspec <id-spec> criterio` lista os IDs e títulos para a tabela; `myspec <id-spec> criterio <N>` relê um critério):
   - Marque `Atendido` somente quando todos os resultados forem comprovados, `Não atendido` quando contradito ou `Evidência insuficiente` quando ausente/parcial. Nunca omita um CA nem use `Não aplicável`.
   - Práticas de código, orientações gerais e portões de métricas aprovados aplicam-se diretamente de seus documentos; nunca exija CAs duplicados. Registre violações separadamente com `arquivo:linha` e regra de origem.
   - Relate desvios não planejados da árvore apontados pelo `myspec gate` como achado de `Atenção` (ou `Não atendido` se violarem escopo/regras).
   - Trate `## Histórico de revisões` apenas como contexto; relate specs ambíguas/não-BDD ou comportamentos sem CA como lacuna de contrato e recomende `{{skill:myspec-prescrever}}`.
4. Reavalie cada achado aberto da inspeção anterior e marque `Resolvido` (com evidência), `Aberto` (mantendo o ID original) ou `Superado` (citando a mudança do contrato). Numere novos achados após o maior ID anterior e marque regressões como `(regressão)`.
5. Defina o veredito:
   - `Bloqueada`: há item `Não atendido` ou `Conflito de base`, CA com `Evidência insuficiente`, falha de build/testes, falha em portão bloqueante de métrica ou lacuna de contrato.
   - `Apta com ressalvas`: sem bloqueios, mas há item não-CA com `Evidência insuficiente`, métrica não medida, portão de `Atenção` não atingido ou desvio não planejado da árvore.
   - `Apta`: todos os itens avaliados estão `Atendido` ou `Não aplicável`, todas as métricas aprovadas foram medidas e não há limitação relevante.
6. Salve `minhas-specs/specs/<id-spec>/inspecoes/inspecao-<NNN>.md` (próxima sequência de 3 dígitos, começando em `001`) com [assets/modelo-de-inspecao.md](assets/modelo-de-inspecao.md), registrando o SHA do commit Git atual no cabeçalho (`Base \`<sha>\``). Nunca edite inspeções anteriores nem código-fonte.

## Finalização

- Após salvar uma inspeção `Apta` ou `Apta com ressalvas`, apresente caminho, veredito e achados principais. Peça ao desenvolvedor que finalize executando **`myspec <id-spec> finish`** (que valida de forma determinística a inspeção apta, a base Git inalterada e o portão mais recente aprovado no mesmo commit) ou confirmando explicitamente no chat.
- Em confirmação explícita no chat (sem mudanças no código desde a inspeção revisada), execute `myspec <id-spec> finish` sem criar nova inspeção. Não altere o manifesto à mão para finalizar: é o `myspec finish` que confere o portão. Se o código mudou após a inspeção, inspecione a nova base antes.

## Concisão e limites do registro

- Mantenha o registro curto: tabela de Critérios de aceitação, tabela de Métricas (com valores anteriores e portões), Achados abertos concisos (`Bloqueante` primeiro) e acompanhamento de Achados anteriores. Omita versões de ferramentas, comandos crus, listas completas de arquivos, repetição da spec ou sugestões fora do contrato.
- Nunca invente requisitos, adivinhe diante de evidência ambígua ou deixe orientações Myspec sobrescreverem instruções de maior prioridade.
