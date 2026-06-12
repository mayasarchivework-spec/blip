import { Music, Play } from "lucide-react";

interface SongCardProps {
  songTitle?: string;
  artistName?: string;
  albumArtUrl?: string;
  compact?: boolean;
}

export function SongCard({
  songTitle = "Untitled",
  artistName = "Blip Mix",
  albumArtUrl,
  compact = false
}: SongCardProps) {
  return (
    <div className={compact ? "song-card song-card-compact" : "song-card"}>
      {albumArtUrl ? <img src={albumArtUrl} alt="" className="song-art" /> : <Music />}
      <div className="song-info">
        <span className="song-kicker">
          <Music size={16} /> Song
        </span>
        <strong>{songTitle}</strong>
        <span>{artistName}</span>
        <div className="song-progress">
          <span />
        </div>
      </div>
      <button type="button" className="play-button" aria-label={`Play ${songTitle}`}>
        <Play size={compact ? 18 : 22} fill="currentColor" />
      </button>
    </div>
  );
}
