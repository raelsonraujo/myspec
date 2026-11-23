# Comandos de build e teste

Status: Proposto

Criado por: `{{author}}`

Criado em: `{{date}}`

Aplica-se a: Todos os skills Myspec que compilam, testam, inspecionam ou quantificam o repositório

## Regra

Verifique o repositório a partir da raiz com estes comandos, nesta ordem:

1. Restauração: `dotnet restore {{solution}}` seguido de `dotnet tool restore`
2. Build: `dotnet build {{solution}} --configuration Release --no-restore`
3. Testes: `dotnet test {{solution}} --configuration Release --no-build`

```json myspec
{
  "kind": "verify",
  "workingDir": ".",
  "commands": [
    "dotnet restore {{solution}}",
    "dotnet tool restore",
    "dotnet build {{solution}} --configuration Release --no-restore",
    "dotnet test {{solution}} --configuration Release --no-build"
  ]
}
```

Execute-os antes de medir qualquer métrica de `minhas-specs/metricas/`. Quando o comando de medição de uma métrica já executar os mesmos testes, como `minhas-specs/medicao/gerar-relatorio-de-cobertura`, seus resultados de teste podem substituir o passo 3 na mesma base.

## Precedência das orientações

- Siga instruções de sistema, desenvolvedor, usuário e repositório antes desta orientação.
- Se ela conflitar com instrução superior ou a spec aprovada, pare e exponha o conflito.

## Histórico de aprovação

- Nenhuma aprovação registrada.
