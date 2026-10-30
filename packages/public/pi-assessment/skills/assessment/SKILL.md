---
name: assessment
description: Assess the current session for preferences, corrections, recurring workflows, missing capabilities, and agent mistakes, then recommend persistent improvements.
disable-model-invocation: true
---

# Assessment

Use only when the user explicitly runs or asks for this skill.

When you need to ask the user something (a confirmation, a preference, or a choice between
options), check whether you have a tool for asking questions and prefer it over plain-text
questions.

Before assessing, identify the Pi directory and its structure: where the global `AGENTS.md`,
the skills, and the extensions live. Use it to qualify the target of each recommendation.

## Invocation Modes

- **Live conversation** (default): when invoked with no argument, or an argument that is
  not a path to an existing file, assess the current session's live conversation as usual.
- **Session transcript file**: when invoked with an argument that is a path to an existing
  Markdown file starting with YAML frontmatter containing `session-name`, `session-cwd`,
  and `session-id` keys, `read` that file instead of relying on the live conversation:
  - Treat the file's body (everything after the closing `---`) as the full transcript to
    assess, in place of the live conversation.
  - Use the frontmatter's `session-name` and `session-cwd` for the report's `Context`
    field (e.g. `Context: Session "<session-name>" in <session-cwd>`), instead of
    describing the current session's own work.
  - All other workflow steps below (finding identification, confirmations, report format,
    safety) apply unchanged, scoped to the transcript file's content instead of the live
    conversation.
  - Once the assessment is finished (report saved, or the user declined a report), ask
    the user for confirmation to delete the transcript file, then delete it if confirmed.

Assess the current session and identify findings that may need persistent changes to agent behavior or workflow efficiency. Findings can include:

- requested changes or preferences
- corrections after agent behavior
- repeated manual workflows
- inefficient, fragile, or impractical command/script usage
- sessions where several reasoning steps or turns were needed to discover the right command, package location, workspace, dependency target, or execution pattern
- missing scripts, skills, extensions, tools, documentation, or conventions that would make future work simpler, safer, or faster
- missing tools/capabilities
- code review comments that imply future behavior changes
- agent mistakes, including ignored or partially applied user, `AGENTS.md`, or `SKILL.md` instructions

## Workflow

1. Review the session and identify one or more findings.
   - Split independent preferences, corrections, or actionables into separate findings.
   - Do not group multiple code preferences into one finding.
2. For each finding:
   - summarize the trigger in one sentence
   - categorize scope:
     - `global`: applies across sessions/projects, usually targeting the global Pi project
     - `project`: applies only to the current local project or repo where the assessment skill is running
     - `task-specific`: applies only to a specialized workflow; state whether the durable change belongs in the local project or the global Pi project
   - classify the best target:
     - `AGENTS.md`: broad, durable behavior preference
     - `skill`: task-specific workflow, checklist, or on-demand capability
     - `extension/tool`: automation, external service, UI/state integration, reusable code, or logic easier/safer to encode than infer repeatedly
     - `no change`: one-off, already covered, too narrow, noisy, harmful to persist, or not actionable yet
   - identify the exact project location for the target:
     - `global Pi project`: changes under the Pi installation directory, such as its `AGENTS.md` or one of the skills that are globally available from there
     - `local project`: changes under the current project/repo where the skill is running, such as `<current-project>/AGENTS.md`
   - check existing coverage before proposing changes:
     - read relevant `AGENTS.md` files
     - inspect overlapping skills
     - inspect extensions/tools only when tool capability is involved
   - recommend the smallest useful persistent change, if any
   - for workflow-efficiency findings, only recommend a durable change when the session provides concrete evidence of avoidable friction; do not invent hypothetical automation opportunities
   - when naming a target file in recommendations or proposed changes, always qualify whether it is in the `global Pi project` or the `local project`; do not write ambiguous targets such as only `AGENTS.md`.
3. Ask the user if a finding, scope, classification, target project, or proposed action is unclear.
   - Ask about one finding/recommendation at a time; do not bundle multiple independent decisions into one question.
   - When several recommendations need confirmation or preference input, ask sequential questions and wait for each answer before moving to the next.
4. Report findings and recommendations to the user using the same structured format as the report findings, then ask for confirmation before creating the assessment report.
   - Do not compress findings into a one-line list unless the user explicitly asks for a shorter summary.
   - Include each finding's trigger, scope, target project, recommendation, rationale, and proposed change.
   - If confirmation requires decisions on multiple findings/recommendations, collect those decisions one at a time before asking to create the report.
5. If there are more than two confirmed findings, create one temporary Markdown review file before saving the final assessment report.
   - Ask the user for confirmation before creating the temp file.
   - Use a clear temporary path at the root of the current project, named `tmp-assessment-findings-<timestamp>.md`.
   - Keep all confirmed findings in this single temp review file, even when some target the local project and others target the global Pi project.
   - Do not split findings by target project until saving the final assessment report.
6. After the user confirms creating the final assessment report, ask them what they want to do with the report that has the curated findings (for example, where to save it), and follow their answer.
7. Ask for confirmation before modifying persistent instructions, skills, or extensions unless the user explicitly asked for that edit.

## Report Format

Use this format for the report:

```markdown
# Assessment <date> <hour>:<min>

- Date: <date>
- Model: <model-and-thinking-level>
- Context: <brief-description-of-the-work-being-done-in-the-session>

## Findings

### <finding-title>

- Trigger: <trigger-brief-description>
- Scope: <global | project | task-specific> - <short-rationale-of-the-scope>
- Target project: <global Pi project | local project | none> - <exact root/path when applicable>
- Recommendation: <AGENTS.md | skill | extension/tool | no change> - <qualified target path, e.g. global Pi project `<pi-directory>/AGENTS.md` or local project `<project>/AGENTS.md`>

Rationale:

- <short reason>
- <short reason>

Proposed change:

- <specific file/action with qualified project location, or "none">
```

In the assistant response, keep the findings in the structured format above, summarize recommendations concisely, and state whether confirmation is needed before making proposed changes.

## Safety

- Do not weaken existing instructions or skills.
- Do not overwrite user-owned work.
- Keep recommendations minimal and actionable.
- Preserve explicit confirmation gates from existing instructions and skills.
