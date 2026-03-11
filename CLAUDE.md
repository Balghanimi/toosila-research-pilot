# Toosila Project — Claude Code Instructions

## Rules
See CLAUDE_RULES.md for full development rules.

## Obsidian Vault Auto-Update

**Vault Location:** `D:\toosila-vault\`

After making significant code changes (new features, API changes, schema changes, new components, config changes), automatically update the relevant markdown files in the Obsidian vault at `D:\toosila-vault\`.

### When to update the vault:
- New or modified API endpoints → update `Backend/API-Routes-Overview.md` and relevant controller doc
- New or modified database models/schema → update `Architecture/Database-Schema.md` and relevant model doc
- New or modified React pages/components → update `Frontend/Pages-Map.md` or `Frontend/Components-Map.md`
- New features → create or update the relevant file in `Features/`
- Environment variable changes → update `DevOps/Environment-Variables.md`
- Bug fixes → update `Tracking/Bugs.md`
- Architecture decisions → update `Tracking/Decisions-Log.md`
- Any significant change → update `Tracking/Changelog.md` with date and summary

### Vault structure:
```
D:\toosila-vault\
├── Architecture/    — Tech stack, DB schema, project structure
├── Backend/         — API routes, auth, models, controllers
├── Frontend/        — Pages, components, contexts, PWA
├── Features/        — Feature documentation
├── DevOps/          — Env vars, deployment, CI/CD
├── Tracking/        — TODO, bugs, changelog, decisions
├── Templates/       — Templates for new docs
└── HOME.md          — Main index page
```

### Rules for vault updates:
- Keep docs concise and accurate
- Use `[[wiki-links]]` for cross-references between vault files
- Add tags: `#backend` `#frontend` `#database` `#feature` `#bug` `#decision` `#devops`
- Update `HOME.md` only when adding entirely new sections
- At the end of a session, briefly mention which vault files were updated

## Session Tracking (Auto-Resume)

**Status File:** `D:\toosila-vault\Tracking\SESSION-STATUS.md`

### On Session START:
1. Read `D:\toosila-vault\Tracking\SESSION-STATUS.md`
2. Summarize to the user: "Last time you were working on X. You completed Y. Next up is Z."
3. Ask: "Want to continue where you left off?"

### On Session END (when user says bye, done, yalla, خلص, or stops working):
1. Update `D:\toosila-vault\Tracking\SESSION-STATUS.md` with:
   - Date
   - What was done this session
   - What's in progress (not finished)
   - What's next (planned next steps)
   - Any blockers or issues
   - Files that were modified

### SESSION-STATUS.md Format:
```markdown
# Session Status
**Last Session:** YYYY-MM-DD
**Status:** [what you were in the middle of]

## Done (last session)
- [completed items]

## In Progress
- [unfinished work with details]

## Next Up
- [planned next steps in priority order]

## Blockers
- [any issues or things to resolve]

## Files Modified
- [list of recently changed files]
```

This file is the FIRST thing to read when starting a new session and the LAST thing to update before ending.
