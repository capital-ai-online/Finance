#!/usr/bin/env bash
set -euo pipefail

MIN_GGSHIELD_MAJOR=1
MIN_GGSHIELD_MINOR=51
MIN_GGSHIELD_PATCH=0

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

command -v git >/dev/null 2>&1 || fail "git is required."
git rev-parse --show-toplevel >/dev/null 2>&1 || fail "Run this command inside a Git working tree."

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

command -v ggshield >/dev/null 2>&1 || fail \
  "ggshield is not installed. Install or upgrade it first, then authenticate with: ggshield auth login"

version_raw="$(ggshield --version 2>/dev/null || true)"
version="$(printf '%s\n' "$version_raw" | grep -Eo '[0-9]+\.[0-9]+\.[0-9]+' | head -n 1 || true)"
[[ -n "$version" ]] || fail "Could not determine ggshield version from: ${version_raw:-<empty>}"

IFS='.' read -r major minor patch <<<"$version"
if (( major < MIN_GGSHIELD_MAJOR )) \
  || (( major == MIN_GGSHIELD_MAJOR && minor < MIN_GGSHIELD_MINOR )) \
  || (( major == MIN_GGSHIELD_MAJOR && minor == MIN_GGSHIELD_MINOR && patch < MIN_GGSHIELD_PATCH )); then
  fail "ggshield >= 1.51.0 is required for Claude Code + Codex AI hooks; found $version."
fi

printf 'Using ggshield %s\n' "$version"
printf 'Installing project-local GitGuardian AI hooks without --force...\n'

# GitGuardian's installer merges its entries into existing supported hook
# configuration. Do not use --force here: CAPITAL-AI already has Claude hooks.
ggshield install -t claude-code -m local
ggshield install -t codex -m local

printf '\nGitGuardian AI hooks installed for this working copy.\n'
printf 'Verify authentication before using the agents: ggshield auth login\n'
printf 'Optional API connectivity check: ggshield api-status\n'
printf 'Do not commit API tokens, generated credentials, or secret values.\n'
