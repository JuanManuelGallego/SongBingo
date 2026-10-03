import BingoCard from "./bingo-card";
import { loadSongs, type Song } from "./songs";

export default function Home() {
  let songs: Song[] = [];
  let error: string | undefined;

  try {
    songs = loadSongs();
  } catch {
    error =
      "No pudimos cargar las canciones. Pídele al anfitrión que lo intente de nuevo.";
  }

  const fullBoardOnly =
    process.env.BINGO_FULL_BOARD_ONLY?.trim().toLowerCase() === "true";

  return (
    <BingoCard
      songs={songs}
      fullBoardOnly={fullBoardOnly}
      error={error}
    />
  );
}
