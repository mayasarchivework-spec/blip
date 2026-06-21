import { RefreshCw, WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="screen offline-screen">
      <section className="offline-card">
        <span>
          <WifiOff size={40} />
        </span>
        <h1>You&apos;re offline</h1>
        <p>Blip will reconnect when your internet is back.</p>
        <a href="/home">
          <RefreshCw size={18} />
          Try again
        </a>
      </section>
    </div>
  );
}
