/** @jsxImportSource preact */
import { deriveModern, parseCommand, tokensToPlain, tokensToText } from '../../lib/notation/parse';
import { DIRECTION_ANGLE, DIRECTION_GLYPH } from '../../lib/notation/tokens';
import type { Token } from '../../lib/notation/tokens';

function ArrowIcon({ dir }: { dir: number }) {
  const angle = DIRECTION_ANGLE[dir];
  if (angle === null || angle === undefined) {
    return <span class="nt-neutral" title="ニュートラル" />;
  }
  return (
    <span
      class="nt-arrow"
      role="img"
      aria-label={DIRECTION_GLYPH[dir]}
      style={{ transform: `rotate(${angle}deg)` }}
    >
      <svg viewBox="0 0 12 12" aria-hidden="true">
        <path d="M1 4h5V1l5 5-5 5V8H1z" fill="currentColor" />
      </svg>
    </span>
  );
}

function btnStrength(t: Extract<Token, { kind: 'button' }>): string {
  const b = t.buttons[0];
  if (b === 'SP') return 'SP';
  if (b === 'AS') return 'AUTO';
  return t.strength;
}

function Tokens({ command }: { command: string }) {
  const tokens = parseCommand(command);
  const text = tokensToText(tokens);
  const plain = tokensToPlain(tokens);
  return (
    <>
      <span class="nt-seq nt-icon" aria-label={plain}>
        {tokens.map((t, i) => {
          if (t.kind === 'directions') {
            return (
              <span class="nt-dirs" key={i}>
                {t.dirs.map((d, j) => (
                  <ArrowIcon dir={d} key={j} />
                ))}
              </span>
            );
          }
          if (t.kind === 'button') {
            const label = t.buttons[0] === 'AS' ? 'AUTO' : t.text.replace(/^OD/, '');
            return (
              <span class="nt-btnwrap" key={i}>
                {t.od && <span class="nt-od">OD</span>}
                <span class="nt-btn" data-s={btnStrength(t)}>
                  {label}
                </span>
              </span>
            );
          }
          if (t.kind === 'meta') {
            return (
              <span class="nt-meta" data-m={t.type} key={i}>
                {t.text}
              </span>
            );
          }
          if (t.kind === 'modifier') {
            if (t.type === 'cancel') return <span class="nt-mod" key={i}> › </span>;
            if (t.type === 'link') return <span class="nt-mod" key={i}> ~ </span>;
            if (t.type === 'then') return <span class="nt-mod" key={i}> </span>;
            return (
              <span class="nt-mod" key={i}>
                {t.text}
              </span>
            );
          }
          if (t.kind === 'note') {
            return (
              <span class="nt-note" key={i}>
                （{t.text}）
              </span>
            );
          }
          return (
            <span class="nt-mod" key={i}>
              {t.text}
            </span>
          );
        })}
      </span>
      <span class="nt-text">{text}</span>
    </>
  );
}

/** Astro の Sequence.astro と同じ見た目を Preact で描画する（クラシック／モダン両対応） */
export default function Notation({
  command,
  commandModern,
}: {
  command: string;
  commandModern?: string;
}) {
  const modern = commandModern && commandModern.trim() ? commandModern.trim() : deriveModern(command);
  return (
    <span class="nt">
      <span class="nt-ctl nt-ctl-classic">
        <Tokens command={command} />
      </span>
      <span class="nt-ctl nt-ctl-modern" data-fallback={modern === command ? 'true' : undefined}>
        <Tokens command={modern} />
      </span>
    </span>
  );
}
