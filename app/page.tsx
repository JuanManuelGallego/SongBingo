import { readFileSync } from "node:fs";
import { join } from "node:path";
import BingoCard, { type Song } from "./bingo-card";

function parseCsv(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (quoted) {
      if (character === '"' && csv[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (character !== "\r") {
      value += character;
    }
  }

  if (quoted) throw new Error("The songs CSV contains an unclosed quote.");
  if (value || row.length) rows.push([...row, value]);

  return rows;
}

function loadSongs(): Song[] {
  const csv = readFileSync(
    join(process.cwd(), "public", "All_Out_2000s.csv"),
    "utf8",
  );
  const [rawHeaders, ...rows] = parseCsv(csv);
  const headers = rawHeaders?.map((header) => header.replace(/^\uFEFF/, ""));
  const idIndex = headers?.indexOf("Track URI") ?? -1;
  const titleIndex = headers?.indexOf("Track Name") ?? -1;
  const artistIndex = headers?.indexOf("Artist Name(s)") ?? -1;

  if ([idIndex, titleIndex, artistIndex].includes(-1)) {
    throw new Error("The songs CSV is missing a required column.");
  }

  const songs = rows
    .map((row) => ({
      id: row[idIndex]?.trim(),
      title: row[titleIndex]?.trim(),
      artist: row[artistIndex]?.trim(),
    }))
    .filter((song): song is Song => Boolean(song.id && song.title && song.artist));
  const uniqueSongs = [...new Map(songs.map((song) => [song.id, song])).values()];

  if (uniqueSongs.length < 24) {
    throw new Error("The songs CSV must contain at least 24 valid songs.");
  }

  return uniqueSongs;
}

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
