import Link from "next/link";
import { appConfig } from "@/lib/config";

/* ────────────────────────────────────────────────────────────────────────
   ANTIPODE — THE MIRROR
   A single vertical seam splits the page. LEFT = PHYSICAL (warm copper,
   grainy, real). RIGHT = DIGITAL TWIN (cool cyan wireframe, glowing, live).
   Five components share one coordinate; sync threads cross the seam and carry
   a copper→cyan data pulse — the doubling/reflection IS the visual thesis.
   Server component: all motion is CSS, gated by prefers-reduced-motion.
   ──────────────────────────────────────────────────────────────────────── */

const ACCENT = "#40c8d0"; // cyan — the digital plane
const COPPER = "#d08a40"; // copper — the physical plane
const COPPER_DIM = "#7a5a30";
const AMBER = "#e0903a"; // warning family (warm)
const INK = "#06070b";
const CAP = "#8b95a2"; // mono microcaptions — ≥4.5:1 on INK

const MONO = "var(--font-geist-mono), 'SF Mono', ui-monospace, Menlo, monospace";
const SANS = "var(--font-sans), ui-sans-serif, system-ui, -apple-system, sans-serif";

/* seam brightness gradient — bright through masthead+hero (0–34%) and the
   stats+CTA close (79–95%), dimmed through the intro/terminal/globe prose
   bands (35–74%). Calibrated to the rendered section offsets. */
const SEAM_GRADIENT = `linear-gradient(180deg,
  rgba(64,200,208,0.40) 0%,
  rgba(64,200,208,0.95) 5%,
  rgba(64,200,208,0.92) 32%,
  rgba(64,200,208,0.12) 35.5%,
  rgba(64,200,208,0.12) 74%,
  rgba(64,200,208,0.55) 79%,
  rgba(64,200,208,0.95) 85%,
  rgba(64,200,208,0.90) 95%,
  rgba(64,200,208,0.28) 100%)`;

/* matched component pairs — physical node ↔ its live twin reading.
   ROWS holds the shared vertical coordinate (the "same coordinate" motif). */
const PAIRS = [
  { id: "VRM-1", twin: "rail 1: 12.04 V", warn: false },
  { id: "VRM-2", twin: "rail 2: 12.01 V", warn: false },
  { id: "VRM-3", twin: "VRM-3 temp: 84°C ▲", warn: true },
  { id: "MCU", twin: "core: 62.4°C · ok", warn: false },
  { id: "I-2", twin: "current: 2.1 A ▲", warn: true },
];
const ROWS = [48, 104, 160, 216, 272]; // local y for each PAIRS row

