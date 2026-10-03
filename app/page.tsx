import BingoCard from "./bingo-card";
import { getBingoMode } from "./bingo-rules";
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

  return (
    <BingoCard
      songs={songs}
      mode={getBingoMode(process.env.BINGO_MODE)}
      error={error}
    />
  );
}
