---
name: myspec-quantificar
description: Mede complexidade ciclomática e cobertura de testes automatizados de código implementado por uma spec usando ferramentas aprovadas pelo desenvolvedor, recomendando melhorias sem impor limites. Use para controle de qualidade, análise de complexidade ou cobertura pós-implementação.
---

# Myspec Quantificar

Produza métricas de qualidade baseadas em evidências para o código implementado por uma spec e indique onde o esforço de melhoria compensa.

## Portão obrigatório de orientações

Antes de avançar além da descoberta inicial ou executar medição, leia todos os Markdown em `my-specs/coding-practices/` e `my-specs/general-guidelines/`. Documentos aplicáveis com `Status: Approved` são obrigatórios; cumpra-os e exponha conflitos superiores. Ausências, documentos não aprovados ou `None` não restringem; informe limitações relevantes.

## Fluxo de trabalho

1. Após o portão, leia `my-specs/tooling.md` na raiz. Exija `Status: Approved` e definições completas de complexidade e cobertura; ele não substitui as orientações.
2. Se o contrato estiver ausente, incompleto ou não aprovado, pare e peça `{{skill:myspec-configurar}}`. Não escolha ferramenta substituta.
3. Resolva a pasta da spec em `my-specs/specs`; leia `spec.md` e `file-tree.md` quando existir.
4. Identifique arquivos de produção e testes implementados pela árvore aprovada, diff e evidência do repositório; declare a base usada.
5. Obtenha resultados dos comandos aprovados exatos, respeitando escopo, exclusões e orientações aplicáveis.
6. Crie ou atualize `my-specs/specs/<nome-da-spec>/quality-report.md` a partir de `assets/quality-report-template.md`, avalie sugestões contra práticas/orientações e retorne caminho, destaques e prioridades.

Se a ferramenta aprovada estiver indisponível ou falhar, não invente, estime manualmente, instale ou substitua ferramenta. Relate a falha, preserve métricas mensuráveis e marque seções incompletas.

## Regras de medição e sugestões

- Informe comandos exatos, ferramentas, versões e configuração. Delimite métricas ao código de produção implementado e diferencie valores globais quando não for possível isolar alterações.
- Informe cobertura de linhas e ramos, com contagens e percentuais, quando suportado. Informe complexidade ao menos por método/função, consolide por arquivo/tipo e destaque os maiores valores.
- Identifique código gerado, migrations, arquivos somente DTO e outras exclusões. Testes falhos ou ignorados são achados, não verificação limpa.
- Não imponha limites de aprovação/reprovação sem solicitação separada. Priorize lacunas críticas, métodos complexos, testes de ramos/falhas/limites/autorização/integridade e duplicação. Não prometa melhoria numérica sem medir novamente.
