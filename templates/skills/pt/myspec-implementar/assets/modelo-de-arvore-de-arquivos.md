# Árvore de arquivos da implementação

Status: Proposto

## Árvore

```text
<projeto>/
├── <arquivo-a-adicionar>            # adicionar via <contexto breve>
├── <arquivo-a-modificar>            # modificar para <contexto breve>
├── <arquivo-a-excluir>              # excluir porque <contexto breve>
└── <projeto-de-testes>/
    ├── <arquivo-de-teste-a-adicionar> # adicionar
    └── <arquivo-de-teste-a-modificar> # modificar para o comportamento alterado
```

Termine cada entrada de arquivo com um comentário que comece exatamente com um marcador de operação: `# adicionar`, `# modificar` ou `# excluir`. O marcador pode ter contexto curto. Não deixe entradas sem marcador e omita exemplos não aplicáveis.

## Responsabilidades dos arquivos

- `<caminho>`: <por que este arquivo muda e o que ele é responsável por manter>.

## Cobertura dos critérios de aceitação

Referencie todo ID de critério BDD de `spec.md`; este mapeamento não redefine seu comportamento.

- `CA-01`: <local de produção>; <local de teste planejado ou procedimento concreto de verificação de todos os resultados Então/E>.

## Decisões estruturais

- <Limite, dependência ou padrão importante refletido por esta árvore.>

## Decisões em aberto

- <Decisão que exige entrada do desenvolvedor antes da aprovação, ou `Nenhum`.>

## Histórico de revisões

| Data | Status | Revisão |
| --- | --- | --- |
| `<data>` | Proposto | <o que esta revisão propôs ou alterou> |
| `<data>` | Aprovado | <qual revisão foi aprovada> |
