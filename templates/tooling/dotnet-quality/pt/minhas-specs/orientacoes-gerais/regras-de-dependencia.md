# Regras de dependência

Status: Proposto

Criado por: `{{author}}`

Criado em: `{{date}}`

Aplica-se a: Todos os skills Myspec que prescrevem, implementam, corrigem, inspecionam ou quantificam código de produção

## Regra

As regras abaixo são as únicas restrições de dependência entre camadas, módulos e namespaces deste repositório. Cada uma é verificada por um teste de arquitetura do ArchUnitNET, conforme `minhas-specs/metricas/conformidade-de-dependencias.md`, e uma violação é julgada pelos portões dessa métrica.

| ID | Regra | Origem | Destino | Teste | Justificativa |
| --- | --- | --- | --- | --- | --- |
| `DEP-01` | <ex.: o domínio não depende da infraestrutura> | `<Produto>.Domain` | não depende de `<Produto>.Infrastructure` | `<Namespace.RegrasDeDependencia.DEP_01_Dominio_nao_depende_da_infraestrutura>` | <por que a regra existe> |
| `DEP-02` | <ex.: namespaces do produto livres de ciclos> | `<Produto>.(*)` | sem ciclos entre fatias | `<Namespace.RegrasDeDependencia.DEP_02_Namespaces_livres_de_ciclos>` | <por que a regra existe> |

Substitua as linhas de exemplo pelas regras decididas pelo time antes de aprovar esta orientação. A arquitetura é decisão humana: os testes apenas verificam as regras aprovadas aqui, e nenhum skill cria, remove ou relaxa uma regra por conta própria. Incluir, remover ou mudar uma regra exige nova aprovação desta orientação.

Prefira poucas regras que expressem fronteiras reais:

- direção entre camadas, como domínio, aplicação, infraestrutura e apresentação;
- isolamento entre módulos ou contextos delimitados, permitindo apenas os contratos públicos combinados;
- ausência de ciclos entre namespaces do mesmo produto, já que ciclos entre projetos o .NET já impede;
- dependências externas restritas a uma camada, como o ORM ou o cliente HTTP somente na infraestrutura.

Specs:

- Quando o escopo de uma spec criar um módulo, uma camada ou uma dependência nova entre eles, a spec cita as regras afetadas e, se precisar de uma regra nova ou alterada, diz isso como pré-requisito a aprovar nesta orientação antes da implementação.
- A árvore de arquivos da spec lista o teste de arquitetura a adicionar ou modificar.

Testes de arquitetura:

- Ficam em um projeto de testes cujo nome termina em `.ArchitectureTests` e carregam os assemblies de produção com o `ArchLoader` do ArchUnitNET.
- Cada regra é um único teste com `[Trait("Category", "Architecture")]` e `[Trait("Rule", "<ID>")]`, cujo nome começa com o ID, como `DEP_01_...`, porque o relatório TRX registra o nome do teste, mas não seus traits.
- Uma exceção pontual a uma regra só existe se constar desta orientação, com o tipo exato excluído e a justificativa.

Relatórios:

- Inspeções executam apenas as regras cujos namespaces de origem a spec altera, com `-Rules <ID>` ou `--rule <ID>`, e informam cada violação com a regra e os tipos envolvidos.
- Relatórios de qualidade do projeto executam todas as regras.

## Precedência das orientações

- Siga instruções de sistema, desenvolvedor, usuário e repositório antes desta orientação.
- Se ela conflitar com instrução superior ou a spec aprovada, pare e exponha o conflito.

## Histórico de aprovação

- Nenhuma aprovação registrada.
