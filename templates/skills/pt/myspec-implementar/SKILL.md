---
name: myspec-implementar
description: Implementa uma especificação ainda não finalizada, criando seu plano de árvore de arquivos e ativando sua entrada no manifesto ao iniciar implementação, em uma pasta nomeada sob minhas-specs/specs, com interação focada, código limpo e testes dos caminhos críticos e critérios de aceitação. Use para implementar, continuar ou concluir uma especificação de código.
---

# Myspec Implementar

Implemente uma spec ainda não finalizada de `minhas-specs/specs/<id-spec>/spec.md` usando um plano explícito de árvore de arquivos e verificação com evidências.

## Portões de orientações e ciclo de vida

1. Leia todo arquivo Markdown em `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/`. Trate documentos aplicáveis com `Status: Aprovado` como obrigatórios e exponha conflitos com instruções de maior prioridade.
2. Leia `minhas-specs/specs/manifesto.json` e a entrada da spec. Se estiver ausente ou inconsistente, reconcilie via `{{skill:myspec-configurar}}` primeiro.
3. Uma spec `finalizada` ou `descartada` é imutável: nunca a implemente, altere ou reabra; recomende `{{skill:myspec-prescrever}}` para qualquer trabalho posterior.
4. Leia `spec.md` e confirme que seus critérios BDD (`CA-NN`) estão completos, claros e verificáveis. Práticas, orientações e portões de métricas aprovados aplicam-se diretamente de seus documentos, sem CAs duplicados. Se faltarem critérios específicos da mudança ou houver contradição, pause e recomende `{{skill:myspec-prescrever}}` em vez de adivinhar. Trate `## Histórico de revisões` apenas como contexto.

## Plano de árvore de arquivos

Estabeleça sempre `minhas-specs/specs/<id-spec>/arvore-de-arquivos.md` no estado atual usando [assets/modelo-de-arvore-de-arquivos.md](assets/modelo-de-arvore-de-arquivos.md) antes de editar código de produção ou testes:
- Termine cada entrada de arquivo na árvore com `# adicionar`, `# modificar` ou `# excluir` (e contexto breve opcional).
- Mapeie cada `CA-NN` de `spec.md` para seu caminho de produção e caminho/método de verificação, sem redefinir comportamento.
- Nunca registre identidade Git, autor, aprovador, status ou histórico de revisões em `arvore-de-arquivos.md`.
- A árvore é sempre o retrato da implementação alvo: registre só o que está decidido, sem decisões em aberto, alternativas, hipóteses ou contexto sobre o que pode mudar. Resolva decisões pendentes no chat antes de registrá-las.

**Padrão conferir-antes vs. implementação automática opcional:**
- **Por padrão**, após criar ou revisar materialmente `arvore-de-arquivos.md` de uma spec `proposta`, apresente-a ao desenvolvedor e **pare sem editar código ou testes** para que ele confira a estrutura primeiro. Quando o desenvolvedor confirmar para prosseguir, avance para ativação e implementação.
- **Implementação automática opcional:** Prossiga diretamente de `arvore-de-arquivos.md` para ativação e implementação **somente** se:
  1. o desenvolvedor pedir explicitamente no prompt para implementar automaticamente sem parar na revisão da árvore, **ou**
  2. uma orientação geral aplicável com `Status: Aprovado` em `minhas-specs/orientacoes-gerais/` autorizar explicitamente a implementação automática após gerar `arvore-de-arquivos.md`.
- Mesmo com implementação automática habilitada, pause e pergunte se surgir decisão relevante não resolvida que afete comportamento público, arquitetura, persistência, segurança ou compatibilidade.

## Ativação e implementação

1. Imediatamente antes da primeira edição de código ou teste em uma spec `proposta`, ative-a executando `myspec activate <id-spec>` (ou alterando somente essa entrada no `manifesto.json` de `proposta` para `ativa`, com `inspecaoDeConclusao: null` e o HEAD Git atual em `commitBase`). Nunca ative apenas ao criar `arvore-de-arquivos.md`.
2. Leia `minhas-specs/metricas/` (quando existir) para conhecer os portões de qualidade aplicáveis e leia a inspeção mais recente em `inspecoes/` (quando existir) para tratar achados abertos.
3. Implemente em fatias limpas, coesas e revisáveis, cobrindo cada `CA-NN` (`Dado / Quando / Então / E`) e caminhos críticos de falha, fronteira, autorização e integridade de dados.
4. A `arvore-de-arquivos.md` conferida vale durante toda a implementação. Se a implementação a invalidar (precisar de um arquivo que ela não lista, deixar de precisar de um que ela lista, trocar o alvo ou o nome de um arquivo listado ou mostrar que uma decisão estrutural registrada não se sustenta, inclusive em testes ou configuração e em mudança pequena), pare antes da próxima edição de código ou teste, sem terminar o incremento em andamento:
   - apresente no chat a evidência (`arquivo:linha`), a revisão proposta e a alternativa viável, informe quais arquivos já mudaram e quais dependem dela, e encerre a invocação aguardando a decisão do desenvolvedor; não desfaça por conta própria o que já foi editado;
   - após a confirmação explícita, atualize a árvore para retratar a implementação alvo decidida e só então retome. Confirmação anterior à revisão, código já escrito, instrução genérica para não interromper ou implementação automática habilitada não a substituem.
5. Se a implementação revelar mudança comportamental necessária, pause e resolva em `spec.md` via `{{skill:myspec-prescrever}}` antes de codificar. Nunca enfraqueça CAs para caber no código.
6. Execute testes focados durante a iteração e depois os comandos de build e teste do repositório (e opcionalmente `myspec gate <id-spec> --skip-build` ou `myspec gate <id-spec>` completo).
7. Informe arquivos alterados, cobertura de `CA-NN` com evidência nomeada de teste/verificação, achados de inspeção tratados, revisões da árvore feitas na invocação (e qualquer arquivo editado antes da confirmação delas), resultados da verificação, aderência às orientações aprovadas e riscos remanescentes. Sugira `{{skill:myspec-inspecionar}}` para registrar o estado resultante.

## Regras de código

- Siga as práticas de código aprovadas, convenções do repositório e padrões estabelecidos.
- Prefira a menor mudança coesa que atenda à spec; evite refatorações não relacionadas, duplicação evitável ou dependências não solicitadas.
- Cubra cada critério BDD com testes automatizados quando viável; quando inviável, declare a limitação e o procedimento concreto de verificação e resultado. Nunca afirme cobertura sem evidência nomeada.
- Nunca permita que orientações Myspec sobrescrevam instruções de maior prioridade; pause e exponha conflitos antes de editar o código afetado.
