[CmdletBinding()]
param(
    [string]$ProjectPath,
    [string[]]$Categories,
    [string]$Filter = '*'
)

$ErrorActionPreference = 'Stop'

function Invoke-DotnetCommand {
    param([Parameter(Mandatory)][string[]]$Arguments)

    & dotnet @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "dotnet $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
    }
}

function Resolve-BenchmarkProject {
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
            throw "Benchmark project was not found at '$candidate'."
        }

        if ([System.IO.Path]::GetExtension($candidate) -ne '.csproj') {
            throw "Benchmark project path must reference a .csproj file."
        }

        return [System.IO.Path]::GetFullPath($candidate)
    }

    $projects = @(Get-ChildItem -LiteralPath $RepositoryRoot -Filter '*.Benchmarks.csproj' -File -Recurse |
            Where-Object { $_.FullName -notmatch '[\\/](bin|obj)[\\/]' })

    if ($projects.Count -ne 1) {
        throw "Expected exactly one *.Benchmarks.csproj project in '$RepositoryRoot' (found $($projects.Count)). Use '-ProjectPath <path>' to select one explicitly."
    }

    return $projects[0].FullName
}

# This folder lives two levels below the repository root, in the Myspec workspace (my-specs/measurement or
# minhas-specs/medicao). Paths are derived from it so a workspace rename does not break the script.
$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$measurementPath = [System.IO.Path]::GetRelativePath($repositoryRoot, $PSScriptRoot) -replace '\\', '/'
$benchmarksDirectory = Join-Path $PSScriptRoot 'benchmarks'
$resultsDirectory = Join-Path $benchmarksDirectory 'results'
$resolvedProjectPath = Resolve-BenchmarkProject -RepositoryRoot $repositoryRoot -RequestedPath $ProjectPath

Push-Location $repositoryRoot
try {
    Remove-Item -LiteralPath $benchmarksDirectory -Recurse -Force -ErrorAction SilentlyContinue

    $arguments = @(
        'run', '--project', $resolvedProjectPath, '--configuration', 'Release', '--',
        '--filter', $Filter, '--memory', '--exporters', 'json',
        '--artifacts', "$measurementPath/benchmarks"
    )
    # pwsh -File passes "CP-01,CP-02" as a single string, so split it here.
    $categoryIds = @($Categories | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    if ($categoryIds.Count -gt 0) {
        $arguments += @('--anyCategories') + $categoryIds
    }
    Invoke-DotnetCommand -Arguments $arguments

    $resultFiles = @(Get-ChildItem -LiteralPath $resultsDirectory -Filter '*.json' -File -ErrorAction SilentlyContinue)
    if ($resultFiles.Count -eq 0) {
        throw "Benchmark run completed without producing JSON results in '$resultsDirectory'. Check the filter and categories."
    }

    Write-Host "Benchmark results: $resultsDirectory"
}
finally {
    Pop-Location
}
