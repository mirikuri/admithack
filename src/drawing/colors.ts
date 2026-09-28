export const PALETTE = [
  { id: 'red',    hex: '#ef4444', label: 'Red' },
  { id: 'orange', hex: '#f97316', label: 'Orange' },
  { id: 'yellow', hex: '#eab308', label: 'Yellow' },
  { id: 'green',  hex: '#22c55e', label: 'Green' },
  { id: 'blue',   hex: '#3b82f6', label: 'Blue' },
  { id: 'purple', hex: '#a855f7', label: 'Purple' },
  { id: 'white',  hex: '#ffffff', label: 'White' },
  { id: 'black',  hex: '#1e1e2e', label: 'Black' },
] as const;

export type ColorId = typeof PALETTE[number]['id'];

// Given a cursor position and the pinch palette overlay rect, return which color is hovered
export function getColorAtPosition(
  x: number,
  y: number,
  paletteX: number,
  paletteY: number,
  swatchSize = 40,
): string | null {
  for (let i = 0; i < PALETTE.length; i++) {
    const sx = paletteX + i * (swatchSize + 4);
    if (x >= sx && x <= sx + swatchSize && y >= paletteY && y <= paletteY + swatchSize) {
      return PALETTE[i].hex;
    }
  }
  return null;
}
