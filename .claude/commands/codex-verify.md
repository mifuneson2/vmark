---
description: Autonomous verification auditor - confirms fixes from a previous audit report
---

## User Input

```text
$ARGUMENTS
```

## Verification Checklist

Use TodoWrite to track progress through these phases:

```
☐ Parse audit report and extract issues
☐ Dimension 1: Verify Redundant & Low-Value Code fixes
☐ Dimension 2: Verify Security & Risk Management fixes
☐ Dimension 3: Verify Code Correctness & Reliability fixes
☐ Dimension 4: Verify Compliance & Standards fixes
☐ Dimension 5: Verify Maintainability & Readability fixes
☐ Dimension 6: Verify Performance & Efficiency fixes
☐ Dimension 7: Verify Testing & Validation fixes
☐ Dimension 8: Verify Dependency & Environment Safety fixes
☐ Dimension 9: Verify Documentation & Knowledge Transfer fixes
☐ Generate verification report
```

## Execution

**CRITICAL**: This command verifies fixes from a PREVIOUS audit. It does NOT discover new issues.

### Phase 1: Input Parsing

`$ARGUMENTS` should contain or reference the previous audit report:
- If empty: Look for recent conversation output containing "Audit Report"
- If file path: Read that audit report
- If contains "Critical Issues": Use as inline report

**Pre-check** — If no audit report found, respond:
```
No previous audit report found.

Options:
1. Run /project:codex-audit first to generate baseline
2. Provide report: /project:codex-verify path/to/audit-report.md
3. Paste inline: /project:codex-verify [audit report text]
```
And STOP.

### Phase 2: Verify Fixes

**Prefer Codex MCP** for verification when available:
1. Use `ToolSearch` with query `+codex` to discover the Codex MCP tool
2. If found, delegate verification to Codex with the audit report and instructions below
3. If Codex is unavailable, verify manually using Read/Grep

**Verification instructions** (for Codex delegation or manual execution):

1. **Extract Issue Checklist by Dimension**:
   Parse all issues organized by the 9 audit dimensions.

2. **Verify Each Issue**:
   For each issue from the report:
   - Read the file at the exact location
   - Check if the issue still exists
   - Mark status:
     - ✅ FIXED — Issue resolved properly
     - ❌ NOT FIXED — Issue still present
     - ⚠️ PARTIAL — Partially addressed
     - 🔄 MOVED — Code relocated, verify new location

3. **Quick Spot Check** (5 min max):
   - Only check files that were modified
   - Look for obvious new problems introduced by fixes
   - DO NOT run comprehensive scan

### Phase 3: Generate Report

```markdown
# Verification Report

**Date**: {today}
**Original Audit**: {audit date/file}
**Status**: ✅ PASSED / ⚠️ PARTIAL / ❌ FAILED

## Summary by Dimension

| Dimension | Fixed | Not Fixed | Partial | Total |
|-----------|-------|-----------|---------|-------|
| 1. Redundant Code | X | X | X | X |
| 2. Security | X | X | X | X |
| 3. Correctness | X | X | X | X |
| 4. Compliance | X | X | X | X |
| 5. Maintainability | X | X | X | X |
| 6. Performance | X | X | X | X |
| 7. Testing | X | X | X | X |
| 8. Dependencies | X | X | X | X |
| 9. Documentation | X | X | X | X |
| **TOTAL** | **X** | **X** | **X** | **X** |

## Verification Details

### Dimension 1: Redundant & Low-Value Code
| Issue | File:Line | Status | Notes |
|-------|-----------|--------|-------|
| {description} | {file:line} | ✅/❌/⚠️ | {notes} |

[Continue for all 9 dimensions]

## Remaining Issues (Not Fixed)

| Priority | Dimension | Issue | File:Line |
|----------|-----------|-------|-----------|
| Critical | X | {issue} | {file:line} |

## New Issues Introduced (if any)

| Severity | Dimension | Issue | File:Line |
|----------|-----------|-------|-----------|
| ... | ... | ... | ... |

## Verdict

{APPROVED FOR RELEASE / NEEDS MORE WORK / BLOCKED}

## Next Steps
{What needs to be done if not passed}
```

### Phase 4: Fallback — Manual Verification

**CRITICAL**: If Codex returns empty/no response, you MUST verify manually.

When Codex returns nothing:

1. **Parse the audit report** to extract all issues organized by 9 dimensions
2. **Create todo list** with verification tasks for each dimension
3. **Read each file** at the specified lines
4. **Check if the issue still exists**:
   - Compare current code against the reported issue
   - Mark status: ✅ FIXED, ❌ NOT FIXED, ⚠️ PARTIAL, 🔄 MOVED
5. **Mark each dimension complete** as you verify it
6. **Generate the verification report** in the same format as Phase 3

**Do NOT say "Codex didn't return findings" and stop. Always complete verification manually if Codex fails.**
