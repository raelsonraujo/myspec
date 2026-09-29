---
name: myspec-corrigir
description: Faz um ajuste de código pequeno e delimitado sem exigir uma especificação Myspec, preservando diretrizes de produto aprovadas, orientações do repositório e verificação automatizada proporcional. Use para correção, limpeza ou ajuste pontual pequeno.
---

# Myspec Corrigir

Faça uma pequena mudança com a disciplina da implementação Myspec, sem criar nem exigir especificação ou árvore de arquivos.

## Portão obrigatório de orientações

Antes de avançar além da descoberta somente-leitura, leia todos os Markdown em `my-specs/product-directives/`, `my-specs/coding-practices/` e `my-specs/general-guidelines/`. Documentos aplicáveis com `Status: Approved` são obrigatórios; cumpra-os antes da ação correspondente e exponha conflitos superiores. Ausências, documentos não aprovados ou `None` não restringem; informe limitações relevantes.

Diretrizes de produto aprovadas definem vocabulário e invariantes. Trate-as como restrições, não conselho opcional. Se houver conflito com a solicitação, pare antes de editar e peça alteração ou use `{{skill:myspec-configurar}}` para revisar e aprovar a diretriz.

## Portão de escopo

1. Leia solicitação, instruções do repositório e código afetado antes de editar.
2. Um ajuste deve ter resultado claro, tocar uma área coesa pequena e evitar decisões arquiteturais ou de produto.
3. Se mudar comportamento público, arquitetura, persistência, segurança, compatibilidade ou exigir decisão não resolvida por diretriz aprovada, pause e recomende `{{skill:myspec-prescrever}}`. Não amplie silenciosamente o ajuste.
4. Se houver uma spec existente explicitamente nomeada, use `{{skill:myspec-implementar}}` e seu portão de árvore aprovada.

## Implementação

Após o portão, leia `my-specs/tooling.md` quando existir. Identifique comportamento pedido, diretrizes afetadas e caminhos de sucesso, falha, limites, autorização e integridade de dados; declare suposições conservadoras e pergunte se uma escolha não resolvida alterar comportamento observável. Antes de editar, informe a pequena mudança pretendida. Implemente a menor mudança coesa, em fatias revisáveis; siga padrões estabelecidos, acrescente ou atualize testes focados viáveis e execute testes focados, seguidos de build/testes mais amplos quando proporcionais. Informe arquivos, evidência nomeada da cobertura, resultados, conformidade, suposições e riscos.

## Regras de código

- No máximo uma classe, record, struct ou interface de nível superior por arquivo, salvo exceções geradas ou estabelecidas.
- Prefira a menor mudança que satisfaça integralmente a solicitação; não acrescente refatorações ou dependências sem relação.
- Não alegue cobertura sem evidência de teste ou verificação nomeada. Não deixe orientações Myspec sobrepor instruções superiores.