/* ── PHYSICAL board art (warm copper PCB), drawn at an offset ─────────────── */
function PhysicalBoardArt({ ox, oy, idp }: { ox: number; oy: number; idp: string }) {
  return (
    <g transform={`translate(${ox} ${oy})`}>
      <defs>
        <linearGradient id={`${idp}-sub`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a1206" />
          <stop offset="1" stopColor="#0e0a04" />
        </linearGradient>
        <filter id={`${idp}-grain`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.05" />
          </feComponentTransfer>
          <feComposite operator="over" in2="SourceGraphic" />
        </filter>
      </defs>

      <g filter={`url(#${idp}-grain)`}>
        <rect x="0" y="0" width="280" height="320" rx="8" fill={`url(#${idp}-sub)`} stroke={COPPER_DIM} strokeWidth="1" />

        {/* mounting holes */}
        {[[14, 14], [266, 14], [14, 306], [266, 306]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="5" fill={INK} stroke={COPPER_DIM} strokeWidth="1.2" />
        ))}

        {/* horizontal copper runs to the seam-facing header pins */}
        {ROWS.map((y) => (
          <line key={`t${y}`} x1="40" y1={y} x2="280" y2={y} stroke={COPPER} strokeWidth="1" opacity="0.5" />
        ))}
        {/* vertical bus traces filling the seam-facing (right) half */}
        {[150, 176, 202, 228].map((x) => (
          <line key={`v${x}`} x1={x} y1="34" x2={x} y2="286" stroke={COPPER} strokeWidth="0.6" opacity="0.22" />
        ))}
        {/* routed trace bundle jogging toward the header pins */}
        {ROWS.map((y, i) => (
          <polyline
            key={`b${y}`}
            points={`120,${y} 150,${y} 168,${y - 5} 236,${y - 5} 254,${y} 274,${y}`}
            fill="none"
            stroke={COPPER}
            strokeWidth="0.7"
            opacity={i % 2 ? 0.28 : 0.36}
          />
        ))}

        {/* silkscreen */}
        <text x="196" y="30" fontSize="7" fontFamily="monospace" fill="#9a7038" letterSpacing="0.5">A7-04 · REV C</text>
        <text x="250" y="300" fontSize="7" fontFamily="monospace" fill="#8a6430">2431</text>

        {/* passive arrays (resistors) in the right half */}
        {[[150, 76], [172, 76], [206, 132], [150, 244], [176, 244], [212, 188]].map(([x, y], i) => (
          <g key={`p${i}`}>
            <rect x={x} y={y - 3} width="12" height="6" rx="1" fill="#241a0c" stroke="#5a4424" strokeWidth="0.8" />
            <line x1={x - 3} y1={y} x2={x} y2={y} stroke={COPPER} strokeWidth="0.6" opacity="0.5" />
            <line x1={x + 12} y1={y} x2={x + 15} y2={y} stroke={COPPER} strokeWidth="0.6" opacity="0.5" />
          </g>
        ))}
        {/* vias */}
        {[[162, 104], [200, 160], [238, 216], [188, 272], [214, 76], [158, 188]].map(([x, y], i) => (
          <circle key={`via${i}`} cx={x} cy={y} r="1.6" fill="#0e0a04" stroke="#6a4f28" strokeWidth="0.7" />
        ))}
        {/* electrolytic caps */}
        {[[110, 40], [138, 40]].map(([cx, cy], i) => (
          <circle key={`c${i}`} cx={cx} cy={cy} r="8" fill="#241a0c" stroke="#5a4424" strokeWidth="1.4" />
        ))}

        {/* header pins on the inner (seam-facing) edge */}
        {ROWS.map((y) => (
          <rect key={`hp${y}`} x="274" y={y - 3} width="12" height="6" rx="1" fill="#e3b35a" />
        ))}
        {[76, 132, 188, 244].map((y) => (
          <rect key={`hd${y}`} x="277" y={y - 2} width="9" height="4" rx="1" fill="#b48a4a" opacity="0.8" />
        ))}

        {/* labeled components anchored on their shared row */}
        {PAIRS.map((p, i) => {
          const y = ROWS[i];
          const c = p.warn ? AMBER : COPPER;
          if (p.id === "MCU") {
            return (
              <g key={p.id}>
                <rect x="66" y={y - 20} width="84" height="40" rx="3" fill="#15100a" stroke="#4a3a20" strokeWidth="1" />
                {Array.from({ length: 6 }).map((_, k) => (
                  <rect key={k} x={70 + k * 13} y={y + 20} width="4" height="7" fill="#7a5a30" />
                ))}
                <text x="108" y={y + 4} textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#a07a40">MCU</text>
              </g>
            );
          }
          return (
            <g key={p.id}>
              <rect x="56" y={y - 12} width="46" height="24" rx="2" fill="#15100a" stroke={c} strokeWidth="1" />
              <circle cx="46" cy={y} r="3" fill={c} opacity="0.9" />
              <text x="79" y={y + 4} textAnchor="middle" fontSize="8.5" fontFamily="monospace" fill={c}>{p.id}</text>
            </g>
          );
        })}
      </g>
    </g>
  );
}

/* ── DIGITAL twin art (cyan wireframe + live readouts), drawn at an offset ── */
function TwinBoardArt({ ox, oy, idp }: { ox: number; oy: number; idp: string }) {
  return (
    <g transform={`translate(${ox} ${oy})`}>
      <defs>
        <filter id={`${idp}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width="280" height="320" rx="8" fill="none" stroke={ACCENT} strokeWidth="1" opacity="0.6" filter={`url(#${idp}-glow)`} />
      <rect x="0" y="0" width="280" height="320" rx="8" fill={ACCENT} opacity="0.03" />

      {[[14, 14], [266, 14], [14, 306], [266, 306]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="5" fill="none" stroke={ACCENT} strokeWidth="1" opacity="0.5" />
      ))}

      {/* ghost wireframe detail on the seam-facing (left) half */}
      {[26, 52, 78].map((x) => (
        <line key={`gv${x}`} x1={x} y1="34" x2={x} y2="286" stroke={ACCENT} strokeWidth="0.5" opacity="0.12" />
      ))}
      {[76, 132, 188, 244].map((y) => (
        <line key={`gh${y}`} x1="10" y1={y} x2="104" y2={y} stroke={ACCENT} strokeWidth="0.5" opacity="0.12" />
      ))}
      {[[40, 104], [64, 216], [40, 272]].map(([x, y], i) => (
        <rect key={`gb${i}`} x={x} y={y - 6} width="16" height="12" rx="1" fill="none" stroke={ACCENT} strokeWidth="0.7" opacity="0.18" />
      ))}

      {/* wireframe traces per row */}
      {ROWS.map((y) => (
        <line key={`t${y}`} x1="6" y1={y} x2="220" y2={y} stroke={ACCENT} strokeWidth="0.8" opacity="0.32" />
      ))}

      {/* header pins on the inner (seam-facing) edge — mirrored to the left */}
      {ROWS.map((y) => (
        <rect key={`hp${y}`} x="-6" y={y - 3} width="12" height="6" rx="1" fill="none" stroke={ACCENT} strokeWidth="0.9" opacity="0.75" />
      ))}
      {[76, 132, 188, 244].map((y) => (
        <rect key={`hd${y}`} x="-4" y={y - 2} width="9" height="4" rx="1" fill="none" stroke={ACCENT} strokeWidth="0.7" opacity="0.45" />
      ))}

      {/* twin components (mirror of the physical layout) */}
      {PAIRS.map((p, i) => {
        const y = ROWS[i];
        const stroke = p.warn ? AMBER : ACCENT;
        if (p.id === "MCU") {
          return (
            <g key={p.id} filter={`url(#${idp}-glow)`}>
              <rect x="130" y={y - 20} width="84" height="40" rx="3" fill="none" stroke={ACCENT} strokeWidth="1" opacity="0.8" />
            </g>
          );
        }
        return (
          <g key={p.id}>
            <rect x="170" y={y - 12} width="46" height="24" rx="2" fill="none" stroke={stroke} strokeWidth="1" opacity="0.85" filter={`url(#${idp}-glow)`} />
            <circle cx="226" cy={y} r="3" fill={stroke} opacity="0.9" />
          </g>
        );
      })}

      {/* live readouts — placed ABOVE each component so no trace strikes them */}
      {PAIRS.map((p, i) => {
        const y = ROWS[i];
        const isMcu = p.id === "MCU";
        return (
          <text
            key={p.id}
            x={isMcu ? 120 : 150}
            y={isMcu ? y - 26 : y - 18}
            fontSize="11"
            fontFamily="monospace"
            fill={p.warn ? AMBER : ACCENT}
            opacity="0.95"
          >
            {p.twin}
          </text>
        );
      })}
    </g>
  );
}

/* small globe with the antipodal line Europe → Auckland, straddling the seam */
function AntipodeGlobe() {
  return (
    <svg viewBox="0 0 180 180" className="h-44 w-44 md:h-48 md:w-48" aria-hidden>
      <circle cx="90" cy="90" r="70" fill="none" stroke="#3a4250" strokeWidth="1.1" />
      {[26, 44, 62].map((r) => (
        <ellipse key={r} cx="90" cy="90" rx={r} ry="70" fill="none" stroke="#323945" strokeWidth="0.7" />
      ))}
      {[90, 58, 122, 40, 140].map((cy) => (
        <line key={cy} x1="20" y1={cy} x2="160" y2={cy} stroke="#323945" strokeWidth="0.7" />
      ))}
      {/* copper node (Europe, left of seam) → cyan node (Auckland, right of seam) */}
      <line x1="66" y1="58" x2="118" y2="126" stroke={ACCENT} strokeWidth="1.2" strokeDasharray="3 3.5" opacity="0.85" />
      <circle cx="66" cy="58" r="4" fill={COPPER} />
      <circle cx="66" cy="58" r="7.5" fill="none" stroke={COPPER} strokeWidth="0.8" opacity="0.5" />
      <circle cx="118" cy="126" r="4" fill={ACCENT} />
      <circle cx="118" cy="126" r="7.5" fill="none" stroke={ACCENT} strokeWidth="0.8" opacity="0.5" />
      <text x="66" y="44" textAnchor="middle" fontSize="10" fontFamily="monospace" fill={COPPER}>EUROPE</text>
      <text x="118" y="146" textAnchor="middle" fontSize="10" fontFamily="monospace" fill={ACCENT}>AUCKLAND</text>
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-[#cfd4da]" style={{ background: INK, fontFamily: SANS }}>
      {/* ░░░ BACKGROUND LAYER — washes + the single choreographed seam ░░░ */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        {/* tonal wash: warm on the left half, cool on the right half (desktop) */}
        <div className="absolute inset-0 hidden md:block">
          <div className="absolute inset-y-0 left-0 w-1/2" style={{ background: "radial-gradient(120% 80% at 100% 26%, rgba(208,138,64,0.10), transparent 60%)" }} />
          <div className="absolute inset-y-0 right-0 w-1/2" style={{ background: "radial-gradient(120% 80% at 0% 26%, rgba(64,200,208,0.12), transparent 60%)" }} />
        </div>
        {/* the seam — one element, brightness varies deliberately down the page:
            bright through masthead+hero, dim through prose/terminal/globe,
            re-brightening at the stats+CTA close. Sits BEHIND all content. */}
        <div className="absolute inset-y-0 left-1/2 hidden -translate-x-1/2 md:block" style={{ width: "5px", filter: "blur(3px)", opacity: 0.55, background: SEAM_GRADIENT }} />
        <div className="absolute inset-y-0 left-1/2 hidden -translate-x-1/2 md:block" style={{ width: "2px", background: SEAM_GRADIENT }} />
      </div>

      <main className="relative z-10">
        {/* ═══ MASTHEAD — brand sits ON the seam ═══ */}
        <header className="relative">
          <div className="absolute left-0 top-4 hidden w-1/2 justify-start pl-6 md:flex">
            <Link href="/login" className="btn-ghost px-5 text-[12px] uppercase tracking-[0.2em]" style={{ fontFamily: MONO, background: "transparent", border: "none", color: COPPER }}>
              ← sign in
            </Link>
          </div>
          <div className="absolute right-0 top-4 hidden w-1/2 justify-end pr-6 md:flex">
            <Link href="/signup" className="btn-primary px-6 text-[12px] uppercase tracking-[0.2em]" style={{ fontFamily: MONO }}>
              pair the twin →
            </Link>
          </div>

          <div className="flex flex-col items-center pt-6 pb-2">
            <div className="text-3xl font-semibold tracking-[0.32em]" style={{ color: "#f4f6f8" }}>
              ANTI<span style={{ color: ACCENT }}>PODE</span>
            </div>
            <div className="mt-2 text-[11px] tracking-[0.34em] uppercase" style={{ fontFamily: MONO, color: CAP }}>
              Auckland 36°S · the opposite plane
            </div>
            {/* mobile auth (seam rotates 90° on small screens) */}
            <div className="mt-4 flex items-center gap-3 md:hidden">
              <Link href="/signup" className="btn-primary px-5 text-[12px] uppercase tracking-[0.18em]" style={{ fontFamily: MONO }}>
                pair the twin →
              </Link>
              <Link href="/login" className="btn-ghost px-5 text-[12px] uppercase tracking-[0.18em]" style={{ fontFamily: MONO }}>
                sign in
              </Link>
            </div>
          </div>
        </header>

        {/* ═══ HEADLINE — the claim, above the proof (single <h1>) ═══ */}
        <section className="px-6 pt-6 pb-8">
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-baseline gap-x-6 gap-y-1 md:grid-cols-2">
            <h1 className="contents">
              <span
                className="text-center font-medium leading-[1.08] tracking-tight md:pr-3 md:text-right"
                style={{ fontSize: "clamp(2.25rem, 4.6vw, 3.5rem)", color: "#eef1f4" }}
              >
                Test the change in the twin
              </span>
              <span
                className="text-center font-medium leading-[1.08] tracking-tight md:pl-3 md:text-left"
                style={{ fontSize: "clamp(2.25rem, 4.6vw, 3.5rem)", color: ACCENT }}
              >
                before you touch the iron.
              </span>
            </h1>
          </div>
        </section>

        {/* ═══ HERO — the split. Physical board ↔ its glowing twin ═══ */}
        <section aria-labelledby="hero-kicker">
          <h2 id="hero-kicker" className="mb-5 text-center text-[11px] uppercase tracking-[0.34em]" style={{ fontFamily: MONO, color: CAP }}>
            <span style={{ background: INK, padding: "3px 14px" }}>
              physical <span style={{ color: COPPER }}>⇄</span> twin · five components, one coordinate
            </span>
          </h2>

          {/* DESKTOP: one full-bleed SVG carries both boards and the sync threads */}
          <div className="hidden md:block">
            <div className="mx-auto max-w-[1000px] px-6">
              <div className="mb-4 grid grid-cols-2">
                <div className="flex items-center justify-end gap-2 pr-12">
                  <span className="text-[11px] uppercase tracking-[0.28em]" style={{ fontFamily: MONO, color: COPPER }}>physical · board #A7-04</span>
                  <span className="h-2 w-2 rounded-full" style={{ background: COPPER, boxShadow: `0 0 8px ${COPPER}` }} />
                </div>
                <div className="flex items-center justify-start gap-2 pl-12">
                  <span className="live-dot h-2 w-2 rounded-full" style={{ background: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }} />
                  <span className="text-[11px] uppercase tracking-[0.28em]" style={{ fontFamily: MONO, color: ACCENT }}>digital twin · +200ms ahead</span>
                </div>
              </div>

              <svg viewBox="0 0 760 400" className="w-full" role="img" aria-label="A copper prototype board on the left and its glowing cyan digital twin on the right, linked by five sync threads that cross the center seam.">
                <PhysicalBoardArt ox={48} oy={40} idp="pd" />
                <TwinBoardArt ox={432} oy={40} idp="td" />

                {/* sync threads: physical pin → across the seam → twin pin, same y */}
                {ROWS.map((r, i) => {
                  const y = 40 + r;
                  return (
                    <g key={`thread${i}`}>
                      <line x1="334" y1={y} x2="380" y2={y} stroke={COPPER} strokeWidth="1" strokeDasharray="3 4" opacity="0.5" />
                      <line x1="380" y1={y} x2="426" y2={y} stroke={ACCENT} strokeWidth="1" strokeDasharray="3 4" opacity="0.5" />
                      <circle className="thread-dot" cx="337" cy={y} r="3" fill={COPPER} style={{ animationDelay: `${i * 0.34}s` }} />
                    </g>
                  );
                })}
              </svg>

              <div className="mt-4 grid grid-cols-2">
                <div className="pr-12 text-right text-[11px]" style={{ fontFamily: MONO, color: CAP }}>
                  copper · powered · iterating in <span style={{ color: COPPER }}>weeks</span>
                </div>
                <div className="pl-12 text-left text-[11px]" style={{ fontFamily: MONO, color: CAP }}>
                  wireframe · live · iterating in <span style={{ color: ACCENT }}>seconds</span>
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE: seam rotates 90° — a glowing divider between stacked planes */}
          <div className="relative md:hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2" style={{ background: "linear-gradient(180deg, rgba(208,138,64,0.10), transparent)" }} aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2" style={{ background: "linear-gradient(0deg, rgba(64,200,208,0.10), transparent)" }} aria-hidden />
            <div className="relative px-5">
              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.24em]" style={{ fontFamily: MONO, color: COPPER }}>physical · board #A7-04</span>
                <span className="h-2 w-2 rounded-full" style={{ background: COPPER, boxShadow: `0 0 8px ${COPPER}` }} />
              </div>
              <svg viewBox="0 0 300 340" className="mx-auto w-full max-w-[340px]" aria-hidden>
                <PhysicalBoardArt ox={10} oy={10} idp="pm" />
              </svg>
              <p className="mt-2 text-center text-[11px]" style={{ fontFamily: MONO, color: CAP }}>
                copper · powered · iterating in <span style={{ color: COPPER }}>weeks</span>
              </p>

              {/* horizontal seam + paired chip */}
              <div className="relative my-6 flex items-center justify-center">
                <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`, boxShadow: `0 0 10px ${ACCENT}55` }} />
                <span className="absolute px-3 py-1 text-[11px] uppercase tracking-[0.22em]" style={{ fontFamily: MONO, color: ACCENT, background: INK, border: `1px solid ${ACCENT}55` }}>
                  ⇄ paired
                </span>
              </div>

              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="live-dot h-2 w-2 rounded-full" style={{ background: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }} />
                <span className="text-[11px] uppercase tracking-[0.24em]" style={{ fontFamily: MONO, color: ACCENT }}>digital twin · +200ms ahead</span>
              </div>
              <svg viewBox="0 0 300 340" className="mx-auto w-full max-w-[340px]" aria-hidden>
                <TwinBoardArt ox={10} oy={10} idp="tm" />
              </svg>
              <p className="mt-2 text-center text-[11px]" style={{ fontFamily: MONO, color: CAP }}>
                wireframe · live · iterating in <span style={{ color: ACCENT }}>seconds</span>
              </p>
            </div>
          </div>
        </section>

        {/* ═══ INTRO — the explanation (seam dim behind this band) ═══ */}
        <section className="px-6 pb-14 pt-8">
          <p className="mx-auto max-w-xl text-center text-sm leading-relaxed" style={{ color: "#9aa1ab" }}>
            Hardware iteration is weeks. Software is seconds. Antipode mirrors your prototype into a live
            digital twin, runs it ahead of real time, and tells you what breaks — before the smoke comes out.
          </p>
        </section>

        {/* ═══ FAILURE-PREDICTION band — the twin, replaying a save ═══ */}
        <section className="border-y" style={{ borderColor: "#15181e" }} aria-labelledby="term-kicker">
          <div className="mx-auto max-w-4xl px-6 py-12">
            <h2 id="term-kicker" className="mb-4 text-center text-[11px] uppercase tracking-[0.32em]" style={{ fontFamily: MONO, color: CAP }}>
              <span style={{ background: INK, padding: "3px 14px" }}>prediction, replayed</span>
            </h2>
            <div className="overflow-hidden rounded-md border" style={{ borderColor: `${ACCENT}33`, background: "#0a0c12", boxShadow: `0 0 40px ${ACCENT}12` }}>
              <div className="flex flex-col gap-1 border-b px-5 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "#15181e", background: "#070810" }}>
                <span className="truncate text-[11px]" style={{ fontFamily: MONO, color: CAP }}>twin://A7-04 — reading ahead of real time</span>
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <span className="live-dot h-2 w-2 rounded-full" style={{ background: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }} />
                  <span className="text-[11px]" style={{ fontFamily: MONO, color: ACCENT }}>14,200 samples/sec</span>
                </span>
              </div>
              <div className="space-y-1.5 px-6 py-5 text-[13px] leading-relaxed" style={{ fontFamily: MONO }}>
                <p style={{ color: CAP }}>twin running <span style={{ color: "#e8edf2" }}>200ms ahead</span> of real time</p>
                <div
                  className="term-reveal term-a mt-3 rounded-sm border-l-2 px-4 py-3"
                  style={{ borderColor: AMBER, background: `${AMBER}12`, boxShadow: `0 0 20px ${AMBER}22` }}
                >
                  <p style={{ color: AMBER, fontWeight: 700 }}>⚠ PREDICTED FAILURE in 4.2s</p>
                  <p className="mt-1 pl-4" style={{ color: "#cfd4da" }}>└ component: <span style={{ color: AMBER }}>VRM-3</span> (voltage regulator)</p>
                  <p className="pl-4" style={{ color: "#cfd4da" }}>└ cause: thermal runaway @ <span style={{ color: "#f08070" }}>87°C</span></p>
                </div>
                <p className="term-reveal term-b pt-2 pl-4" style={{ color: "#cfd4da" }}>→ action: reduce rail-2 load 15%</p>
                <p className="term-reveal term-c pt-2" style={{ color: "#7adfa0" }}>✔ load reduced · thermal stabilized · iteration saved</p>
                <p className="term-reveal term-d" style={{ color: CAP }}># the fix landed in the twin. the iron never knew.</p>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] uppercase tracking-[0.28em]" style={{ fontFamily: MONO, color: CAP }}>
              <span style={{ background: INK, padding: "3px 14px" }}>
                the failure was averted <span style={{ color: ACCENT }}>before atoms</span> — at code-speed, not prototype-speed
              </span>
            </p>
          </div>
        </section>

        {/* ═══ THE ANTIPODE — globe straddling the seam ═══ */}
        <section className="px-6 py-16" aria-labelledby="globe-kicker">
          <h2 id="globe-kicker" className="mb-6 text-center text-[11px] uppercase tracking-[0.32em]" style={{ fontFamily: MONO, color: CAP }}>
            <span style={{ background: INK, padding: "3px 14px" }}>the antipode</span>
          </h2>
          <div className="mx-auto flex max-w-md flex-col items-center gap-6">
            <AntipodeGlobe />
            <p className="text-center text-[13px] leading-relaxed" style={{ color: "#9aa1ab" }}>
              An <span style={{ color: "#eef1f4" }}>antipode</span> is the opposite point on the globe — Auckland sits
              almost exactly opposite Europe. The twin is the antipode of the hardware:
              <span style={{ color: ACCENT }}> same coordinates, opposite plane.</span>
            </p>
          </div>
        </section>

        {/* ═══ MIRRORED STATS — one figure each side of the seam ═══ */}
        <section className="border-t" style={{ borderColor: "#15181e" }} aria-labelledby="stats-kicker">
          <h2 id="stats-kicker" className="pt-10 text-center text-[11px] uppercase tracking-[0.32em]" style={{ fontFamily: MONO, color: CAP }}>
            <span style={{ background: INK, padding: "3px 14px" }}>the margin</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="flex flex-col items-center py-10 text-center md:items-end md:pr-12 md:text-right">
              <div className="text-5xl font-semibold tracking-tight" style={{ color: COPPER }}>200ms</div>
              <div className="mt-2 max-w-[15rem] text-[11px] uppercase tracking-[0.24em]" style={{ fontFamily: MONO, color: CAP }}>the twin&rsquo;s lead on real time</div>
            </div>
            <div className="flex flex-col items-center py-10 text-center md:items-start md:pl-12 md:text-left">
              <div className="text-5xl font-semibold tracking-tight" style={{ color: ACCENT }}>89%</div>
              <div className="mt-2 max-w-[15rem] text-[11px] uppercase tracking-[0.24em]" style={{ fontFamily: MONO, color: CAP }}>of failures pre-empted in the twin</div>
            </div>
          </div>
        </section>

        {/* ═══ CLOSE — paired CTAs, primary first on mobile ═══ */}
        <section className="border-t" style={{ borderColor: "#15181e" }} aria-labelledby="cta-kicker">
          <h2 id="cta-kicker" className="pt-12 text-center text-[11px] uppercase tracking-[0.32em]" style={{ fontFamily: MONO, color: CAP }}>
            <span style={{ background: INK, padding: "3px 14px" }}>pair your first board</span>
          </h2>
          <div className="flex flex-col md:grid md:grid-cols-2">
            {/* primary first in DOM so PAIR THE TWIN sits above SIGN IN on
                mobile; md:order restores the copper-left / cyan-right mirror. */}
            <div className="flex flex-col items-center gap-3 py-10 text-center md:order-2 md:items-start md:pl-12 md:text-left md:py-14">
              <p className="text-sm" style={{ color: "#9aa1ab" }}>mirror your first board.</p>
              <Link href="/signup" className="btn-primary px-8 text-[13px] uppercase tracking-[0.2em]" style={{ fontFamily: MONO }}>
                pair the twin →
              </Link>
              <p className="text-[11px]" style={{ fontFamily: MONO, color: CAP }}>free for one board · no hardware changes</p>
            </div>
            <div className="flex flex-col items-center gap-3 py-10 text-center md:order-1 md:items-end md:pr-12 md:text-right md:py-14">
              <p className="text-sm" style={{ color: "#9aa1ab" }}>already pairing boards?</p>
              <Link href="/login" className="btn-ghost px-7 text-[12px] uppercase tracking-[0.2em]" style={{ fontFamily: MONO }}>
                ← sign in
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ FOOTER — split across the seam ═══ */}
        <footer className="border-t" style={{ borderColor: "#15181e" }}>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 py-8 text-center md:grid-cols-2 md:text-left">
            <div className="text-[11px] md:text-right" style={{ fontFamily: MONO, color: CAP }}>
              <span style={{ color: COPPER }}>{appConfig.name}</span> · Auckland 36°S
            </div>
            <a
              href="https://abduljaleel.xyz/aletheia/"
              target="_blank"
              rel="noopener noreferrer"
              className="masthead-link justify-center text-[11px] uppercase tracking-[0.22em] transition-colors hover:text-[#40c8d0] md:justify-start"
              style={{ fontFamily: MONO, color: CAP }}
            >
              Part of the Aletheia stack ↗
            </a>
          </div>
        </footer>
      </main>

      {/* CSS: static classes + keyframes, all motion gated by reduced-motion */}
      <style>{`
        a:focus-visible, button:focus-visible {
          outline: 2px solid ${ACCENT};
          outline-offset: 3px;
          border-radius: 4px;
        }
        .btn-primary {
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 44px; padding-top: 0.6rem; padding-bottom: 0.6rem;
          background: ${ACCENT}; color: #04141a; border: 1px solid ${ACCENT};
          box-shadow: 0 0 22px rgba(64,200,208,0.32);
          transition: background .18s ease, color .18s ease, box-shadow .18s ease;
        }
        .btn-primary:hover {
          background: transparent; color: ${ACCENT};
          box-shadow: 0 0 26px rgba(64,200,208,0.22);
        }
        .btn-ghost {
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 44px; padding-top: 0.6rem; padding-bottom: 0.6rem;
          background: transparent; color: ${COPPER};
          border: 1px solid rgba(208,138,64,0.5);
          transition: background .18s ease, color .18s ease;
        }
        .btn-ghost:hover { background: ${COPPER}; color: #0a0a0a; }
        .masthead-link { display: inline-flex; align-items: center; min-height: 44px; }
        .thread-dot { opacity: 0; }
        @media (prefers-reduced-motion: no-preference) {
          .live-dot { animation: livePulse 1.9s ease-in-out infinite; }
          .thread-dot { animation: threadPulse 2.8s linear infinite; }
          .term-reveal { opacity: 0; }
          .term-a { animation: termA 8s ease-out infinite; }
          .term-b { animation: termB 8s ease-out infinite; }
          .term-c { animation: termC 8s ease-out infinite; }
          .term-d { animation: termD 8s ease-out infinite; }
        }
        @keyframes livePulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes threadPulse {
          0%   { cx: 337px; opacity: 0; fill: ${COPPER}; }
          12%  { opacity: 1; }
          50%  { fill: #9bd6db; }
          88%  { opacity: 1; }
          100% { cx: 423px; opacity: 0; fill: ${ACCENT}; }
        }
        @keyframes termA { 0%, 10% { opacity: 0; transform: translateY(4px); } 16%, 100% { opacity: 1; transform: translateY(0); } }
        @keyframes termB { 0%, 31% { opacity: 0; transform: translateY(4px); } 37%, 100% { opacity: 1; transform: translateY(0); } }
        @keyframes termC { 0%, 50% { opacity: 0; transform: translateY(4px); } 56%, 100% { opacity: 1; transform: translateY(0); } }
        @keyframes termD { 0%, 65% { opacity: 0; transform: translateY(4px); } 71%, 100% { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
