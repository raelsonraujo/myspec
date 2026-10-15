---
name: myspec-configurar
description: Configura ou revisa o contrato Myspec de todo o repositório, pedindo ao desenvolvedor que defina as métricas de qualidade com suas ferramentas e portões, diretrizes de produto, práticas de código e orientações compartilhadas. Use antes de medir qualidade, quando minhas-specs/ferramentas estiver ausente ou ainda for um único ferramentas.md, ou quando esses contratos precisarem mudar.
---

# Myspec Configurar

Estabeleça um contrato reprodutível e aprovado pelo desenvolvedor para os skills Myspec.

## Portão obrigatório de orientações

Antes de avançar além da descoberta inicial do repositório, leia todos os arquivos Markdown existentes em `minhas-specs/diretrizes-de-produto/`, `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/`. Todo documento aplicável com `Status: Aprovado` é obrigatório: cumpra sua regra antes da ação que ela rege e exponha conflitos com instruções de maior prioridade. Pasta ou arquivo ausente, documento não aprovado ou seção marcada explicitamente como `Nenhum` não impõe restrição; informe a limitação quando for relevante.

## Fluxo de trabalho

1. Inspecione manifestos, projetos de teste, arquivos de ferramentas locais, scripts de build e CI. Não instale nem modifique ferramentas.
2. Após o portão obrigatório, leia todos os arquivos Markdown em `minhas-specs/ferramentas/`. Se existir o arquivo único legado `minhas-specs/ferramentas.md`, leia-o também e proponha dividi-lo conforme [Contrato de ferramentas legado](#contrato-de-ferramentas-legado).
3. Peça os comandos exatos de build e teste que verificam o repositório e registre-os na orientação geral `minhas-specs/orientacoes-gerais/comandos-de-build-e-teste.md`, que `{{skill:myspec-inspecionar}}` e `{{skill:myspec-quantificar}}` executam antes de qualquer métrica. Depois pergunte quais métricas de qualidade o Myspec deve medir. O conjunto de métricas é exatamente o que o desenvolvedor definir: nunca suponha, infira nem adote por padrão métrica alguma a partir da stack, de ferramentas existentes ou de práticas comuns. Ofereça candidatas somente se o desenvolvedor pedir. Não definir métrica alguma é válido; deixe `minhas-specs/ferramentas/` ausente ou vazia e declare que nenhuma métrica foi estabelecida.
4. Para cada métrica escolhida, peça: o que mede, unidade e granularidade (por método, por arquivo, total do projeto etc.); diretório de trabalho, comando de restauração e comandos pré-requisito, como o build, que precisam ter sucesso antes da medição; ferramenta e versão fixada; mecanismo de instalação/restauração; comando exato; formato e caminho do resultado; escopo e exclusões; como isolar o código alterado por uma spec dos valores do projeto; os valores que toda inspeção e relatório de qualidade devem registrar; e seus portões: para cada valor registrado que o desenvolvedor quer julgar, o limite, se vale para o código alterado, para o projeto ou para ambos, e o efeito. Um portão `Bloqueante` torna `Bloqueada` a inspeção cujo código alterado o descumpre; um portão `Atenção` registra o descumprimento como sinal de melhoria. Registre somente os portões que o desenvolvedor declarar; métrica sem portões é válida e é relatada sem julgamento.
5. Pergunte se devem ser definidas ou revistas diretrizes de produto, práticas de código e orientações gerais. Registre cada regra concreta conforme os modelos em `assets/`; se não houver regras conhecidas, deixe a pasta ausente ou vazia e declare isso.
6. Quando útil, ofereça candidatos compatíveis com o repositório e suas contrapartidas, exceto métricas, que seguem o passo 3. Derive diretrizes de produto da entrada do desenvolvedor, artefatos aprovados e comportamento de domínio estabelecido; identifique inferências que ainda exigem confirmação.
7. Crie ou atualize os documentos do contrato como `Proposto`, com criador e data obtidos de `git config user.name` e `git config user.email`. Use `Histórico de aprovação`. Cada métrica fica em seu próprio arquivo em `minhas-specs/ferramentas/`, a partir de [assets/modelo-de-metrica.md](assets/modelo-de-metrica.md); os comandos de build e teste, as diretrizes, uma prática por arquivo e uma orientação por arquivo usam os respectivos modelos.
8. Apresente a proposta completa e peça aprovação ou revisões explícitas. Encerre sem marcá-la como aprovada.
9. Em invocação posterior, incorpore revisões ou, após aprovação explícita, altere o status para `Aprovado`. Acrescente uma entrada com aprovador, data e contexto; nunca substitua entradas antigas nem os metadados de criação.

## Regras do contrato

- Considere `minhas-specs` relativo à raiz do repositório; mantenha comandos executáveis a partir de um diretório documentado.
- Fixe versões ou documente sua fonte controlada, exclusões de código gerado/padrões e o isolamento dos arquivos alterados nas métricas.
- Registre somente as métricas definidas pelo desenvolvedor, um arquivo Markdown por métrica em `minhas-specs/ferramentas/`. Os demais skills Myspec medem exatamente essas métricas e nenhuma outra.
- Mantenha no arquivo da métrica tudo o que é preciso para medi-la, inclusive seus portões, para que cada uma seja aprovada e revista isoladamente. Nunca defina um limite fora da seção `## Portões` da métrica que ele julga.
- Métricas, diretrizes, práticas e orientações ficam em arquivos Markdown separados nas respectivas pastas, com nome conciso em kebab-case, status e histórico de aprovação próprios.
- Mantenha práticas acionáveis e específicas; diretrizes de produto breves, voltadas a conceitos, terminologia, políticas e invariantes observáveis — não técnica de implementação ou arquitetura.
- Diretrizes de produto aprovadas restringem especificações e implementações futuras: `{{skill:myspec-prescrever}}`, `{{skill:myspec-implementar}}` e `{{skill:myspec-corrigir}}` devem preservá-las. Se houver conflito, exija sua revisão e aprovação antes de implementar.
- Não considere silêncio, ferramenta existente ou comando bem-sucedido como aprovação. Não instale dependências nem altere configuração sem autorização separada. Não deixe este contrato sobrepor instruções de maior prioridade.

## Contrato de ferramentas legado

Versões anteriores do Myspec mantinham todas as métricas em um único `minhas-specs/ferramentas.md`. Quando ele existir:

1. Proponha um arquivo por métrica em `minhas-specs/ferramentas/`, levando sem alterações definição, contexto de execução, comandos de build pré-requisito e campos de medição.
2. Proponha os comandos de build e teste da seção de verificação como `minhas-specs/orientacoes-gerais/comandos-de-build-e-teste.md`.
3. Transforme cada meta que uma orientação referenciada define para uma métrica em portões dessa métrica somente depois que o desenvolvedor confirmar limite, escopo e efeito; não altere a orientação, a menos que o desenvolvedor peça para retirá-la.
4. Crie os novos arquivos como `Proposto`, com contexto de aprovação que cite `ferramentas.md` como origem. Exclua `minhas-specs/ferramentas.md` somente depois que o desenvolvedor aprovar todos os arquivos de métrica que o substituem.
