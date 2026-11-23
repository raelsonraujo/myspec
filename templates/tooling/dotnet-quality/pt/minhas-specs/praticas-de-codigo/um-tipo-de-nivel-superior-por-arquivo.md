# Um tipo de nível superior por arquivo

Status: Proposto

Criado por: `{{author}}`

Criado em: `{{date}}`

Aplica-se a: implementação em arquivos-fonte C# sob `{{solution}}`, excluindo código gerado (`*.g.cs`, `*.Designer.cs`, `*.generated.cs`) e exceções estabelecidas pelo repositório

> Gerado por `myspec install --tooling dotnet-quality`. Revise esta prática frente às convenções do repositório e aprove-a com `myspec approve` ou `myspec-configurar`.

## Regra

Coloque no máximo uma definição de nível superior de `class`, `record`, `struct` ou `interface` em cada arquivo-fonte C#, alinhando o nome do arquivo ao nome do tipo.

## Verificação

Inspecione os arquivos `.cs` alterados ou revisados (fora arquivos gerados excluídos) e confirme que nenhum arquivo declara mais de um tipo de nível superior sem exceção explícita do repositório. Exija diretamente deste documento; não é necessário critério de aceitação em cada spec.

## Histórico de aprovação

- Nenhum ainda.
