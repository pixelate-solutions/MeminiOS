import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { fetchBootstrap } from "./api";
import { CommandPalette } from "./components/command-palette";
import { Toast } from "./components/toast";
import { TopBar } from "./components/top-bar";
import { useTheme } from "./hooks/use-theme";
import { AdminSurface } from "./surfaces/admin";
import { AskSurface } from "./surfaces/ask";
import { BriefSurface } from "./surfaces/brief";
const MapSurface = lazy(() =>
  import("./surfaces/map").then((module) => ({ default: module.MapSurface })),
);
const SkillsSurface = lazy(() =>
  import("./surfaces/skills").then((module) => ({ default: module.SkillsSurface })),
);

export type Surface = "brief" | "ask" | "map" | "skills" | "admin";

export function ProductApp() {
  const { data } = useQuery({ queryKey: ["bootstrap"], queryFn: fetchBootstrap });
  const [surface, setSurface] = useState<Surface>("brief");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [adminFocus, setAdminFocus] = useState<"connectors" | "models">("connectors");
  const { theme, toggleTheme } = useTheme();

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
      if (event.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!data) {
    return (
      <main className="loading-screen">
        <span className="loading-mark">M</span>
        <p>Composing your brief…</p>
      </main>
    );
  }

  const handleCommand = (action: string) => {
    setPaletteOpen(false);
    if (action.startsWith("admin:")) {
      setAdminFocus(action.endsWith("models") ? "models" : "connectors");
      setSurface("admin");
      return;
    }
    if (action.startsWith("ask")) setSurface("ask");
    else if (action.startsWith("map")) setSurface("map");
    else if (action.startsWith("skills")) setSurface("skills");
    else setSurface("brief");
  };

  return (
    <div className="product-shell">
      <TopBar
        surface={surface}
        onSurfaceChange={setSurface}
        onOpenCommand={() => setPaletteOpen(true)}
        theme={theme}
        onThemeToggle={toggleTheme}
        initials={data.viewer.initials}
      />
      <main id="main-content">
        {surface === "brief" && (
          <BriefSurface
            viewer={data.viewer}
            masthead={data.masthead}
            initialSignals={data.signals}
            commandOpen={paletteOpen}
            onAsk={() => setSurface("ask")}
            onToast={showToast}
          />
        )}
        {surface === "ask" && <AskSurface answer={data.featuredAnswer} onToast={showToast} />}
        {surface === "map" && (
          <Suspense fallback={<SurfaceLoading label="Drawing the permission-visible map…" />}>
            <MapSurface graph={data.graph} onToast={showToast} />
          </Suspense>
        )}
        {surface === "skills" && (
          <Suspense fallback={<SurfaceLoading label="Opening the governed library…" />}>
            <SkillsSurface skills={data.skills} onToast={showToast} />
          </Suspense>
        )}
        {surface === "admin" && (
          <AdminSurface focus={adminFocus} onBack={() => setSurface("brief")} />
        )}
      </main>
      <CommandPalette
        commands={data.commands}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onAction={handleCommand}
      />
      <Toast message={toast} />
    </div>
  );
}

function SurfaceLoading({ label }: { label: string }) {
  return (
    <div className="surface-loading">
      <span className="loading-mark">M</span>
      <p>{label}</p>
    </div>
  );
}
