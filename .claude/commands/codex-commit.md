---
description: Inspect changes, understand context, and commit with intelligent messages
---

# Commit Helper

Review uncommitted changes, understand context, and create commits with clear messages.

## Workflow

1. **Discover changes**: Run `git status` and `git diff` to see all modifications
2. **Categorize**: Group by type (refactor, feature, fix, docs, chore)
3. **Analyze diffs**: Review line-by-line changes in key files
4. **Generate message**: Create a structured commit message with:
   - Type prefix (feat/fix/refactor/docs/chore)
   - Clear subject line
   - Detailed explanation of changes
5. **Present to user**: Show the proposed message with option to accept, customize, or cancel

## Guidelines

- Don't guess. If unclear, ask for clarification.
- Reference specific files and line numbers.
- Keep commit messages concise but complete.
- Group logically related changes together.
- If more than 5 files modified, suggest splitting into multiple commits.

## Process

1. Run `git status` to see all unstaged changes
2. Run `git diff` to examine modifications in detail
3. For each modified file, understand what changed and why
4. Group related changes into logical commits
5. Generate commit message(s) that reflect the grouped changes
6. Present options to user: accept, customize, or cancel
