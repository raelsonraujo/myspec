---
name: myspec-configurar
description: Configura ou revisa o contrato Myspec de todo o repositório, pedindo ao desenvolvedor que defina as métricas de qualidade e suas ferramentas, diretrizes de produto, práticas de código e orientações compartilhadas. Use antes de medir qualidade ou quando esses contratos precisarem mudar.
---

# Myspec Configurar

Estabeleça um contrato reprodutível e aprovado pelo desenvolvedor para os skills Myspec.

## Portão obrigatório de orientações

Antes de avançar além da descoberta inicial do repositório, leia todos os arquivos Markdown existentes em `minhas-specs/diretrizes-de-produto/`, `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/`. Todo documento aplicável com `Status: Aprovado` é obrigatório: cumpra sua regra antes da ação que ela rege e exponha conflitos com instruções de maior prioridade. Pasta ou arquivo ausente, documento não aprovado ou seção marcada explicitamente como `Nenhum` não impõe restrição; informe a limitação quando for relevante.

## Fluxo de trabalho

1. Inspecione manifestos, projetos de teste, arquivos de ferramentas locais, scripts de build e CI. Não instale nem modifique ferramentas.
2. Após o portão obrigatório, leia `minhas-specs/ferramentas.md` quando existir.
3. Peça os comandos exatos de build e teste que verificam o repositório e quais métricas de qualidade o Myspec deve medir. O conjunto de métricas é exatamente o que o desenvolvedor definir: nunca suponha, infira nem adote por padrão métrica alguma a partir da stack, de ferramentas existentes ou de práticas comuns. Ofereça candidatas somente se o desenvolvedor pedir. Não definir métrica alguma é válido; registre isso explicitamente.
4. Para cada métrica escolhida, peça: o que mede, unidade e granularidade (por método, por arquivo, total do projeto etc.); ferramenta e versão fixada; mecanismo de instalação/restauração; comando exato; formato e caminho do resultado; escopo e exclusões; como isolar o código alterado por uma spec dos valores do projeto; os valores que toda inspeção e relatório de qualidade devem registrar; e a orientação aprovada que a interpreta, se houver. Metas e limites pertencem a uma orientação geral, nunca a uma suposição.
5. Pergunte se devem ser definidas ou revistas diretrizes de produto, práticas de código e orientações gerais. Registre cada regra concreta conforme os modelos em `assets/`; se não houver regras conhecidas, deixe a pasta ausente ou vazia e declare isso.
6. Quando útil, ofereça candidatos compatíveis com o repositório e suas contrapartidas, exceto métricas, que seguem o passo 3. Derive diretrizes de produto da entrada do desenvolvedor, artefatos aprovados e comportamento de domínio estabelecido; identifique inferências que ainda exigem confirmação.
7. Crie ou atualize os documentos do contrato como `Proposto`, com criador e data obtidos de `git config user.name` e `git config user.email`. Use `Histórico de aprovação`: `ferramentas.md`, diretrizes, uma prática por arquivo e uma orientação por arquivo devem usar os respectivos modelos.
8. Apresente a proposta completa e peça aprovação ou revisões explícitas. Encerre sem marcá-la como aprovada.
9. Em invocação posterior, incorpore revisões ou, após aprovação explícita, altere o status para `Aprovado`. Acrescente uma entrada com aprovador, data e contexto; nunca substitua entradas antigas nem os metadados de criação.

## Regras do contrato

- Considere `minhas-specs` relativo à raiz do repositório; mantenha comandos executáveis a partir de um diretório documentado.
- Fixe versões ou documente sua fonte controlada, exclusões de código gerado/padrões e o isolamento dos arquivos alterados nas métricas.
- Registre somente as métricas definidas pelo desenvolvedor, cada uma em sua seção sob `## Métricas`. Os demais skills Myspec medem exatamente essas métricas e nenhuma outra.
- Mantenha as ferramentas em `minhas-specs/ferramentas.md`; diretrizes, práticas e orientações devem ficar em arquivos Markdown separados nas respectivas pastas, com nome conciso em kebab-case, status e histórico de aprovação próprios.
- Mantenha práticas acionáveis e específicas; diretrizes de produto breves, voltadas a conceitos, terminologia, políticas e invariantes observáveis — não técnica de implementação ou arquitetura.
- Diretrizes de produto aprovadas restringem especificações e implementações futuras: `{{skill:myspec-prescrever}}`, `{{skill:myspec-implementar}}` e `{{skill:myspec-corrigir}}` devem preservá-las. Se houver conflito, exija sua revisão e aprovação antes de implementar.
- Não considere silêncio, ferramenta existente ou comando bem-sucedido como aprovação. Não instale dependências nem altere configuração sem autorização separada. Não deixe este contrato sobrepor instruções de maior prioridade.
