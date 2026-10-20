---
id: decision-6
title: Show Rewrite and Simple tabs on Pi with two parallel completions
date: '2026-10-20 16:24'
status: accepted
---
## Context

Users found SLYE's rewrite too literal when the source is not heavy jargon: it often came back nearly identical. The user asked for a second, full rewrite based on the MIT-licensed [unslop](https://github.com/cursor/plugins/blob/main/pstack/skills/unslop/SKILL.md) skill, kept next to the existing lighter rewrite and switchable with clickable tabs. A Pi 1.3.0 spike showed that an entry renderer wrapped in `MouseRegion` receives clicks in fullscreen mode, that regular mode leaves the mouse to the terminal, and that an extension shortcut plus a status update re-renders the card in both modes. OMP routes inline clicks only to its own subagent cards. Work is tracked in [TASK-21](../tasks/task-21%20-%20Add-Rewrite-and-Simple-tabs-to-the-SLYE-companion-card-on-Pi.md).

## Decision

On Pi, make two parallel completions per rewrite with the same model: Simple with the selected prompt and Rewrite with a built-in unslop-based prompt. Append one immutable companion holding both texts only when both succeed, because a companion cannot be updated later and a half card could never be completed. Keep the Simple text in the existing `display` field and the Rewrite text in a new `rewrite` field, so old cards, OMP, and duplicate detection keep working.

Show both as tabs on the card's heading line, Rewrite first. Select a tab by clicking (fullscreen) or with `ctrl+\` (all modes); `alt+s` was rejected because iTerm2 with Option set to Normal does not send it. Keep one in-memory active tab for all cards, unpersisted, rather than per-card state that a shortcut could not target. A custom `slye-prompt.md` replaces only the Simple prompt.

Render the Pi card with the theme's `customMessageBg` at half saturation instead of a fixed color, so light and dark themes both stay readable while avoiding Pi 1.0's saturated default violet. A rounded border was rejected because its side characters end up in copied text.

Leave OMP unchanged for now: one Simple completion, no tabs, no shortcut. Stacking both versions on OMP was rejected as visually poor. Keep the tab UI in its own module and reach its mouse and color helpers through a namespace import: OMP's TUI library lacks them, and a named import of a missing member would stop OMP from loading SLYE. Support only the current Pi release; older Pi hosts are out of scope.

## Consequences

Each Pi rewrite costs about twice as much as before, automatic rewrites included, and its latency is that of the slower completion. A failure of either completion discards the other. Mouse selection works only in Pi fullscreen mode; the shortcut is the portable path, and its re-render relies on a status update because Pi gives shortcut handlers no render request. The Rewrite prompt intentionally deletes pure-hype sentences, so it can be shorter than the source. If the Simple tab turns out to be unused, it can be removed in a later change.
