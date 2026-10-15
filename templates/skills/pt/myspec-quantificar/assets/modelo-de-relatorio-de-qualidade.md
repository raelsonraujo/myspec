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

| Métrica | Atual | Anterior | Portão |
| --- | ---: | ---: | --- |
| <métrica e valor registrado do seu arquivo de métrica> | `<valor>` | `<valor ou —>` | `<limite e efeito, ou —>` |

<Repita a próxima seção para cada arquivo de métrica aprovado em minhas-specs/metricas, na ordem dos nomes de arquivo.>

## <Nome da métrica>

- Ferramenta e versão: `<ferramenta>`

| Local | Valor | Spec relacionada | Observação |
| --- | ---: | --- | --- |
| `<projeto, arquivo ou membro, na granularidade definida pelo arquivo de métrica>` | `<valor>` | `<NNN-nome ou —>` | `<portão descumprido ou motivo para atenção>` |

## Oportunidades de melhoria

| Prioridade | Oportunidade | Código afetado | Spec relacionada | Efeito esperado | Próximo skill |
| ---: | --- | --- | --- | --- | --- |
| 1 | <melhoria baseada em evidência> | `<caminho ou membro>` | `<NNN-nome ou —>` | <efeito esperado nas métricas> | `{{skill:myspec-prescrever}}` ou `{{skill:myspec-corrigir}}` |

## Limitações

- <Limitação de ferramenta ou escopo, ou `Nenhum`.>
