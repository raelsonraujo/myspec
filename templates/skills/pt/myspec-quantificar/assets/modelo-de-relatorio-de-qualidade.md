# Relatório de qualidade do projeto

## Escopo e base

- Base: `<commit ou branch>`
- Medido em: `<data>`
- Exclusões:
  - `<caminho ou categoria>`: <motivo>

## Verificação

| Comando | Resultado |
| --- | --- |
| `<comando de build ou teste>` | <aprovado, falhou ou parcial> |

## Resumo do projeto

| Métrica | Atual | Anterior | Meta aprovada |
| --- | ---: | ---: | ---: |
| <métrica e valor registrado do contrato de ferramentas> | `<valor>` | `<valor ou —>` | `<meta ou —>` |

<Repita a próxima seção para cada métrica definida pelo contrato de ferramentas, na mesma ordem.>

## <Nome da métrica>

- Ferramenta e versão: `<ferramenta>`

| Local | Valor | Spec relacionada | Observação |
| --- | ---: | --- | --- |
| `<projeto, arquivo ou membro, na granularidade definida pelo contrato>` | `<valor>` | `<NNN-nome ou —>` | `<meta não atingida ou motivo para atenção>` |

## Oportunidades de melhoria

| Prioridade | Oportunidade | Código afetado | Spec relacionada | Efeito esperado | Próximo skill |
| ---: | --- | --- | --- | --- | --- |
| 1 | <melhoria baseada em evidência> | `<caminho ou membro>` | `<NNN-nome ou —>` | <efeito esperado nas métricas> | `{{skill:myspec-prescrever}}` ou `{{skill:myspec-corrigir}}` |

## Limitações

- <Limitação de ferramenta ou escopo, ou `Nenhum`.>
