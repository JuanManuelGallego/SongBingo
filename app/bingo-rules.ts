import type { Song } from "./songs";

export type BingoMode =
  | "lines"
  | "full-board"
  | "outer"
  | "no-diagonal"
  | "diagonal"
  | "four-corners"
  | "x"
  | "plus"
  | "inner-square"
  | "two-lines"
  | "corners-center"
  | "postage-stamp"
  | "t-shape"
  | "l-shape"
  | "checkerboard";

type CellPattern = readonly number[];

export type BingoModeDetails = {
  label: string;
  goal: string;
  patterns: readonly CellPattern[];
};

const rows = Array.from({ length: 5 }, (_, row) =>
  Array.from({ length: 5 }, (_, column) => row * 5 + column),
);
const columns = Array.from({ length: 5 }, (_, column) =>
  Array.from({ length: 5 }, (_, row) => row * 5 + column),
);
const diagonals = [
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];
const lines = [...rows, ...columns, ...diagonals];
const boardIndexes = Array.from({ length: 25 }, (_, index) => index);
const allCells = [boardIndexes];
const outerCells = [
  boardIndexes.filter(
    (index) => index < 5 || index >= 20 || index % 5 === 0 || index % 5 === 4,
  ),
];
const twoLines = lines.flatMap((line, index) =>
  lines.slice(index + 1).map((otherLine) => [
    ...new Set([...line, ...otherLine]),
  ]),
);
const plus = [
  ...new Set([...rows[2], ...columns[2]]),
];
const innerSquare = [6, 7, 8, 11, 13, 16, 17, 18];
const tShape = [...new Set([...rows[0], ...columns[2]])];
const lShapes = rows.flatMap((row) =>
  columns.map((column) => [...new Set([...row, ...column])]),
);
const checkerboard = [0, 1].map((parity) =>
  boardIndexes.filter((index) => {
    const row = Math.floor(index / 5);
    const column = index % 5;
    return (row + column) % 2 === parity;
  }),
);

function combinePatterns(...patterns: CellPattern[]) {
  return [...new Set(patterns.flat())];
}

export const BINGO_MODES: Record<BingoMode, BingoModeDetails> = {
  lines: {
    label: "Una línea gana",
    goal: "cinco en línea",
    patterns: lines,
  },
  "full-board": {
    label: "Completa el tablero",
    goal: "todo el tablero",
    patterns: allCells,
  },
  outer: {
    label: "Borde completo",
    goal: "todas las canciones del borde",
    patterns: outerCells,
  },
  "no-diagonal": {
    label: "Líneas sin diagonales",
    goal: "cinco en línea, sin diagonales",
    patterns: [...rows, ...columns],
  },
  diagonal: {
    label: "Solo diagonales",
    goal: "una diagonal completa",
    patterns: diagonals,
  },
  "four-corners": {
    label: "Cuatro esquinas",
    goal: "las cuatro esquinas",
    patterns: [[0, 4, 20, 24]],
  },
  x: {
    label: "Doble diagonal",
    goal: "las dos diagonales",
    patterns: [combinePatterns(...diagonals)],
  },
  plus: {
    label: "Cruz completa",
    goal: "la fila y columna centrales",
    patterns: [plus],
  },
  "inner-square": {
    label: "Cuadrado interior",
    goal: "el borde del cuadrado interior",
    patterns: [innerSquare],
  },
  "two-lines": {
    label: "Dos líneas",
    goal: "dos líneas completas",
    patterns: twoLines,
  },
  "corners-center": {
    label: "Esquinas y centro",
    goal: "las cuatro esquinas y el centro",
    patterns: [[0, 4, 12, 20, 24]],
  },
  "postage-stamp": {
    label: "Estampilla",
    goal: "un bloque de 2×2 en una esquina",
    patterns: [
      [0, 1, 5, 6],
      [3, 4, 8, 9],
      [15, 16, 20, 21],
      [18, 19, 23, 24],
    ],
  },
  "t-shape": {
    label: "Forma de T",
    goal: "una forma de T",
    patterns: [tShape],
  },
  "l-shape": {
    label: "Forma de L",
    goal: "una forma de L",
    patterns: lShapes,
  },
  checkerboard: {
    label: "Tablero ajedrezado",
    goal: "todas las casillas de un color",
    patterns: checkerboard,
  },
};

function isBingoMode(value: string): value is BingoMode {
  return Object.hasOwn(BINGO_MODES, value);
}

export function getBingoMode(value: string | undefined): BingoMode {
  const normalized = value?.trim().toLowerCase();
  if (normalized && isBingoMode(normalized)) return normalized;
  return "lines";
}

export function hasBingo(
  board: Song[],
  marked: Set<string>,
  mode: BingoMode,
) {
  if (board.length !== 24) return false;

  const cells = Array.from({ length: 25 }, (_, index) => {
    if (index === 12) return true;
    const song = board[index < 12 ? index : index - 1];
    return marked.has(song.id);
  });

  return BINGO_MODES[mode].patterns.some((pattern) =>
    pattern.every((index) => cells[index]),
  );
}
