"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { Song } from "./songs";

type SavedGame = {
  version: 1;
  songIds: string[];
  markedIds: string[];
};

type BingoCardProps = {
  songs: Song[];
  fullBoardOnly: boolean;
  error?: string;
};

const STORAGE_KEY = "song-bingo-game-v1";

function makeBoard(songs: Song[]) {
  const shuffled = [...songs];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled.slice(0, 24);
}

function hasBingo(board: Song[], marked: Set<string>, fullBoardOnly: boolean) {
  if (board.length !== 24) return false;

  const cells = Array.from({ length: 25 }, (_, index) => {
    if (index === 12) return true;
    const song = board[index < 12 ? index : index - 1];
    return marked.has(song.id);
  });

  if (fullBoardOnly) return cells.every(Boolean);

  const lines = [
    ...Array.from({ length: 5 }, (_, row) =>
      Array.from({ length: 5 }, (_, column) => row * 5 + column),
    ),
    ...Array.from({ length: 5 }, (_, column) =>
      Array.from({ length: 5 }, (_, row) => row * 5 + column),
    ),
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20],
  ];

  return lines.some((line) => line.every((index) => cells[index]));
}

export default function BingoCard({
  songs,
  fullBoardOnly,
  error,
}: BingoCardProps) {
  const [board, setBoard] = useState<Song[] | null>(null);
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [showWin, setShowWin] = useState(false);
  const wasWinner = useRef(false);

  useEffect(() => {
    if (error || songs.length < 24) return;

    const songMap = new Map(songs.map((song) => [song.id, song]));

    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? "null",
      ) as SavedGame | null;
      const validIds =
        saved?.version === 1 &&
        saved.songIds.length === 24 &&
        new Set(saved.songIds).size === 24 &&
        saved.songIds.every((id) => songMap.has(id));

      if (validIds && saved) {
        const restoredBoard = saved.songIds.map((id) => songMap.get(id)!);
        const boardIds = new Set(saved.songIds);
        setBoard(restoredBoard);
        setMarked(new Set(saved.markedIds.filter((id) => boardIds.has(id))));
        return;
      }
    } catch {
      // Invalid browser storage is replaced below.
    }

    setBoard(makeBoard(songs));
  }, [error, songs]);

  useEffect(() => {
    if (!board) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          songIds: board.map((song) => song.id),
          markedIds: [...marked],
        } satisfies SavedGame),
      );
    } catch {
      // The game still works when storage is unavailable.
    }
  }, [board, marked]);

  const winner = useMemo(
    () => (board ? hasBingo(board, marked, fullBoardOnly) : false),
    [board, fullBoardOnly, marked],
  );

  useEffect(() => {
    if (winner && !wasWinner.current) setShowWin(true);
    wasWinner.current = winner;
  }, [winner]);

  function toggleSong(id: string) {
    setMarked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function regenerate() {
    if (
      marked.size > 0 &&
      !window.confirm(
        "¿Quieres reemplazar esta tarjeta y borrar todas las canciones marcadas?",
      )
    ) {
      return;
    }

    setBoard(makeBoard(songs));
    setMarked(new Set());
    setShowWin(false);
    wasWinner.current = false;
  }

  if (error) {
    return (
      <main className="game-shell centered-shell">
        <section className="error-card" role="alert">
          <span aria-hidden="true">♪</span>
          <h1>Bingo Musical</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="game-shell">
      <header className="game-header">
        <div>
          <h1>
            Bingo <span>Musical</span>
          </h1>
        </div>
        <div className="header-actions">
          <div className="rule-pill">
            {fullBoardOnly ? "Completa el tablero" : "Una línea gana"}
          </div>
        </div>
      </header>

      <section className="game-card" aria-label="Tu tarjeta de Bingo Musical">
        <div className="card-toolbar">
          <p>
            Completa{" "}
            {fullBoardOnly ? "todo el tablero" : "cinco en línea"}.
          </p>
          <button className="regenerate-button" onClick={regenerate} type="button">
            <span aria-hidden="true">↻</span> Nueva tarjeta
          </button>
        </div>

        {board ? (
          <div className="bingo-grid">
            {Array.from({ length: 25 }, (_, index) => {
              if (index === 12) {
                return (
                  <div className="song-tile free-tile" key="free">
                    <span className="free-star" aria-hidden="true">★</span>
                    <strong>Casilla</strong>
                    <small>Libre</small>
                  </div>
                );
              }

              const song = board[index < 12 ? index : index - 1];
              const isMarked = marked.has(song.id);

              return (
                <button
                  aria-pressed={isMarked}
                  className="song-tile"
                  key={song.id}
                  onClick={() => toggleSong(song.id)}
                  type="button"
                >
                  <span className="tile-check" aria-hidden="true">✓</span>
                  <strong>{song.title}</strong>
                  <small>{song.artist}</small>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="loading-card" role="status">
            Mezclando tus canciones…
          </div>
        )}
      </section>

      {showWin && (
        <div
          className="win-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="win-title"
          onKeyDown={(event) => {
            if (event.key === "Escape") setShowWin(false);
          }}
        >
          <div className="win-dialog">
            <div className="win-burst" aria-hidden="true">★</div>
            <h2 id="win-title">¡BINGO!</h2>
            <p>Encontraste el ritmo ganador.</p>
            <button autoFocus onClick={() => setShowWin(false)} type="button">
              Volver a mi tarjeta
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
