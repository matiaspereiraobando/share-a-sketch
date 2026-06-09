export type Palette = {
  id: string;
  name: string;
  /** Hex colors, indexed. Each stored stroke references one of these by index. */
  colors: string[];
};

/**
 * Static palette catalog. A drawing stores `paletteId` + per-stroke color
 * index, so palettes can be tweaked or even swapped on existing drawings
 * later without rewriting stroke data.
 *
 * Keep the order stable. If you remove a color, replace it with a sensible
 * fallback in the same slot rather than reshuffling.
 */
export const PALETTES: Palette[] = [
  {
    id: "classic",
    name: "Classic",
    colors: [
      "#000000",
      "#7f7f7f",
      "#880015",
      "#ed1c24",
      "#ff7f27",
      "#fff200",
      "#22b14c",
      "#00a2e8",
      "#3f48cc",
      "#a349a4",
      "#ffffff",
      "#c3c3c3",
      "#b97a57",
      "#ffaec9",
      "#ffc90e",
      "#efe4b0",
      "#b5e61d",
      "#99d9ea",
      "#7092be",
      "#c8bfe7",
    ],
  },
  {
    id: "pastel",
    name: "Pastel",
    colors: [
      "#fdf6e3",
      "#fde2e4",
      "#fad2e1",
      "#e2ece9",
      "#bee1e6",
      "#cddafd",
      "#dfe7fd",
      "#f0efeb",
      "#ffd6a5",
      "#ffadad",
      "#fdffb6",
      "#caffbf",
      "#9bf6ff",
      "#a0c4ff",
      "#bdb2ff",
      "#ffc6ff",
    ],
  },
  {
    id: "gameboy",
    name: "Game Boy",
    colors: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
  },
  {
    id: "neon",
    name: "Neon",
    colors: [
      "#0d0221",
      "#ff006e",
      "#fb5607",
      "#ffbe0b",
      "#8338ec",
      "#3a86ff",
      "#06ffa5",
      "#ffffff",
    ],
  },
  {
    id: "earth",
    name: "Earth",
    colors: [
      "#2b2118",
      "#5e4b3c",
      "#8a6f4d",
      "#b39169",
      "#c9b48e",
      "#7a8b5c",
      "#4e6b3a",
      "#3d4f2e",
      "#c2723f",
      "#a8401c",
    ],
  },
];

export const DEFAULT_PALETTE_ID = "classic";

export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}
