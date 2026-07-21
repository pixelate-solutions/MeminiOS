import { Brand } from "@meminios/ui";
import { Command, Moon, Sun } from "lucide-react";
import type { Surface } from "../product-app";
import type { Theme } from "../hooks/use-theme";

const surfaces: Surface[] = ["brief", "ask", "map", "skills"];

export interface TopBarProps {
  surface: Surface;
  onSurfaceChange: (surface: Surface) => void;
  onOpenCommand: () => void;
  theme: Theme;
  onThemeToggle: () => void;
  initials: string;
}

export function TopBar({
  surface,
  onSurfaceChange,
  onOpenCommand,
  theme,
  onThemeToggle,
  initials,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <a className="top-brand" href="/" aria-label="MeminiOS home">
        <Brand />
        <span className="tenant-name">Acme Robotics</span>
      </a>

      <nav className="surface-switcher" aria-label="Primary">
        {surfaces.map((item) => (
          <button
            key={item}
            className={surface === item ? "is-active" : ""}
            type="button"
            onClick={() => onSurfaceChange(item)}
            aria-current={surface === item ? "page" : undefined}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="top-actions">
        <button className="command-trigger" type="button" onClick={onOpenCommand}>
          <Command size={14} />
          <span>Find anything</span>
          <kbd>⌘K</kbd>
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={onThemeToggle}
          aria-label={`Use ${theme === "light" ? "dark" : "light"} theme`}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button
          className="avatar"
          type="button"
          onClick={onOpenCommand}
          aria-label="Open account and admin commands"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
