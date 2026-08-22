/**
 * Ready-made Desmos graph states for "fit a curve to these points" questions.
 * They pre-build the (x_1, y_1) table plus the matching regression model, so
 * authors only type the point values — the whole thing persists in desmos_state.
 */

export type StarterId = "linear" | "quadratic" | "exponential" | "table";

export const DESMOS_STARTERS: { id: StarterId; label: string; model?: string; note: string }[] = [
  { id: "table", label: "Points table only", note: "Blank (x₁, y₁) table" },
  { id: "linear", label: "Linear fit", model: "y_1\\sim mx_1+b", note: "y ~ mx + b" },
  { id: "quadratic", label: "Quadratic fit", model: "y_1\\sim ax_1^{2}+bx_1+c", note: "y ~ ax² + bx + c" },
  { id: "exponential", label: "Exponential fit", model: "y_1\\sim ab^{x_1}", note: "y ~ ab^x" },
];

const EMPTY_VALUES = ["", "", "", ""];

/** Build a Desmos state object (setState-compatible) for a starter. */
export function desmosStarterState(id: StarterId, points: number = 4) {
  const values = Array.from({ length: Math.max(points, 2) }, (_, i) => EMPTY_VALUES[i] ?? "");
  const starter = DESMOS_STARTERS.find((s) => s.id === id);
  const list: Record<string, unknown>[] = [
    {
      type: "table",
      id: "starter-table",
      columns: [
        { id: "starter-col-x", latex: "x_1", values, color: "#c74440", hidden: false },
        { id: "starter-col-y", latex: "y_1", values, color: "#2d70b3", hidden: false, points: true, lines: false },
      ],
    },
  ];
  if (starter?.model) {
    list.push({ type: "expression", id: "starter-model", color: "#388c46", latex: starter.model });
  }
  return {
    version: 11,
    graph: { viewport: { xmin: -10, ymin: -10, xmax: 10, ymax: 10 } },
    expressions: { list },
  };
}
