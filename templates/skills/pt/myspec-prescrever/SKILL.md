---
name: myspec-prescrever
description: Cria uma especificação de alteração de código pequena, clara e revisável por QA em uma pasta de nome sugerido sob minhas-specs/specs. Use para definir escopo, especificar ou escrever critérios de aceitação antes da implementação.
---

# Myspec Prescrever

Transforme uma solicitação de mudança em um contrato compacto para implementação e QA.

## Portão obrigatório de orientações

Antes de avançar além da descoberta da solicitação e do repositório, leia todos os Markdown existentes em `minhas-specs/praticas-de-codigo/` e `minhas-specs/orientacoes-gerais/`. Todo documento aplicável com `Status: Aprovado` é obrigatório: cumpra-o antes da ação que rege e exponha conflitos com instruções superiores. Ausências, documentos não aprovados ou `Nenhum` não restringem; informe limitações relevantes.

## Fluxo de trabalho

1. Leia a solicitação e inspecione o contexto relevante. Após o portão, leia os arquivos de métrica em `minhas-specs/metricas/` quando existirem, para conhecer as ferramentas e os portões que a mudança deve cumprir, sem que eles substituam as orientações.
2. Identifique ambiguidades materiais que alterariam substancialmente escopo ou comportamento observável. Faça perguntas objetivas só para elas; caso contrário, declare suposições conservadoras.
3. Sugira um nome conciso em kebab-case baseado no comportamento solicitado.
4. Inspecione diretórios imediatos de `minhas-specs/specs` cujo nome comece com três dígitos e `-`. Atribua o próximo prefixo sequencial de três dígitos com zeros, começando em `001`; nunca renumere pastas existentes.
5. Crie `minhas-specs/specs/<sequência>-<nome-da-spec>/spec.md` a partir de `assets/modelo-de-spec.md` e revise testabilidade, consistência, expansão acidental de escopo e conformidade com orientações aprovadas.
6. Retorne o caminho criado e as suposições registradas. Sempre crie o Markdown antes de concluir; nunca deixe a especificação apenas no chat.

## Regras de conteúdo

- Descreva o resultado desejado, não um plano de implementação. Mantenha requisitos pequenos, concretos e inequívocos.
- Defina áreas ou responsabilidades de código esperadas sem prescrever arquivos, salvo quando a solicitação ou evidência do repositório os sustentar.
- Separe explicitamente escopo e fora de escopo. Escreva critérios como verificações observáveis de QA; prefira `Dado / Quando / Então` quando trouxer precisão.
- Cubra caminhos felizes, falhas relevantes, limites, permissões, efeitos nos dados e compatibilidade quando aplicável. Dê identificador estável a cada critério, como `CA-01`.
- Não invente comportamento de produto além do que a solicitação estabelece. Registre uma suposição razoável ou pergunte se a decisão for material.
- Preserve arquivos existentes. Se a pasta sugerida já existir, atualize-a somente se o desenvolvedor quiser claramente revisá-la; caso contrário, aloque a próxima sequência. Nunca deixe orientação Myspec sobrepor instruções superiores.
