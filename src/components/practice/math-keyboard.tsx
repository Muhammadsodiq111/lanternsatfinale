type Key = { label: string; insert: string; back?: number; title: string };

type Field = HTMLTextAreaElement | HTMLInputElement | null;


const GROUPS: { name: string; keys: Key[] }[] = [
  {
    name: "Powers & roots",
    keys: [
      { label: "x²", insert: "^2", title: "Square" },
      { label: "xⁿ", insert: "^()", back: 1, title: "Power" },
      { label: "xₙ", insert: "_", title: "Subscript" },
      { label: "√", insert: "sqrt()", back: 1, title: "Square root" },
      { label: "ⁿ√", insert: "root(3, )", back: 1, title: "Nth root" },
      { label: "a/b", insert: "()/()", back: 3, title: "Fraction" },
    ],
  },
  {
    name: "Relations",
    keys: [
      { label: "=", insert: " = ", title: "Equals" },
      { label: "≤", insert: " <= ", title: "Less or equal" },
      { label: "≥", insert: " >= ", title: "Greater or equal" },
      { label: "≠", insert: " != ", title: "Not equal" },
      { label: "±", insert: " +/- ", title: "Plus minus" },
      { label: "×", insert: " * ", title: "Times" },
    ],
  },
  {
    name: "Symbols",
    keys: [
      { label: "π", insert: "pi", title: "Pi" },
      { label: "θ", insert: "theta", title: "Theta" },
      { label: "α", insert: "alpha", title: "Alpha" },
      { label: "β", insert: "beta", title: "Beta" },
      { label: "°", insert: "^\\circ ", title: "Degrees" },
      { label: "|x|", insert: "abs()", back: 1, title: "Absolute value" },
    ],
  },
  {
    name: "Formatting",
    keys: [
      { label: "bold", insert: "****", back: 2, title: "Bold text" },
      { label: "italic", insert: "**", back: 1, title: "Italic text" },
      { label: "$math$", insert: "$$", back: 1, title: "Force math rendering" },
    ],
  },
];

/**
 * Symbol pad that types real math notation into whichever field is active,
 * so authors never have to write things like "x ^2" or "x / 5" by hand.
 */
export function MathKeyboard({
  getTarget,
  value,
  onChange,
  label,
}: {
  getTarget: () => Field;
  value: string;
  onChange: (next: string) => void;
  label?: string;
}) {
  function insert(key: Key) {
    const el = getTarget();
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + key.insert + value.slice(end);
    onChange(next);
    const caret = start + key.insert.length - (key.back ?? 0);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  }


  return (
    <div className="border-border bg-background/60 space-y-2.5 rounded-2xl border p-3">
      {label ? (
        <p className="text-muted-foreground text-[10px] font-bold tracking-[0.12em] uppercase">
          Typing into: <span className="text-primary">{label}</span>
        </p>
      ) : null}
      {GROUPS.map((group) => (

        <div key={group.name} className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground w-24 shrink-0 text-[10px] font-bold tracking-[0.12em] uppercase">
            {group.name}
          </span>
          {group.keys.map((key) => (
            <button
              key={key.label}
              type="button"
              title={key.title}
              onClick={() => insert(key)}
              className="border-border bg-card text-foreground hover:border-primary hover:text-primary min-w-9 rounded-lg border px-2.5 py-1.5 text-sm font-semibold transition-colors"
            >
              {key.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
