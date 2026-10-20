#!/usr/bin/env bash
set -euo pipefail

fail() { printf 'Error: %s\n' "$*" >&2; exit 1; }
usage() {
  printf '%s\n' \
    'Usage: bash pi-update-package.sh <command> [arguments]' \
    '  discover' \
    '  plan <package>' \
    '  branch <name> --confirmed' \
    '  patch <package> <source-hash>   # print next package patch only' \
    '  apply <package> <source-hash>' \
    '  commit [required-shared-file ...]' \
    '  finish                        # write REF.md once; leave it uncommitted' \
    'Source is fixed at ~/.pi; run from this destination repository.'
}

command=${1:-help}
if [[ "$command" == help || "$command" == --help ]]; then usage; exit 0; fi
root=$(git rev-parse --show-toplevel) || fail 'Run inside the destination repository.'
cd "$root"
[[ -f pnpm-workspace.yaml && -d packages/public ]] || fail 'Not the packages workspace.'
source_root="$HOME/.pi"
source_path() { printf 'packages/%s' "$package"; }
destination_path() { printf 'packages/public/%s' "$package"; }
state=$(git rev-parse --absolute-git-dir)/pi-update-package

source_check() {
  [[ -d "$source_root" ]] || fail 'Missing ~/.pi source repository.'
  [[ "$(git -C "$source_root" rev-parse --show-toplevel)" == "$source_root" ]] || fail '~/.pi must be a repository root.'
  [[ "$root" != "$source_root" ]] || fail 'Source and destination must differ.'
  [[ "$(git -C "$source_root" rev-parse --is-shallow-repository)" == false ]] || fail 'Source history is shallow; ask for direction.'
}
package_check() {
  package=${1:-}
  [[ "$package" =~ ^[a-zA-Z0-9][a-zA-Z0-9_-]*$ ]] || fail 'Provide a simple package directory name.'
  [[ ! -L packages && ! -L packages/public && ! -L "$(destination_path)" ]] || fail 'Destination directory symlinks are not supported.'
}
branch_check() {
  branch=$(git symbolic-ref --quiet --short HEAD) || fail 'Detached HEAD; choose a branch.'
  [[ "$branch" != main ]] || fail 'Imports are forbidden on main; offer to create a branch.'
}
clean_check() {
  [[ -z "$(git status --porcelain --untracked-files=all)" ]] || fail 'Destination must be clean; ask how to handle existing changes.'
}
no_operation() {
  local marker
  for marker in MERGE_HEAD CHERRY_PICK_HEAD REVERT_HEAD rebase-merge rebase-apply; do
    [[ ! -e "$(git rev-parse --git-path "$marker")" ]] || fail 'Finish the existing Git operation first.'
  done
}
baseline() {
  local ref="$(destination_path)/REF.md"
  base=
  if [[ -e "$(destination_path)" ]]; then
    [[ -f "$ref" && ! -L "$ref" ]] || fail 'Existing package has no safe REF.md; ask for a baseline.'
    [[ "$(awk '/^Source-Commit: / { n++ } END { print n+0 }' "$ref")" == 1 ]] || fail 'REF.md needs exactly one Source-Commit field.'
    base=$(awk '/^Source-Commit: / { print $2 }' "$ref")
    [[ "$base" =~ ^[0-9a-f]{40}$ ]] || fail 'Invalid baseline; ask for direction.'
    git -C "$source_root" cat-file -e "$base^{commit}" 2>/dev/null || fail 'Baseline is unavailable; ask for direction.'
    git -C "$source_root" merge-base --is-ancestor "$base" "$tip" || fail 'Baseline is not an ancestor of source HEAD; ask for direction.'
    git -C "$source_root" rev-list --first-parent "$tip" | awk -v base="$base" '$0 == base { found=1 } END { exit !found }' || fail 'Baseline is not on the first-parent history; ask for direction.'
  fi
}
history() {
  local range=$tip
  [[ -z "$base" ]] || range="$base..$tip"
  # Include full path history, then filter merges with no net package change.
  local sha parent
  while IFS= read -r sha; do
    parent=$(git -C "$source_root" rev-parse "$sha^1" 2>/dev/null) || parent=$(git -C "$source_root" hash-object -t tree /dev/null)
    if ! git -C "$source_root" diff --quiet "$parent" "$sha" -- "$(source_path)"; then
      printf '%s\n' "$sha"
    fi
  done < <(git -C "$source_root" rev-list --first-parent --full-history --reverse "$range" -- "$(source_path)")
}
next_check() {
  source_check
  tip=$(git -C "$source_root" rev-parse HEAD)
  if [[ -d "$state" ]]; then
    requested_package=$package
    load_state
    [[ "$package" == "$requested_package" ]] || fail 'Finish the current package first.'
    [[ ! -e "$state/source" ]] || fail 'A source commit is pending; resolve it before continuing.'
    base=$(<"$state/last")
  else
    baseline
  fi
  next=$(history | awk 'NR == 1 { first=$0 } END { print first }')
  [[ -n "$next" && "$sha" == "$next" ]] || fail 'Hash must be the next full source hash from plan.'
  [[ -z "$(git -C "$source_root" ls-tree "$sha" -- "$(source_path)/REF.md")" ]] || fail 'Source contains reserved REF.md; ask for direction.'
}
patch() {
  local parent
  parent=$(git -C "$source_root" rev-parse "$sha^1" 2>/dev/null) || parent=$(git -C "$source_root" hash-object -t tree /dev/null)
  git -C "$source_root/$(source_path)" diff --binary --full-index --no-ext-diff --no-textconv --no-renames \
    --relative="$(source_path)/" "$parent" "$sha" -- .
}
load_state() {
  [[ -d "$state" ]] || fail 'No pending import.'
  package_check "$(<"$state/package")"
  branch_check
  [[ "$branch" == "$(<"$state/branch")" && "$(git rev-parse HEAD)" == "$(<"$state/head")" ]] || fail 'Branch or HEAD changed during replay; ask for direction.'
  [[ "$(git -C "$source_root" rev-parse HEAD)" == "$(<"$state/tip")" ]] || fail 'Source HEAD changed during replay; ask for direction.'
}

