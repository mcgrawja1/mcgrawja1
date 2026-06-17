// Claude Usage — Übersicht widget
// Shows time-to-reset for the active Claude 5-hour usage window, plus a
// progress bar through that window. Data comes from `ccusage`, which reads
// Claude Code's local ~/.claude JSONL files (no API key needed).
//
// See README.md for install + troubleshooting (especially node/PATH for nvm).

// How often to re-run ccusage (ms). The 5-hour window is long, so a refresh
// every 15s keeps the countdown lively without hammering the disk.
export const refreshFrequency = 15000;

// Find node/ccusage across common install locations, then ask ccusage for the
// active 5-hour block as JSON. Falls back to bunx/npx if ccusage isn't on PATH.
// `zsh -lc` loads your login profile so nvm/Homebrew node is picked up.
export const command = `zsh -lc 'export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.bun/bin:$HOME/.npm-global/bin:$HOME/.local/bin:$PATH"; { ccusage blocks --active --json 2>/dev/null || bunx ccusage blocks --active --json 2>/dev/null || npx -y ccusage@latest blocks --active --json 2>/dev/null; }'`;

// ---- helpers ---------------------------------------------------------------

const pad = (n) => String(n).padStart(2, "0");

// "2h 14m" style countdown.
const fmtRemaining = (ms) => {
  if (ms <= 0) return "0m";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${pad(m)}m` : `${m}m`;
};

// Local wall-clock time of reset, e.g. "3:45 PM".
const fmtClock = (date) =>
  date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

const fmtTokens = (n) => {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
};

// ccusage's token fields may be nested under tokenCounts or flat; sum defensively.
const totalTokensOf = (b) => {
  if (typeof b.totalTokens === "number") return b.totalTokens;
  const tc = b.tokenCounts || b;
  const fields = [
    "inputTokens",
    "outputTokens",
    "cacheCreationInputTokens",
    "cacheReadInputTokens",
  ];
  const sum = fields.reduce((acc, k) => acc + (Number(tc[k]) || 0), 0);
  return sum || null;
};

// Color the bar green -> amber -> red as the window fills up.
const barColor = (p) => {
  if (p < 0.6) return "#37d67a";
  if (p < 0.85) return "#ffb02e";
  return "#ff5252";
};

// ---- styling ---------------------------------------------------------------

export const className = `
  top: 24px;
  right: 24px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  color: #fff;
  width: 260px;
  padding: 16px 18px;
  border-radius: 16px;
  background: rgba(20, 22, 28, 0.72);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);

  .cu-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
    margin-bottom: 10px;
  }
  .cu-dot { width: 8px; height: 8px; border-radius: 50%; background: #37d67a; box-shadow: 0 0 8px #37d67a; }
  .cu-dot.idle { background: rgba(255,255,255,0.3); box-shadow: none; }

  .cu-reset-label { font-size: 12px; color: rgba(255,255,255,0.55); }
  .cu-reset { font-size: 30px; font-weight: 600; line-height: 1.1; margin: 2px 0 2px; }
  .cu-clock { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 14px; }

  .cu-track {
    height: 8px;
    width: 100%;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.12);
    overflow: hidden;
  }
  .cu-fill { height: 100%; border-radius: 6px; transition: width 0.6s ease; }

  .cu-foot {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 12px;
  }
  .cu-foot b { color: rgba(255,255,255,0.85); font-weight: 600; }

  .cu-msg { font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.4; }
  .cu-msg small { color: rgba(255,255,255,0.45); }
`;

// ---- render ----------------------------------------------------------------

export const render = ({ output }) => {
  let data;
  try {
    data = JSON.parse(output);
  } catch (e) {
    return (
      <div className="cu-msg">
        Couldn’t read usage.
        <br />
        <small>Is <b>ccusage</b> installed and on PATH? See README.</small>
      </div>
    );
  }

  const blocks = (data && data.blocks) || [];
  const active = blocks.find((b) => b.isActive) || blocks[0];

  if (!active) {
    return (
      <div>
        <div className="cu-head">
          <span>Claude Usage</span>
          <span className="cu-dot idle" />
        </div>
        <div className="cu-msg">
          No active session.
          <br />
          <small>Send a message in Claude Code to start a window.</small>
        </div>
      </div>
    );
  }

  const now = Date.now();
  const start = Date.parse(active.startTime);
  const end = Date.parse(active.endTime);
  const span = Math.max(end - start, 1);
  const remaining = Math.max(end - now, 0);
  const progress = Math.min(Math.max((now - start) / span, 0), 1);

  const tokens = totalTokensOf(active);
  const cost = typeof active.costUSD === "number" ? active.costUSD : null;

  return (
    <div>
      <div className="cu-head">
        <span>Claude Usage</span>
        <span className="cu-dot" />
      </div>

      <div className="cu-reset-label">Resets in</div>
      <div className="cu-reset">{fmtRemaining(remaining)}</div>
      <div className="cu-clock">at {fmtClock(new Date(end))}</div>

      <div className="cu-track">
        <div
          className="cu-fill"
          style={{ width: `${(progress * 100).toFixed(1)}%`, background: barColor(progress) }}
        />
      </div>

      <div className="cu-foot">
        <span>
          <b>{fmtTokens(tokens)}</b> tokens
        </span>
        <span>{cost != null ? <b>${cost.toFixed(2)}</b> : null}</span>
      </div>
    </div>
  );
};
