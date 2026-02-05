import { useState, useEffect } from "react";

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
        return true;
      }
      // Check for iOS standalone
      if (window.navigator.standalone === true) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    // Check if iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      const isWebkit = /webkit/.test(userAgent);

      // iOS Safari
      if (isIOSDevice && isWebkit) {
        setIsIOS(true);
        if (!checkInstalled()) {
          setIsInstallable(true);
        }
        return true;
      }
      return false;
    };

    if (checkInstalled()) {
      return;
    }

    checkIOS();

    // Listen for beforeinstallprompt (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    // iOS - show instructions
    if (isIOS) {
      setShowIOSInstructions(true);
      return { success: false, platform: "ios" };
    }

    // Android/Desktop - use prompt
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          setIsInstalled(true);
          setIsInstallable(false);
        }

        setDeferredPrompt(null);
        return { success: outcome === "accepted", platform: "android" };
      } catch (error) {
        console.error("Install error:", error);
        return { success: false, error };
      }
    }

    return { success: false, platform: "unknown" };
  };

  const closeIOSInstructions = () => {
    setShowIOSInstructions(false);
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    showIOSInstructions,
    installApp,
    closeIOSInstructions,
  };
};
