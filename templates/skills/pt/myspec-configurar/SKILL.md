---
name: myspec-configurar
description: Inicializa ou reconcilia o manifesto do ciclo de vida das specs, ou configura ou revisa o contrato Myspec de todo o repositório, pedindo ao desenvolvedor que defina as métricas de qualidade com suas ferramentas e portões, práticas de código e orientações compartilhadas. Use quando o manifesto estiver ausente ou precisar de reconciliação, antes de medir qualidade, quando minhas-specs/metricas estiver ausente ou ainda for um único ferramentas.md, ou quando esses contratos precisarem mudar.
---

# Myspec Configurar

Estabeleça um contrato reprodutível e aprovado pelo desenvolvedor para os skills Myspec.

## Portão obrigatório de orientações

Antes de avançar além da descoberta inicial do repositório, leia todos os arquivos Markdown existentes em `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/`. Todo documento aplicável com `Status: Aprovado` é obrigatório: cumpra sua regra antes da ação que ela rege e exponha conflitos com instruções de maior prioridade. Pasta ou arquivo ausente, documento não aprovado ou seção marcada explicitamente como `Nenhum` não impõe restrição; informe a limitação quando for relevante.

## Fluxo de trabalho

Antes de configurar o contrato do repositório, inicialize ou reconcilie o manifesto de specs conforme abaixo. Solicitação somente para construir o manifesto não exige redefinir métricas, orientações ou aprovações.

