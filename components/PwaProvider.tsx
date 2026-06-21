"use client";

import { Download, Share2, SquarePlus, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaInstallContextValue {
  canInstall: boolean;
  isInstalled: boolean;
  isIos: boolean;
  install: () => Promise<void>;
  openInstallHelp: () => void;
}

const installDismissedKey = "blip.pwa.install.dismissed";
const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

function detectStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function detectIos() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(true);

  useEffect(() => {
    setIsInstalled(detectStandalone());
    setIsIos(detectIos());
    setBannerDismissed(window.localStorage.getItem(installDismissedKey) === "true");

    const displayMode = window.matchMedia("(display-mode: standalone)");
    const handleDisplayMode = () => setIsInstalled(detectStandalone());
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setHelpOpen(false);
      setIsInstalled(true);
    };

    displayMode.addEventListener("change", handleDisplayMode);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      const registerServiceWorker = () => {
        void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
      };

      if (document.readyState === "complete") {
        registerServiceWorker();
      } else {
        window.addEventListener("load", registerServiceWorker, { once: true });
      }
    }

    return () => {
      displayMode.removeEventListener("change", handleDisplayMode);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const openInstallHelp = useCallback(() => setHelpOpen(true), []);

  const install = useCallback(async () => {
    if (isInstalled) {
      return;
    }

    if (!installPrompt) {
      setHelpOpen(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }
  }, [installPrompt, isInstalled]);

  const dismissBanner = useCallback(() => {
    window.localStorage.setItem(installDismissedKey, "true");
    setBannerDismissed(true);
  }, []);

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      canInstall: Boolean(installPrompt),
      isInstalled,
      isIos,
      install,
      openInstallHelp
    }),
    [install, installPrompt, isInstalled, isIos, openInstallHelp]
  );
  const showBanner = !isInstalled && !bannerDismissed && (Boolean(installPrompt) || isIos);

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
      {showBanner ? (
        <aside className="pwa-install-banner" aria-label="Install Blip">
          <span className="pwa-install-icon">
            <Download size={22} />
          </span>
          <div>
            <strong>Install Blip</strong>
            <span>Keep Blip on this device.</span>
          </div>
          <button type="button" className="pwa-install-action" onClick={() => void install()}>
            Install
          </button>
          <button
            type="button"
            className="pwa-install-dismiss"
            onClick={dismissBanner}
            aria-label="Dismiss install banner"
          >
            <X size={18} />
          </button>
        </aside>
      ) : null}
      {helpOpen ? (
        <div className="modal-backdrop pwa-help-backdrop" role="dialog" aria-modal="true">
          <section className="pwa-install-help">
            <button
              type="button"
              className="modal-close"
              onClick={() => setHelpOpen(false)}
              aria-label="Close install help"
            >
              <X size={22} />
            </button>
            <img src="/assets/pwa/icon-192.png" alt="" />
            <h2>Install Blip</h2>
            {isIos ? (
              <ol>
                <li>
                  <Share2 size={20} />
                  Tap Safari&apos;s Share button.
                </li>
                <li>
                  <SquarePlus size={20} />
                  Choose Add to Home Screen.
                </li>
              </ol>
            ) : (
              <p>Open your browser menu and choose Install Blip or Install app.</p>
            )}
          </section>
        </div>
      ) : null}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);

  if (!context) {
    throw new Error("usePwaInstall must be used inside PwaProvider");
  }

  return context;
}
