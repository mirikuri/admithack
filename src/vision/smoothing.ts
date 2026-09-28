export interface Smoother {
  (x: number, y: number): [number, number];
  reset: () => void;
}

export function createSmoother(alpha = 0.3): Smoother {
  let prevX: number | null = null;
  let prevY: number | null = null;

  const fn = function smooth(x: number, y: number): [number, number] {
    if (prevX === null) {
      prevX = x;
      prevY = y;
      return [x, y];
    }
    prevX = prevX * (1 - alpha) + x * alpha;
    prevY = prevY! * (1 - alpha) + y * alpha;
    return [prevX, prevY!];
  } as Smoother;

  fn.reset = () => {
    prevX = null;
    prevY = null;
  };

  return fn;
}

export function mapToCanvas(
  x: number,
  y: number,
  width: number,
  height: number,
  mirror = true,
): [number, number] {
  const cx = mirror ? (1 - x) * width : x * width;
  const cy = y * height;
  return [cx, cy];
}
