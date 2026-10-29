---
name: myspec-corrigir
description: Faz um ajuste de código pequeno e delimitado, de no máximo cinco arquivos por padrão, com limite substituível por orientação geral aprovada do projeto, sem exigir nova especificação ou árvore Myspec, preservando o contrato de spec já implementada que tocar, orientações do repositório e verificação automatizada proporcional. Use para correção, limpeza, ajuste pontual ou tratamento de achados de inspeção de uma spec já implementada.
---

# Myspec Corrigir

Faça uma pequena mudança com a disciplina da implementação Myspec, sem criar nem exigir especificação ou árvore de arquivos.

Corrigir é a exceção ao fluxo BDD baseado em spec: um ajuste elegível é regido pela solicitação delimitada e não exige nova spec nem critérios BDD. A exceção não dispensa o contrato comportamental de uma spec existente; se a solicitação o alterar, recomende `{{skill:myspec-prescrever}}` para revisá-lo em vez de contornar seus critérios com uma correção. Mantenha os portões de escopo abaixo.

## Portão obrigatório de orientações

Antes de avançar além da descoberta somente-leitura, leia todos os Markdown em `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/`. Documentos aplicáveis com `Status: Aprovado` são obrigatórios; cumpra-os antes da ação correspondente e exponha conflitos superiores. Ausências, documentos não aprovados ou `Nenhum` não restringem; informe limitações relevantes.

## Portão de escopo

1. Leia solicitação, instruções do repositório e código afetado antes de editar.
2. Identifique as specs em `minhas-specs/specs` cujo escopo a mudança afeta: a nomeada pelo desenvolvedor ou aquela cujo `spec.md` ou `arvore-de-arquivos.md` cobre o comportamento ou os arquivos afetados. Para cada uma, leia `spec.md`, `arvore-de-arquivos.md` quando existir e a inspeção de maior número em `inspecoes/`, quando existir.
3. Conte os arquivos que a mudança precisa adicionar, modificar ou excluir, incluindo testes. O limite padrão é de cinco arquivos. Uma orientação geral aplicável do projeto com `Status: Aprovado` em `minhas-specs/orientacoes-gerais/` pode substituir esse limite de arquivos; use sua regra quando existir e, caso contrário, use cinco. Informe o limite aplicável e cite a orientação ao usar uma substituição. Essa substituição altera apenas o limite de arquivos; os demais portões de escopo continuam aplicáveis.
4. Recomende `{{skill:myspec-implementar}}` em vez de corrigir quando a mudança exceder o limite de arquivos aplicável ou afetar uma spec cujo `arvore-de-arquivos.md` não existe ou não tem entrada `Aprovado` no `Histórico de revisões`, ou seja, que ainda não foi implementada. Se exceder o limite de arquivos aplicável e nenhuma spec a cobrir, recomende `{{skill:myspec-prescrever}}` para criá-la antes.
5. Se a mudança não for coberta por spec existente e alterar comportamento público, arquitetura, persistência, segurança, compatibilidade ou exigir decisão de produto ou transversal que a solicitação não resolve, pause e recomende `{{skill:myspec-prescrever}}`.
6. Caso contrário, corrija. Um ajuste pode alterar código no escopo de uma spec já implementada, por exemplo para tratar achados da inspeção mais recente. Preserve os critérios de aceitação e as responsabilidades da árvore aprovada dessa spec e informe todo arquivo tocado fora dela. Não amplie silenciosamente o ajuste; se a contagem de arquivos ou as specs afetadas mudarem durante o trabalho, reaplique este portão.

## Implementação

Após o portão, leia os arquivos de métrica em `minhas-specs/metricas/` quando existirem, para conhecer as ferramentas e os portões que o código alterado deve cumprir. Identifique comportamento pedido e caminhos de sucesso, falha, limites, autorização e integridade de dados; declare suposições conservadoras e pergunte se uma escolha não resolvida alterar comportamento observável. Antes de editar, informe a pequena mudança pretendida. Implemente a menor mudança coesa, em fatias revisáveis; siga padrões estabelecidos, acrescente ou atualize testes focados viáveis e execute testes focados, seguidos de build/testes mais amplos quando proporcionais. Informe arquivos, evidência nomeada da cobertura, resultados, conformidade, suposições e riscos. Se o ajuste tocou uma spec implementada, cite os achados de inspeção tratados e sugira `{{skill:myspec-inspecionar}}` para registrar o novo estado.

## Regras de código

- No máximo uma classe, record, struct ou interface de nível superior por arquivo, salvo exceções geradas ou estabelecidas.
- Prefira a menor mudança que satisfaça integralmente a solicitação; não acrescente refatorações ou dependências sem relação.
- Não alegue cobertura sem evidência de teste ou verificação nomeada. Não deixe orientações Myspec sobrepor instruções superiores.
