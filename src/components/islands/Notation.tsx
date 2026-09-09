/** @jsxImportSource preact */
import { parseCommand, tokensToText } from '../../lib/notation/parse';
import { DIRECTION_ANGLE, DIRECTION_GLYPH } from '../../lib/notation/tokens';

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

/** Astro の Sequence.astro と同じ見た目を Preact で描画する */
export default function Notation({ command }: { command: string }) {
  const tokens = parseCommand(command);
  const text = tokensToText(tokens);

  return (
    <span class="nt">
      <span class="nt-seq nt-icon" aria-label={text}>
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
            const s = t.buttons.length === 2 || t.od ? 'OD' : t.strength;
            return (
              <span class="nt-btn" data-s={s} key={i}>
                {t.text.replace(/^OD/, '')}
              </span>
            );
          }
          if (t.kind === 'meta') {
            return (
              <span class="nt-meta" key={i}>
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
    </span>
  );
}