1. Inspecione manifestos, projetos de teste, arquivos de ferramentas locais, scripts de build e CI. Não instale nem modifique ferramentas.
2. Após o portão obrigatório, leia todos os arquivos Markdown em `minhas-specs/metricas/`. Se existir o arquivo único legado `minhas-specs/ferramentas.md`, leia-o também e proponha dividi-lo conforme [Contrato de ferramentas legado](#contrato-de-ferramentas-legado).
3. Peça os comandos exatos de build e teste que verificam o repositório e registre-os na orientação geral `minhas-specs/orientacoes-gerais/comandos-de-build-e-teste.md`, que `{{skill:myspec-inspecionar}}` e `{{skill:myspec-quantificar}}` executam antes de qualquer métrica. Depois pergunte quais métricas de qualidade o Myspec deve medir. O conjunto de métricas é exatamente o que o desenvolvedor definir: nunca suponha, infira nem adote por padrão métrica alguma a partir da stack, de ferramentas existentes ou de práticas comuns. Ofereça candidatas somente se o desenvolvedor pedir. Não definir métrica alguma é válido; deixe `minhas-specs/metricas/` ausente ou vazia e declare que nenhuma métrica foi estabelecida.
4. Para cada métrica escolhida, peça: o que mede, unidade e granularidade (por método, por arquivo, total do projeto etc.); diretório de trabalho, comando de restauração e comandos pré-requisito, como o build, que precisam ter sucesso antes da medição; ferramenta e versão fixada; mecanismo de instalação/restauração; comando exato; formato e caminho do resultado; escopo e exclusões; como isolar o código alterado por uma spec dos valores do projeto; os valores que toda inspeção e relatório de qualidade devem registrar; e seus portões: para cada valor registrado que o desenvolvedor quer julgar, o limite, se vale para o código alterado, para o projeto ou para ambos, e o efeito. Um portão `Bloqueante` torna `Bloqueada` a inspeção cujo código alterado o descumpre; um portão `Atenção` registra o descumprimento como sinal de melhoria. Registre somente os portões que o desenvolvedor declarar; métrica sem portões é válida e é relatada sem julgamento.
5. Pergunte se devem ser definidas ou revistas práticas de código e orientações gerais. Registre cada regra concreta conforme os modelos em `assets/`; se não houver regras conhecidas, deixe a pasta ausente ou vazia e declare isso.
6. Quando útil, ofereça candidatos compatíveis com o repositório e suas contrapartidas, exceto métricas, que seguem o passo 3.
7. Crie ou atualize os documentos do contrato como `Proposto`, com criador e data obtidos de `git config user.name` e `git config user.email`. Use `Histórico de aprovação`. Cada métrica fica em seu próprio arquivo em `minhas-specs/metricas/`, a partir de [assets/modelo-de-metrica.md](assets/modelo-de-metrica.md); os comandos de build e teste, uma prática por arquivo e uma orientação por arquivo usam os respectivos modelos.
8. Apresente a proposta completa e peça aprovação ou revisões explícitas. Encerre sem marcá-la como aprovada.
9. Em invocação posterior, incorpore revisões ou, após aprovação explícita, altere o status para `Aprovado`. Acrescente uma entrada com aprovador, data e contexto; nunca substitua entradas antigas nem os metadados de criação.

## Manifesto de specs

Mantenha `minhas-specs/specs/manifesto.json` relativo à raiz, separado do `minhas-specs/myspec.json` da CLI. Use [assets/modelo-de-manifesto-de-specs.json](assets/modelo-de-manifesto-de-specs.json) somente quando nenhum manifesto existir. O esquema é `{"versao":1,"especificacoes":[{"identificador":"001-exemplo","situacao":"proposta","inspecaoDeConclusao":null}]}`. Cada ID é o nome exato da pasta imediata da spec, único no manifesto; inclua toda pasta com `spec.md`. Chaves e valores de situação são escritos em português brasileiro. A migração de idioma pode renomear caminhos de artefatos, mas deve preservar o conteúdo de specs finalizadas. `inspecaoDeConclusao` é a sequência de três dígitos da inspeção, não um caminho, preservando a referência na troca de idioma; resolva-a como `<id>/inspecoes/inspecao-<NNN>.md`.

Antes de criar o manifesto, procure também `specs/manifest.json` legado. A reinstalação da CLI converte seu nome, campos e situações ao idioma instalado, sem mudar identificadores, significado das situações, sequências de inspeção ou campos personalizados. Configurar deve preservar esses mesmos valores ao reconciliar um manifesto legado; não inicie outro manifesto vazio. Se houver os dois arquivos ou campos conflitantes, relate o conflito sem sobrescrever nem mesclar automaticamente. A tradução de representação não reabre specs nem altera seus registros históricos.

O único ciclo é `proposta → ativa → finalizada`:

- `proposta`: a implementação não começou. Criar ou aprovar a árvore é planejamento, não implementação.
- `ativa`: a implementação começou, mesmo incompleta ou bloqueada. Implementar registra isso antes da primeira edição da implementação.
- `finalizada`: a inspeção final comprova que o trabalho pode avançar à próxima spec. Somente inspeção registrada como `Apta` ou `Apta com ressalvas` sustenta a conclusão (`Ready` ou `Ready with observations` em inglês). Reconheça ambos os idiomas em registros históricos após migração do workspace. Mantenha sua sequência em `inspecaoDeConclusao`; use `null` nos outros estados.

Ao construir manifesto ausente ou adicionar specs existentes não rastreadas, leia cada spec, árvore, inspeções, código/testes relevantes e evidências do controle de versão. Use a inspeção de maior número, nunca uma aprovação anterior: infira `finalizada` somente quando ela permitir avançar e a evidência ainda corresponder à base inspecionada; infira `ativa` quando a implementação começou ou trabalho posterior invalidou essa evidência de conclusão; use `proposta` somente quando a evidência estabelecer que a implementação não começou. Aprovar árvore não comprova implementação; código existente ou testes passando não comprovam conclusão. Se houver ambiguidade, peça a evidência de status/base que falta antes de atribuir a entrada; nunca fabrique conclusão. Sem specs, produza `{"versao":1,"especificacoes":[]}`.

Preserve entradas e referências de conclusão existentes; acrescente specs ausentes sem duplicar. Nunca rebaixe status, reinicie o manifesto, remova entradas históricas ou reabra spec finalizada. Entrada `proposta` com evidência de implementação avança para `ativa`; entrada `ativa` só avança para `finalizada` com a evidência da inspeção final acima. Relate dados malformados, IDs duplicados, pastas ausentes ou referências de conclusão inconsistentes para resolução, sem sobrescrevê-los. Releia antes de gravar e preserve entradas e campos não relacionados para não perder atualizações concorrentes. Informe caminho do manifesto, status inferidos e suas evidências. Esse registro não exige identidade Git nem aprovação do contrato.

Specs finalizadas, árvores, inspeções e entradas de conclusão são bases históricas imutáveis. Toda modificação posterior que possa afetar seu comportamento ou implementação deve ser delimitada em nova spec por `{{skill:myspec-prescrever}}`, inclusive correções, refatorações e ajustes que preservem os critérios antigos. A nova spec pode alterar os mesmos arquivos de código e descrever explicitamente o comportamento posterior; preserve a spec finalizada e seu status/evidência. Código ou orientação novos nunca a reabrem.

## Regras do contrato

- Considere `minhas-specs` relativo à raiz do repositório; mantenha comandos executáveis a partir de um diretório documentado.
- Fixe versões ou documente sua fonte controlada, exclusões de código gerado/padrões e o isolamento dos arquivos alterados nas métricas.
- Registre somente as métricas definidas pelo desenvolvedor, um arquivo Markdown por métrica em `minhas-specs/metricas/`. Os demais skills Myspec medem exatamente essas métricas e nenhuma outra.
- Mantenha no arquivo da métrica tudo o que é preciso para medi-la, inclusive seus portões, para que cada uma seja aprovada e revista isoladamente. Nunca defina um limite fora da seção `## Portões` da métrica que ele julga.
- Métricas, práticas e orientações ficam em arquivos Markdown separados nas respectivas pastas, com nome conciso em kebab-case, status e histórico de aprovação próprios.
- Mantenha práticas acionáveis e específicas.
- Torne cada prática e orientação exigível a partir do próprio documento: defina quando se aplica, o comportamento ou saída exigido e como verificar conformidade. Após aprovação, vale independentemente dos critérios de aceitação de qualquer spec, inclusive em correções elegíveis. Nunca exija CA correspondente em cada spec nem copie a regra para seus critérios; implementação e inspeção devem citar e exigir diretamente a regra de origem.
- Não considere silêncio, ferramenta existente ou comando bem-sucedido como aprovação. Não instale dependências nem altere configuração sem autorização separada. Não deixe este contrato sobrepor instruções de maior prioridade.

## Contrato de ferramentas legado

Versões anteriores do Myspec mantinham todas as métricas em um único `minhas-specs/ferramentas.md`. Quando ele existir:

1. Proponha um arquivo por métrica em `minhas-specs/metricas/`, levando sem alterações definição, contexto de execução, comandos de build pré-requisito e campos de medição.
2. Proponha os comandos de build e teste da seção de verificação como `minhas-specs/orientacoes-gerais/comandos-de-build-e-teste.md`.
3. Transforme cada meta que uma orientação referenciada define para uma métrica em portões dessa métrica somente depois que o desenvolvedor confirmar limite, escopo e efeito; não altere a orientação, a menos que o desenvolvedor peça para retirá-la.
4. Crie os novos arquivos como `Proposto`, com contexto de aprovação que cite `ferramentas.md` como origem. Exclua `minhas-specs/ferramentas.md` somente depois que o desenvolvedor aprovar todos os arquivos de métrica que o substituem.
