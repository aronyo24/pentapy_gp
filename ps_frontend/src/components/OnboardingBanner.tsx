import { useEffect, useState } from "react";

export const OnboardingBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem("penta_seen_onboarding");
      if (!seen) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem("penta_seen_onboarding", "1");
    } catch {}
    setVisible(false);
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-card border border-border px-4 py-2 rounded-lg shadow-soft-md flex items-center gap-4">
        <div>
          <strong>Welcome to PentaPy</strong>
          <div className="text-sm text-muted-foreground">Desktop-first preview — no login required.</div>
        </div>
        <div className="ml-4 flex gap-2">
          <button onClick={dismiss} className="px-3 py-1 rounded-md bg-primary text-white">Got it</button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingBanner;
