# claude-mods

Mods for [Claude Code](https://claude.com/claude-code).

## Install

In a terminal Claude Code session:

```
/plugin install <mod> --marketplace cokelaer/claude-mods
```

Answer `y` to add the marketplace, then pick a scope (user scope loads it in every session).

## Mods

### status-band

Band above the prompt showing model, idle/working state, context usage bar, cost, git branch,
effort, and 5-hour / weekly rate limits with their reset times.

```
/plugin install status-band --marketplace cokelaer/claude-mods
```

- `/status-band` toggles the band (hide and show).
- `ctrl+x` `tab`, then `x` hides it from the keyboard.
- The ✕ button responds to the mouse only in fullscreen mode; the keyboard routes work everywhere.