case "$command" in
  discover)
    source_check
    printf 'Destination branch: %s\n' "$(git symbolic-ref --quiet --short HEAD || printf DETACHED)"
    printf 'Source HEAD: %s\n' "$(git -C "$source_root" rev-parse HEAD)"
    printf 'Source working tree (informational; never imported):\n'
    git -C "$source_root" status --short
    printf '\nCommitted source package directories:\n'
    git -C "$source_root" ls-tree -d --name-only HEAD:packages
    ;;
  branch)
    [[ $# == 3 && "$3" == --confirmed ]] || fail 'Branch creation requires a user-confirmed name and --confirmed.'
    [[ "$2" != main ]] || fail 'Choose a non-main branch.'
    clean_check; no_operation
    [[ ! -e "$state" ]] || fail 'Pending import exists.'
    git switch -c "$2"
    ;;
  plan)
    package_check "${2:-}"; source_check
    tip=$(git -C "$source_root" rev-parse HEAD)
    git -C "$source_root" cat-file -e "$tip:$(source_path)/package.json" || fail 'Not a committed package at source HEAD.'
    if [[ -d "$state" ]]; then
      requested_package=$package
      load_state
      [[ "$package" == "$requested_package" ]] || fail 'Finish the current package first.'
      base=$(<"$state/last")
    else
      baseline
    fi
    printf 'Source HEAD: %s\nBaseline: %s\n' "$tip" "${base:-NEW PACKAGE}"
    printf 'First-parent replay order (merges represent their net package changes):\n'
    while IFS= read -r sha; do
      git -C "$source_root" show -s --format='%H %P%nAuthor: %an <%ae>%nDate: %aI%n%B' "$sha"
    done < <(history)
    ;;
  patch|apply)
    package_check "${2:-}"; sha=${3:-}
    if [[ "$command" == apply ]]; then branch_check; clean_check; no_operation; fi
    next_check
    if [[ "$command" == patch ]]; then patch; exit 0; fi
    command -v jq >/dev/null || fail 'jq is required for metadata validation.'
    if [[ ! -d "$state" ]]; then
      mkdir "$state"
      printf '%s\n' "$package" > "$state/package"
      printf '%s\n' "$branch" > "$state/branch"
      printf '%s\n' "$base" > "$state/last"
      git rev-parse HEAD > "$state/head"
      printf '%s\n' "$tip" > "$state/tip"
      ref="$(destination_path)/REF.md"
      if [[ -f "$ref" ]]; then
        grep -q '^## Copy Instructions$' "$ref" || fail 'REF.md needs a Copy Instructions heading.'
        awk 'keep { print } /^## Copy Instructions$/ { keep=1 }' "$ref" > "$state/notes"
      else
        printf '\nRecord repeatable destination adaptations here before finishing.\n' > "$state/notes"
      fi
    fi
    printf '%s\n' "$sha" > "$state/source"
    patch > "$state/change.patch"
    git -C "$source_root" show -s --format=format:%B "$sha" > "$state/message"
    git -C "$source_root" show -s --format=%an "$sha" > "$state/author-name"
    git -C "$source_root" show -s --format=%ae "$sha" > "$state/author-email"
    git -C "$source_root" show -s --format=%aI "$sha" > "$state/author-date"
    if [[ -f "$(destination_path)/package.json" ]]; then
      jq -er .version "$(destination_path)/package.json" > "$state/version"
    fi
    if ! git apply --check --directory="$(destination_path)" "$state/change.patch"; then
      fail "Patch needs agent reconciliation. No package changes applied. Pending patch: $state/change.patch"
    fi
    git apply --directory="$(destination_path)" "$state/change.patch"
    printf 'Applied %s. Adapt metadata, update %s/notes, validate, then commit.\n' "$sha" "$state"
    ;;
  commit)
    load_state; no_operation
    command -v jq >/dev/null || fail 'jq is required for metadata validation.'
    [[ -f "$state/source" ]] || fail 'No pending source commit.'
    sha=$(<"$state/source")
    [[ -z "$(git status --porcelain --untracked-files=all -- "$(destination_path)/REF.md")" ]] || fail 'Leave REF.md unchanged until finish.'
    if [[ -f "$state/version" ]]; then
      [[ "$(jq -er .version "$(destination_path)/package.json")" == "$(<"$state/version")" ]] || fail 'Restore the destination version.'
    fi
    jq -e '[.dependencies, .optionalDependencies, .peerDependencies] | all(.[]; (. // {} | to_entries | all(.[]; (.value | startswith("catalog:") | not))))' \
      "$(destination_path)/package.json" >/dev/null || fail 'Only devDependencies may use catalog:.'
    git diff --cached --quiet || fail 'Index must be empty; do not mix staged changes.'
    shift
    for path in "$@"; do
      case "$path" in
        pnpm-lock.yaml|pnpm-workspace.yaml|package.json|README.md) ;;
        *) fail "Not an allowed shared integration file: $path" ;;
      esac
    done
    git add -A -- "$(destination_path)" "$@"
    if ! GIT_AUTHOR_NAME="$(<"$state/author-name")" GIT_AUTHOR_EMAIL="$(<"$state/author-email")" \
      GIT_AUTHOR_DATE="$(<"$state/author-date")" git commit --allow-empty --cleanup=verbatim --allow-empty-message -F "$state/message"; then
      fail 'Commit failed. Keep pending state; review hook changes and unstage only this import before retrying. Never bypass hooks automatically.'
    fi
    printf '%s\n' "$sha" > "$state/last"
    git rev-parse HEAD > "$state/head"
    if [[ ! -f "$state/version" ]]; then
      jq -er .version "$(destination_path)/package.json" > "$state/version"
    fi
    for file in source change.patch message author-name author-email author-date; do
      unlink "$state/$file"
    done
    git status --short
    ;;
  finish)
    load_state; no_operation; clean_check
    [[ ! -e "$state/source" ]] || fail 'Finish the pending source commit first.'
    sha=$(<"$state/last")
    [[ -n "$sha" ]] || fail 'No source commits replayed.'
    base=$sha
    tip=$(<"$state/tip")
    [[ -z "$(history)" ]] || fail 'Replay the remaining commits before finishing.'
    ref="$(destination_path)/REF.md"
    [[ -d "$(destination_path)" && ! -L "$ref" ]] || fail 'Package removed or unsafe REF.md; ask for direction.'
    {
      printf '# Pi Package Reference\n\nSource: ~/.pi/packages/%s\nSource-Commit: %s\nUpdated-At: %s\n\n## Copy Instructions\n' \
        "$package" "$sha" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
      cat "$state/notes"
    } > "$ref"
    for file in "$state"/*; do unlink "$file"; done
    rmdir "$state"
    printf 'Saved %s. Left uncommitted for review.\n' "$ref"
    ;;
  *) usage; fail "Unknown command: $command" ;;
esac
