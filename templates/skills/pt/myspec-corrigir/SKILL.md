---
name: myspec-corrigir
description: Faz um ajuste de código pequeno e delimitado, de no máximo três arquivos, sem exigir nova especificação ou árvore Myspec, preservando diretrizes de produto aprovadas, o contrato de spec já implementada que tocar, orientações do repositório e verificação automatizada proporcional. Use para correção, limpeza, ajuste pontual ou tratamento de achados de inspeção de uma spec já implementada.
---

# Myspec Corrigir

Faça uma pequena mudança com a disciplina da implementação Myspec, sem criar nem exigir especificação ou árvore de arquivos.

## Portão obrigatório de orientações

Antes de avançar além da descoberta somente-leitura, leia todos os Markdown em `my-specs/product-directives/`, `my-specs/coding-practices/` e `my-specs/general-guidelines/`. Documentos aplicáveis com `Status: Approved` são obrigatórios; cumpra-os antes da ação correspondente e exponha conflitos superiores. Ausências, documentos não aprovados ou `None` não restringem; informe limitações relevantes.

Diretrizes de produto aprovadas definem vocabulário e invariantes. Trate-as como restrições, não conselho opcional. Se houver conflito com a solicitação, pare antes de editar e peça alteração ou use `{{skill:myspec-configurar}}` para revisar e aprovar a diretriz.

## Portão de escopo

1. Leia solicitação, instruções do repositório e código afetado antes de editar.
2. Identifique as specs em `my-specs/specs` cujo escopo a mudança afeta: a nomeada pelo desenvolvedor ou aquela cujo `spec.md` ou `file-tree.md` cobre o comportamento ou os arquivos afetados. Para cada uma, leia `spec.md`, `file-tree.md` quando existir e a inspeção de maior número em `inspections/`, quando existir.
3. Conte os arquivos que a mudança precisa adicionar, modificar ou excluir, incluindo testes.
4. Recomende `{{skill:myspec-implementar}}` em vez de corrigir quando a mudança exigir mais de três arquivos ou afetar uma spec cujo `file-tree.md` não existe ou não tem entrada no histórico de aprovação, ou seja, que ainda não foi implementada. Se exigir mais de três arquivos e nenhuma spec a cobrir, recomende `{{skill:myspec-prescrever}}` para criá-la antes.
5. Se a mudança não for coberta por spec existente e alterar comportamento público, arquitetura, persistência, segurança, compatibilidade ou exigir decisão não resolvida por diretriz aprovada, pause e recomende `{{skill:myspec-prescrever}}`.
6. Caso contrário, corrija. Um ajuste pode alterar código no escopo de uma spec já implementada, por exemplo para tratar achados da inspeção mais recente. Preserve os critérios de aceitação e as responsabilidades da árvore aprovada dessa spec e informe todo arquivo tocado fora dela. Não amplie silenciosamente o ajuste; se a contagem de arquivos ou as specs afetadas mudarem durante o trabalho, reaplique este portão.

## Implementação

Após o portão, leia `my-specs/tooling.md` quando existir. Identifique comportamento pedido, diretrizes afetadas e caminhos de sucesso, falha, limites, autorização e integridade de dados; declare suposições conservadoras e pergunte se uma escolha não resolvida alterar comportamento observável. Antes de editar, informe a pequena mudança pretendida. Implemente a menor mudança coesa, em fatias revisáveis; siga padrões estabelecidos, acrescente ou atualize testes focados viáveis e execute testes focados, seguidos de build/testes mais amplos quando proporcionais. Informe arquivos, evidência nomeada da cobertura, resultados, conformidade, suposições e riscos. Se o ajuste tocou uma spec implementada, cite os achados de inspeção tratados e sugira `{{skill:myspec-inspecionar}}` para registrar o novo estado.

## Regras de código

- No máximo uma classe, record, struct ou interface de nível superior por arquivo, salvo exceções geradas ou estabelecidas.
- Prefira a menor mudança que satisfaça integralmente a solicitação; não acrescente refatorações ou dependências sem relação.
- Não alegue cobertura sem evidência de teste ou verificação nomeada. Não deixe orientações Myspec sobrepor instruções superiores.
