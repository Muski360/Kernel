import { kernelPath } from "./kernel-path";

// Replace only the lower-left contour with a smooth neck. Keeping the original
// cubic topology lets GSAP interpolate the outline without masks or cut seams.
const neck = [
  [673, 772.998],
  [655, 1050],
  [670, 1310],
  [989.211, 1397.211],
];
function point(t: number, axis: number) {
  const u = 1 - t;
  return (
    u ** 3 * neck[0][axis] +
    3 * u ** 2 * t * neck[1][axis] +
    3 * u * t ** 2 * neck[2][axis] +
    t ** 3 * neck[3][axis]
  );
}
function tangent(t: number, axis: number) {
  return (
    3 * (1 - t) ** 2 * (neck[1][axis] - neck[0][axis]) +
    6 * (1 - t) * t * (neck[2][axis] - neck[1][axis]) +
    3 * t ** 2 * (neck[3][axis] - neck[2][axis])
  );
}

let segment = 0;
export const detachedKernelPath = kernelPath.replace(
  /C\s+([^CZ]+)/g,
  (original) => {
    segment += 1;
    if (segment < 12 || segment > 31) return original;
    const start = (segment - 12) / 20;
    const end = (segment - 11) / 20;
    const control1 = [0, 1].map(
      (axis) => point(start, axis) + tangent(start, axis) / 60,
    );
    const control2 = [0, 1].map(
      (axis) => point(end, axis) - tangent(end, axis) / 60,
    );
    return `C ${[...control1, ...control2, point(end, 0), point(end, 1)].map((n) => n.toFixed(3)).join(" ")} `;
  },
);
