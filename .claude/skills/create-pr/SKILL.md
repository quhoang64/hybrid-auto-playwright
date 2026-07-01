---
name: create-pr
description: Creates a branch, commits staged work, pushes, and opens a PR with auto-generated description. Handles sub-branch strategy when a parent branch has an open PR. Invoked with /create-pr or from the test-generator-e2e prompt chaining menu.
allowed-tools: Bash, Read
---

# Create PR

Automates the full git workflow: branch → commit → push → PR with description.

## When to Use

Invoke with `/create-pr` or when user says: "create PR", "push and open PR", "submit for review".
Also triggered from the test-generator-e2e prompt chaining menu after 2 consecutive test passes.

---

## PR Naming Conventions

### Branch name
```
test/<feature-tag>                          # new branch from main
test/<parent-feature-tag>-<feature-tag>     # sub-branch from unmerged parent
```
Examples:
```
test/make-appointment
test/make-appointment-history-appointment   # depends on make-appointment
```

### PR title — Conventional Commits style
```
type(scope): short description
```

| Type | When |
|------|------|
| `test` | adding or updating test files / page objects |
| `feat` | new framework feature (new component, new fixture, new helper) |
| `fix` | fixing a failing test or broken locator |
| `refactor` | restructuring existing code without changing behavior |

Examples:
```
test(make-appointment): add smoke test for booking flow
test(history-appointment): verify appointment history matches submitted data
feat(datepicker): extract DatepickerComponent for reuse across pages
refactor(fixtures): add bookedAppointment fixture to reduce test duplication
```

Rules:
- `scope` = feature tag in kebab-case
- Description: imperative mood, no capital, no period — "add", "verify", "extract", NOT "Added", "Adds."
- Max 72 characters total

---

## Workflow

### Step 1 — Analyze Git State

Run the following checks:
```bash
git branch --show-current           # current branch
git status --short                  # uncommitted changes
git log main..HEAD --oneline        # commits ahead of main
git diff main --name-status         # files changed since main
gh pr list --state open --json number,title,headRefName  # open PRs
```

Present findings:
```
Current branch: main (or test/make-appointment)
Uncommitted changes: 3 files
  M  page-objects/HistoryPage.ts
  A  tests/e2e/historyAppointment.spec.ts
  ...

Open PRs: test/make-appointment → #12 "test(make-appointment): add smoke test"
```

---

### Step 2 — Determine Branch Strategy

**Case A — currently on `main`, no unmerged dependency:**
```
Suggested branch: test/<feature-tag>
Base branch:      main
```

**Case B — currently on an unmerged feature branch (open PR exists):**
```
⚠️  Current branch test/make-appointment has open PR #12 (not merged yet)
Suggested branch: test/make-appointment-history-appointment
Base branch:      test/make-appointment   ← inherits all parent changes
```

**Case C — currently on a feature branch, no open PR (already merged or local only):**
```
Suggested branch: test/<feature-tag>
Base branch:      main
```

Present the strategy and suggested branch name.

**WAIT for user confirmation.** User may rename the branch before proceeding.

---

### Step 3 — Stage, Commit & Push

Stage only relevant files (never `.env`, never unrelated files):
```bash
git add <file1> <file2> ...
```

Generate commit message following the same Conventional Commits format as the PR title:
```
test(history-appointment): verify appointment history matches submitted data
```

Then push:
```bash
git checkout -b <branch-name>   # if creating new branch
git push -u origin <branch-name>
```

Report: branch created and pushed.

---

### Step 4 — Generate PR Description

Auto-generate from git diff and file changes. Use this template:

```markdown
## Summary
- <bullet: what was added or changed, one line per logical unit>

## Test Coverage
| File | Type | Description |
|------|------|-------------|
| `tests/e2e/xxx.spec.ts` | NEW | <scenario name> |
| `page-objects/XxxPage.ts` | NEW | <page description> |
| `fixtures/index.ts` | UPDATED | <what was added> |

## Test Results
- ✅ 2 consecutive passes — `chromium`

## Dependencies
- _None_ (or: Depends on #PR_NUMBER — merge that branch first)
```

Present the full draft.

**WAIT for user confirmation.** User may edit before PR is created.

---

### Step 5 — Create PR

```bash
gh pr create \
  --title "<type>(<scope>): <description>" \
  --base <base-branch> \
  --body "<generated description>"
```

Report the PR URL.

---

## Golden Rules

1. **NEVER auto-proceed** — confirm branch name (Step 2) and PR description (Step 4) with user
2. **NEVER stage `.env`** or any file outside the current feature's scope
3. **NEVER push to `main` directly** — always create a feature branch
4. **ALWAYS set correct `--base`** — sub-branches must target the parent feature branch, not `main`
5. **ALWAYS use Conventional Commits format** for both commit message and PR title
6. **ALWAYS include test results** in the PR description (2 consecutive passes)
7. If `gh` is not authenticated → tell user to run `gh auth login` and stop
