import type { Command as CommandItem } from "@meminios/shared";
import { ArrowRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export interface CommandPaletteProps {
  commands: CommandItem[];
  open: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}

export function CommandPalette({ commands, open, onClose, onAction }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase().trim();
    if (!normalized) return commands;
    return commands.filter((item) =>
      `${item.label} ${item.group} ${item.hint}`.toLocaleLowerCase().includes(normalized),
    );
  }, [commands, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelected(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => setSelected(0), [query]);

  if (!open) return null;

  return (
    <div className="palette-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Find anything"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="palette-input-wrap">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setSelected((value) => Math.min(value + 1, filtered.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setSelected((value) => Math.max(value - 1, 0));
              }
              if (event.key === "Enter" && filtered[selected]) {
                onAction(filtered[selected].action);
              }
            }}
            placeholder="Search people, answers, skills, settings…"
            aria-label="Search commands"
          />
          <button type="button" onClick={onClose} aria-label="Close command palette">
            <X size={16} />
          </button>
        </div>
        <div className="palette-results" role="listbox">
          {filtered.length === 0 ? (
            <div className="palette-empty">
              <span>No match yet.</span>
              <p>Press Enter to ask the brain about “{query}”.</p>
            </div>
          ) : (
            filtered.map((item, index) => {
              const previous = filtered[index - 1];
              return (
                <div key={item.id}>
                  {(index === 0 || previous?.group !== item.group) && (
                    <div className="palette-group">{item.group}</div>
                  )}
                  <button
                    className={`palette-result${selected === index ? " is-selected" : ""}`}
                    type="button"
                    role="option"
                    aria-selected={selected === index}
                    onMouseMove={() => setSelected(index)}
                    onClick={() => onAction(item.action)}
                  >
                    <span>{item.label}</span>
                    <span className="palette-hint">
                      {item.hint} <ArrowRight size={12} />
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </div>
        <footer className="palette-footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> Move
          </span>
          <span>
            <kbd>↵</kbd> Open
          </span>
          <span>
            <kbd>esc</kbd> Close
          </span>
        </footer>
      </section>
    </div>
  );
}
