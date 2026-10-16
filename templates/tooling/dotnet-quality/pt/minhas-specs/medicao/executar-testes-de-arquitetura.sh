#!/usr/bin/env bash

set -euo pipefail

solution_path=''
rules=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --solution|--rule)
      if [[ $# -lt 2 ]]; then
        echo "Option '$1' requires a value." >&2
        exit 64
      fi

      case "$1" in
        --solution) solution_path=$2 ;;
        --rule) rules+=("$2") ;;
      esac
      shift 2
      ;;
    *)
      echo "Usage: $0 [--solution <path-to-solution>] [--rule <id>]..." >&2
      exit 64
      ;;
  esac
done

# Names of this folder's files and results, in the workspace language. Every line outside this block is
# identical in the English and Portuguese copies of this script.
architecture_name='arquitetura'
# End of the names in the workspace language.

# This folder lives two levels below the repository root, in the Myspec workspace (my-specs/measurement or
# minhas-specs/medicao). Paths are derived from it so a workspace rename does not break the script.
measurement_directory=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
repository_root=$(cd "$measurement_directory/../.." && pwd)
measurement_path=${measurement_directory#"$repository_root"/}
architecture_directory="$measurement_directory/$architecture_name"

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

filter='Category=Architecture'
if [[ ${#rules[@]} -gt 0 ]]; then
  rule_filter=''
  for rule in "${rules[@]}"; do
    rule_filter+="${rule_filter:+|}Rule=$rule"
  done
  filter+="&($rule_filter)"
fi

dotnet restore "$solution_path"

rm -rf "$architecture_directory"
mkdir -p "$architecture_directory"
# The results are regenerated on every run, so they ignore themselves.
printf '*\n' > "$architecture_directory/.gitignore"

# A violated rule is a failed test: keep its exit code, but report the results first.
status=0
dotnet test "$solution_path" --configuration Release --no-restore \
  --filter "$filter" \
  --logger "trx;LogFilePrefix=$architecture_name" \
  --results-directory "$measurement_path/$architecture_name" || status=$?

result_file=$(find "$architecture_directory" -maxdepth 1 -type f -name "$architecture_name*.trx" -print -quit)
if [[ -z $result_file ]]; then
  echo "Architecture tests completed without producing TRX results in '$architecture_directory'." >&2
  exit 1
fi

printf 'Architecture test results: %s\n' "$architecture_directory"
exit "$status"
