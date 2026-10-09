# claude-mods

Mods for [Claude Code](https://claude.com/claude-code).

## Install

In a terminal Claude Code session:

```
/plugin install <mod> --marketplace cokelaer/claude-mods
```

Answer `y` to add the marketplace, then pick a scope (user scope loads it in every session).

## Update

To pick up a new version:

```
/plugin marketplace update claude-mods
/plugin update status-band
```

Then restart the session. 

## Mods

### status-band

Band above the prompt showing model, idle/working state, context usage bar, cost, git branch,
effort, and 5-hour / weekly rate limits with their reset times.

```
/plugin install status-band --marketplace cokelaer/claude-mods
```

- `/status-band [top|off]` shows the band above the prompt or hides it. No argument toggles.
- `ctrl+x` `tab`, then `x` hides it from the keyboard.
- The ✕ button responds to the mouse only in fullscreen mode; the keyboard routes work everywhere.
