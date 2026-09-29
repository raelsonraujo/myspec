# Árvore de arquivos da implementação

Status: Proposed

Created by: `<git user.name> <git user.email>`

Created on: `<date>`

## Árvore

```text
<projeto>/
├── <arquivo-a-adicionar>            # add via <contexto breve>
├── <arquivo-a-modificar>            # modify para <contexto breve>
├── <arquivo-a-excluir>              # delete porque <contexto breve>
└── <projeto-de-testes>/
    ├── <arquivo-de-teste-a-adicionar> # add
    └── <arquivo-de-teste-a-modificar> # modify para o comportamento alterado
```

Termine cada entrada de arquivo com um comentário que comece exatamente com um marcador de operação: `# add`, `# modify` ou `# delete`. O marcador pode ter contexto curto. Não deixe entradas sem marcador e omita exemplos não aplicáveis.

## Responsabilidades dos arquivos

- `<caminho>`: <por que este arquivo muda e o que ele é responsável por manter>.

## Cobertura dos critérios de aceitação

- `AC-01`: <local de produção>; <local de teste>.

## Decisões estruturais

- <Limite, dependência ou padrão importante refletido por esta árvore.>

## Decisões em aberto

- <Decisão que exige entrada do desenvolvedor antes da aprovação, ou `None`.>

## Histórico de aprovação

- Approved by: `<git user.name> <git user.email>`
- Approved on: `<date>`
- Approval context: `<descrição concisa da árvore ou revisão aprovada>`
