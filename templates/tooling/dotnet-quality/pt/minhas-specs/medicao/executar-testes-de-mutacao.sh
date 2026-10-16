#!/usr/bin/env bash

set -euo pipefail

solution_path=''
since=''
files=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --solution|--file|--since)
      if [[ $# -lt 2 ]]; then
        echo "Option '$1' requires a value." >&2
        exit 64
      fi

      case "$1" in
        --solution) solution_path=$2 ;;
        --file) files+=("$2") ;;
        --since) since=$2 ;;
      esac
      shift 2
      ;;
    *)
      echo "Usage: $0 [--solution <path-to-solution>] [--file <repository-relative-path>]... [--since <committish>]" >&2
      exit 64
      ;;
  esac
done

# Names of this folder's files and results, in the workspace language. Every line outside this block is
# identical in the English and Portuguese copies of this script.
mutation_name='mutacao'
config_name='configuracao-do-stryker.json'
# End of the names in the workspace language.

# This folder lives two levels below the repository root, in the Myspec workspace (my-specs/measurement or
# minhas-specs/medicao). Paths are derived from it so a workspace rename does not break the script.
measurement_directory=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
repository_root=$(cd "$measurement_directory/../.." && pwd)
measurement_path=${measurement_directory#"$repository_root"/}
mutation_directory="$measurement_directory/$mutation_name"
config_path="$measurement_directory/$config_name"
report_path="$mutation_directory/reports/mutation-report.json"

if [[ ! -f $config_path ]]; then
  echo "Stryker configuration was not found at '$config_path'." >&2
  exit 1
fi

cd "$repository_root"

if [[ -n $solution_path ]]; then
  [[ $solution_path != /* ]] && solution_path="$repository_root/$solution_path"

  if [[ ! -f $solution_path ]]; then
    echo "Solution file was not found at '$solution_path'." >&2
    exit 1
  fi

  case "$solution_path" in
    *.sln|*.slnx) ;;
    *)
      echo "Solution path must reference a .sln or .slnx file." >&2
      exit 1
      ;;
  esac
else
  solution_files=()
  while IFS= read -r solution_file; do
    solution_files+=("$solution_file")
  done < <(find "$repository_root" -maxdepth 1 -type f \( -name '*.sln' -o -name '*.slnx' \) -print)
  if [[ ${#solution_files[@]} -ne 1 ]]; then
    echo "Expected exactly one .sln or .slnx file in '$repository_root'. Use '--solution <path>' to select one explicitly." >&2
    exit 1
  fi

  solution_path=${solution_files[0]}
fi

dotnet restore "$solution_path"
dotnet tool restore

rm -rf "$mutation_directory"

arguments=(stryker --solution "$solution_path"
  --config-file "$measurement_path/$config_name"
  --output "$measurement_path/$mutation_name")
# Stryker matches --mutate globs against full paths, so a repository-relative path needs a leading wildcard.
if [[ ${#files[@]} -gt 0 ]]; then
  for file in "${files[@]}"; do
    arguments+=(--mutate "**/${file#./}")
  done
fi
if [[ -n $since ]]; then
  arguments+=("--since:$since")
fi
dotnet "${arguments[@]}"

if [[ ! -f $report_path ]]; then
  echo "Mutation testing completed without producing '$report_path'." >&2
  exit 1
fi

printf 'Mutation report: %s\n' "$mutation_directory/reports/mutation-report.html"
