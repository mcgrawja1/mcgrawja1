# Claude Usage — macOS Desktop Widget

A live desktop widget that shows your current **Claude usage window**: how long
until it **resets** and a **progress bar** through the 5‑hour window, with a small
footer for tokens used and estimated cost.

It runs on [Übersicht](https://tracesof.net/uebersicht/) (a free desktop‑widget
host) and reads usage from [`ccusage`](https://github.com/ryoppippi/ccusage),
which parses Claude Code's **local** `~/.claude` JSONL files. No API key, no login —
everything stays on your machine.

```
┌──────────────────────────────┐
│  CLAUDE USAGE              ●  │
│                              │
│  Resets in                   │
│  2h 14m                      │
│  at 3:45 PM                  │
│  ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░        │
│  128.4k tokens        $3.12  │
└──────────────────────────────┘
```

---

## How it works

Claude's limits run on a **rolling 5‑hour window** that starts with your first
message and resets 5 hours later. `ccusage blocks --active --json` reports the
active window's start/end time, tokens, and cost. The widget computes the
countdown and progress bar from those timestamps and refreshes every 15 seconds.

> Note: the 5‑hour window is reconstructed from your local Claude Code activity,
> so it tracks Claude **Code** usage. It's an estimate of the window, not an
> official server‑side meter — but it's accurate for "when does my limit reset?".

---

## Install (3 steps)

### 1. Install Übersicht

```sh
brew install --cask ubersicht
```

…or download it from <https://tracesof.net/uebersicht/> and drag it to
Applications. Launch it once (you'll see its icon in the menu bar).

### 2. Install `ccusage`

You need Node.js (or Bun). Then install ccusage globally so the widget can find it:

```sh
npm install -g ccusage
# or, with Bun:
bun install -g ccusage
```

(If you skip this, the widget falls back to `npx ccusage`, which works but is
slower on each refresh.)

Verify the data source works:

```sh
./check-usage.sh
```

You should see JSON containing a `blocks` array. If it's empty, just send a
message in Claude Code to start a window, then re-run.

### 3. Add the widget

Copy the widget folder into Übersicht's widgets directory:

```sh
cp -R claude-usage.widget "$HOME/Library/Application Support/Übersicht/widgets/"
```

Then click the Übersicht menu‑bar icon → **Refresh All Widgets**. The widget
appears in the top‑right of your desktop. Drag it anywhere you like (hold the
widget and move it; position is remembered).

---

## Customizing

Edit `claude-usage.widget/index.jsx`:

- **Position** — change `top` / `right` in `className` (e.g. use `left:` instead).
- **Refresh rate** — `refreshFrequency` (milliseconds). Default `15000` = 15s.
- **Size / colors** — tweak the CSS in `className`.
- **Bar thresholds** — `barColor()` switches green → amber → red at 60% / 85%.

After editing, refresh from the Übersicht menu.

---

## Troubleshooting

**"Couldn't read usage" / widget says ccusage isn't found.**
Übersicht runs commands in a minimal shell that may not see your Node install
(common with **nvm**). Fixes, in order of preference:

1. Install ccusage with a system Node or Bun so it lands on a standard PATH:
   ```sh
   brew install node && npm install -g ccusage
   # or
   brew install oven-sh/bun/bun && bun install -g ccusage
   ```
2. If you use nvm, make sure your login profile (`~/.zprofile` / `~/.zshrc`)
   loads nvm — the widget uses `zsh -lc`, which sources your login shell.
3. As a last resort, edit the `command` in `index.jsx` and hard‑code the full
   path to `ccusage` (find it with `which ccusage`).

**Widget shows "No active session."**
There's no active 5‑hour window — send a message in Claude Code to start one.

**Nothing appears at all.**
Confirm Übersicht is running (menu‑bar icon) and the folder is named exactly
`claude-usage.widget` inside `~/Library/Application Support/Übersicht/widgets/`,
then Refresh All Widgets.

---

## Files

| File | Purpose |
|------|---------|
| `claude-usage.widget/index.jsx` | The Übersicht widget (UI + data command). |
| `check-usage.sh` | Standalone test of the ccusage data source. |
| `README.md` | This file. |

## Credits

- [Übersicht](https://github.com/felixhageloh/uebersicht) by Felix Hageloh
- [ccusage](https://github.com/ryoppippi/ccusage) by ryoppippi
