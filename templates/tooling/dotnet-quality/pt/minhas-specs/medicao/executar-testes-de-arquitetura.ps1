[CmdletBinding()]
param(
    [string]$SolutionPath,
    [string[]]$Rules
)

$ErrorActionPreference = 'Stop'

function Invoke-DotnetCommand {
    param([Parameter(Mandatory)][string[]]$Arguments)

    & dotnet @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "dotnet $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
    }
}

function Resolve-SolutionPath {
    param(
        [Parameter(Mandatory)][string]$RepositoryRoot,
        [string]$RequestedPath
    )

    if ($RequestedPath) {
        $candidate = if ([System.IO.Path]::IsPathRooted($RequestedPath)) {
            $RequestedPath
        }
        else {
            Join-Path $RepositoryRoot $RequestedPath
        }

        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            throw "Solution file was not found at '$candidate'."
        }

        if ([System.IO.Path]::GetExtension($candidate) -notin '.sln', '.slnx') {
            throw "Solution path must reference a .sln or .slnx file."
        }

        return [System.IO.Path]::GetFullPath($candidate)
    }

    $solutions = @(Get-ChildItem -LiteralPath $RepositoryRoot -File |
            Where-Object { $_.Extension -in '.sln', '.slnx' })

    if ($solutions.Count -ne 1) {
        throw "Expected exactly one .sln or .slnx file in '$RepositoryRoot'. Use '-SolutionPath <path>' to select one explicitly."
    }

    return $solutions[0].FullName
}

# Names of this folder's files and results, in the workspace language. Every line outside this block is
# identical in the English and Portuguese copies of this script.
$architectureName = 'arquitetura'
# End of the names in the workspace language.

# This folder lives two levels below the repository root, in the Myspec workspace (my-specs/measurement or
# minhas-specs/medicao). Paths are derived from it so a workspace rename does not break the script.
$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$measurementPath = [System.IO.Path]::GetRelativePath($repositoryRoot, $PSScriptRoot) -replace '\\', '/'
$architectureDirectory = Join-Path $PSScriptRoot $architectureName
$resolvedSolutionPath = Resolve-SolutionPath -RepositoryRoot $repositoryRoot -RequestedPath $SolutionPath

# pwsh -File passes "DEP-01,DEP-02" as a single string, so split it here.
$ruleIds = @($Rules | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$filter = 'Category=Architecture'
if ($ruleIds.Count -gt 0) {
    $filter += "&($(($ruleIds | ForEach-Object { "Rule=$_" }) -join '|'))"
}

Push-Location $repositoryRoot
try {
    Invoke-DotnetCommand -Arguments @('restore', $resolvedSolutionPath)

    Remove-Item -LiteralPath $architectureDirectory -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Path $architectureDirectory -Force | Out-Null
    # The results are regenerated on every run, so they ignore themselves.
    Set-Content -LiteralPath (Join-Path $architectureDirectory '.gitignore') -Value '*'

    # A violated rule is a failed test: keep its exit code, but report the results first.
    & dotnet test $resolvedSolutionPath --configuration Release --no-restore `
        --filter $filter `
        --logger "trx;LogFilePrefix=$architectureName" `
        --results-directory "$measurementPath/$architectureName"
    $status = $LASTEXITCODE

    $resultFiles = @(Get-ChildItem -LiteralPath $architectureDirectory -Filter "$architectureName*.trx" -File)
    if ($resultFiles.Count -eq 0) {
        throw "Architecture tests completed without producing TRX results in '$architectureDirectory'."
    }

    Write-Host "Architecture test results: $architectureDirectory"
}
finally {
    Pop-Location
}

exit $status
