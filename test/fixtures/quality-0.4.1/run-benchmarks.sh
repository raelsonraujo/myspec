#!/usr/bin/env bash

set -euo pipefail

project_path=''
filter='*'
categories=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project|--filter|--category)
      if [[ $# -lt 2 ]]; then
        echo "Option '$1' requires a value." >&2
        exit 64
      fi

      case "$1" in
        --project) project_path=$2 ;;
        --filter) filter=$2 ;;
        --category) categories+=("$2") ;;
      esac
      shift 2
      ;;
    *)
      echo "Usage: $0 [--project <path-to-benchmarks.csproj>] [--filter <glob>] [--category <id>]..." >&2
      exit 64
      ;;
  esac
done

repository_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
benchmarks_directory="$repository_root/quality/benchmarks"
results_directory="$benchmarks_directory/results"

cd "$repository_root"

if [[ -n $project_path ]]; then
  [[ $project_path != /* ]] && project_path="$repository_root/$project_path"

  if [[ ! -f $project_path ]]; then
    echo "Benchmark project was not found at '$project_path'." >&2
    exit 1
  fi

  if [[ $project_path != *.csproj ]]; then
    echo "Benchmark project path must reference a .csproj file." >&2
    exit 1
  fi
else
  project_files=()
  while IFS= read -r project_file; do
    project_files+=("$project_file")
  done < <(find "$repository_root" -type f -name '*.Benchmarks.csproj' -not -path '*/bin/*' -not -path '*/obj/*' -print)
  if [[ ${#project_files[@]} -ne 1 ]]; then
    echo "Expected exactly one *.Benchmarks.csproj project in '$repository_root' (found ${#project_files[@]}). Use '--project <path>' to select one explicitly." >&2
    exit 1
  fi

  project_path=${project_files[0]}
fi

rm -rf "$benchmarks_directory"

arguments=(run --project "$project_path" --configuration Release --
  --filter "$filter" --memory --exporters json
  --artifacts quality/benchmarks)
if [[ ${#categories[@]} -gt 0 ]]; then
  arguments+=(--anyCategories "${categories[@]}")
fi
dotnet "${arguments[@]}"

result_file=$(find "$results_directory" -type f -name '*.json' -print -quit 2>/dev/null || true)
if [[ -z $result_file ]]; then
  echo "Benchmark run completed without producing JSON results in '$results_directory'. Check the filter and categories." >&2
  exit 1
fi

printf 'Benchmark results: %s\n' "$results_directory"
