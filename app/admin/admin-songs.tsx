"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Song } from "../songs";

const STORAGE_KEY = "song-bingo-played-v1";

type AdminSongsProps = {
  songs: Song[];
};

export default function AdminSongs({ songs }: AdminSongsProps) {
  const [playedIds, setPlayedIds] = useState<string[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "played" | "pending">("all");

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? "[]",
      ) as unknown;
      if (Array.isArray(saved)) {
        const validIds = new Set(songs.map((song) => song.id));
        setPlayedIds(
          [...new Set(saved)].filter(
            (id): id is string => typeof id === "string" && validIds.has(id),
          ),
        );
      }
    } catch {
      // Invalid browser storage is ignored.
    } finally {
      setHasLoaded(true);
    }
  }, [songs]);

  useEffect(() => {
    if (!hasLoaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playedIds));
    } catch {
      // The tracker still works when storage is unavailable.
    }
  }, [hasLoaded, playedIds]);

  const played = useMemo(() => new Set(playedIds), [playedIds]);
  const visibleSongs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return songs.filter((song) => {
      const matchesQuery =
        !normalizedQuery ||
        `${song.title} ${song.artist}`.toLowerCase().includes(normalizedQuery);
      const matchesFilter =
        filter === "all" ||
        (filter === "played" ? played.has(song.id) : !played.has(song.id));
      return matchesQuery && matchesFilter;
    });
  }, [filter, played, query, songs]);

  function togglePlayed(id: string) {
    setPlayedIds((current) =>
      current.includes(id)
        ? current.filter((playedId) => playedId !== id)
        : [...current, id],
    );
  }

  function clearHistory() {
    if (
      playedIds.length &&
      window.confirm("¿Borrar todo el historial de canciones?")
    ) {
      setPlayedIds([]);
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Panel del anfitrión</p>
          <h1>
            Canciones <span>reproducidas</span>
          </h1>
          <p className="admin-intro">
            Marca cada canción cuando suene para no repetirla.
          </p>
        </div>
        <Link className="back-link" href="/">
          Volver al bingo
        </Link>
      </header>

      <section className="admin-summary" aria-label="Resumen de canciones">
        <div>
          <strong>{playedIds.length}</strong>
          <span>reproducidas</span>
        </div>
        <div>
          <strong>{songs.length - playedIds.length}</strong>
          <span>pendientes</span>
        </div>
        <button className="clear-button" onClick={clearHistory} type="button">
          Borrar historial
        </button>
      </section>

      <section className="admin-card" aria-label="Lista de canciones">
        <div className="admin-toolbar">
          <label className="search-label" htmlFor="song-search">
            Buscar canción o artista
          </label>
          <input
            id="song-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar..."
            type="search"
            value={query}
          />
          <div className="filter-tabs" aria-label="Filtrar canciones">
            {(["all", "played", "pending"] as const).map((value) => (
              <button
                aria-pressed={filter === value}
                className="filter-tab"
                key={value}
                onClick={() => setFilter(value)}
                type="button"
              >
                {value === "all"
                  ? "Todas"
                  : value === "played"
                    ? "Reproducidas"
                    : "Pendientes"}
              </button>
            ))}
          </div>
        </div>

        <div className="song-list">
          {visibleSongs.map((song) => {
            const isPlayed = played.has(song.id);
            const playNumber = isPlayed ? playedIds.indexOf(song.id) + 1 : null;

            return (
              <button
                aria-pressed={isPlayed}
                className="admin-song-row"
                key={song.id}
                onClick={() => togglePlayed(song.id)}
                type="button"
              >
                <span className="song-status" aria-hidden="true">
                  {isPlayed ? "✓" : ""}
                </span>
                <span className="admin-song-copy">
                  <strong>{song.title}</strong>
                  <small>{song.artist}</small>
                </span>
                {playNumber && <span className="play-number">#{playNumber}</span>}
              </button>
            );
          })}
          {!visibleSongs.length && (
            <p className="empty-state">No hay canciones que coincidan.</p>
          )}
        </div>
      </section>
    </main>
  );
}
