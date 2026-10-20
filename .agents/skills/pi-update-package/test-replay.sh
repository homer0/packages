#!/usr/bin/env bash
set -euo pipefail

# Exercise the replay state machine with a Git double, not a temporary repository.
skill_dir=$(cd "$(dirname "$0")" && pwd)
fixture=$(mktemp -d /tmp/pi-update-package-replay.XXXXXX)
cleanup() {
  local path
  while IFS= read -r -d '' path; do unlink "$path"; done < <(find "$fixture" -type f -print0)
  while IFS= read -r path; do rmdir "$path"; done < <(find "$fixture" -depth -type d)
}
trap cleanup EXIT
mkdir -p "$fixture/bin" "$fixture/home/.pi" "$fixture/destination/packages/public" "$fixture/state"
printf 'packages: []\n' > "$fixture/destination/pnpm-workspace.yaml"
printf 'initial-head\n' > "$fixture/head"
cat > "$fixture/bin/git" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
repo=$TEST_FIXTURE/destination
if [[ "${1:-}" == -C ]]; then repo=$2; shift 2; fi
first=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
last=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
case "$1" in
  rev-parse)
    case "$2" in
      --show-toplevel) printf '%s\n' "$repo" ;;
      --absolute-git-dir) printf '%s/state\n' "$TEST_FIXTURE" ;;
      --git-path) printf '%s/state/%s\n' "$TEST_FIXTURE" "$3" ;;
      --is-shallow-repository) printf 'false\n' ;;
      HEAD)
        if [[ "$repo" == "$HOME/.pi" ]]; then printf '%s\n' "$last"; else cat "$TEST_FIXTURE/head"; fi ;;
      *^1) printf '%s\n' "$first" ;;
      *) exit 1 ;;
    esac ;;
  symbolic-ref) printf 'import-test\n' ;;
  status|cat-file|merge-base|add|ls-tree) ;;
  rev-list)
    case "$*" in
      *"$last..$last"*) ;;
      *"$first..$last"*) printf '%s\n' "$last" ;;
      *) printf '%s\n%s\n' "$first" "$last" ;;
    esac ;;
  diff)
    if [[ "$*" == *--cached* ]]; then exit 0; fi
    if [[ "$*" == *--quiet* ]]; then exit 1; fi
    printf 'mock patch\n' ;;
  show)
    case "$*" in
      *--format=format:%B*) printf 'fix(mock): original message\n\nOriginal body.\n' ;;
      *--format=%an*) printf 'Source Author\n' ;;
      *--format=%ae*) printf 'source@example.test\n' ;;
      *--format=%aI*) printf '2026-01-01T00:00:00Z\n' ;;
      *) printf '%s\n' "${!#} original message" ;;
    esac ;;
  apply)
    if [[ "$*" == *--check* ]]; then exit 0; fi
    mkdir -p "$TEST_FIXTURE/destination/packages/public/mock"
    if [[ "$(<"$TEST_FIXTURE/state/pi-update-package/source")" == "$first" ]]; then version=1.0.0; else version=9.0.0; fi
    printf '{"name":"mock","version":"%s"}\n' "$version" > "$TEST_FIXTURE/destination/packages/public/mock/package.json" ;;
  commit)
    [[ "$GIT_AUTHOR_NAME" == 'Source Author' && "$GIT_AUTHOR_EMAIL" == source@example.test ]]
    [[ "$GIT_AUTHOR_DATE" == 2026-01-01T00:00:00Z ]]
    cmp "${!#}" "$TEST_FIXTURE/expected-message"
    printf 'commit\n' >> "$TEST_FIXTURE/commits"
    printf 'head-%s\n' "$(wc -l < "$TEST_FIXTURE/commits" | tr -d ' ')" > "$TEST_FIXTURE/head" ;;
  *) printf 'Unexpected mock Git command: %s\n' "$*" >&2; exit 1 ;;
esac
MOCK
chmod +x "$fixture/bin/git"
export TEST_FIXTURE="$fixture" HOME="$fixture/home" PATH="$fixture/bin:$PATH"
cd "$fixture/destination"
helper="$skill_dir/pi-update-package.sh"
first=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
last=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
state="$fixture/state/pi-update-package"
ref=packages/public/mock/REF.md
printf 'fix(mock): original message\n\nOriginal body.\n' > "$fixture/expected-message"

bash "$helper" apply mock "$first"
printf '\nPreserve the destination version and public repository path.\n' > "$state/notes"
[[ ! -e "$ref" ]]
bash "$helper" commit
[[ "$(<"$state/last")" == "$first" && ! -e "$state/source" && ! -e "$ref" ]]
if bash "$helper" finish; then printf 'Premature finish accepted\n' >&2; exit 1; fi
plan=$(bash "$helper" plan mock)
[[ "$plan" == *"$last original message"* && "$plan" != *"$first original message"* ]]
bash "$helper" apply mock "$last"
if bash "$helper" commit; then printf 'Source version override accepted\n' >&2; exit 1; fi
printf '{"name":"mock","version":"1.0.0","dependencies":{"runtime":"catalog:"}}\n' > packages/public/mock/package.json
if bash "$helper" commit; then printf 'Runtime catalog accepted\n' >&2; exit 1; fi
printf '{"name":"mock","version":"1.0.0"}\n' > packages/public/mock/package.json
bash "$helper" commit
[[ ! -e "$ref" && "$(<"$state/last")" == "$last" ]]
bash "$helper" finish
[[ -f "$ref" && ! -e "$state" ]]
grep -q "^Source-Commit: $last$" "$ref"
grep -q '^Updated-At: ' "$ref"
grep -q 'Preserve the destination version' "$ref"
[[ "$(wc -l < "$fixture/commits" | tr -d ' ')" == 2 ]]
cp "$ref" "$fixture/expected-ref"
plan=$(bash "$helper" plan mock)
[[ "$plan" != *"original message"* ]]
cmp "$ref" "$fixture/expected-ref"
printf 'Mock replay tests passed: two commits, preserved author/message/version, one final REF.md.\n'
