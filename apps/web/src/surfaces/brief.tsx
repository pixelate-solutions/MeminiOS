import type { Signal, Viewer } from "@meminios/shared";
import { StoryCard } from "@meminios/ui";
import { ArrowRight, CircleCheck, Feather, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { sendSignalFeedback } from "../api";

export interface BriefSurfaceProps {
  viewer: Viewer;
  masthead: string;
  initialSignals: Signal[];
  commandOpen: boolean;
  onAsk: () => void;
  onToast: (message: string) => void;
}

export function BriefSurface({
  viewer,
  masthead,
  initialSignals,
  commandOpen,
  onAsk,
  onToast,
}: BriefSurfaceProps) {
  const [signals, setSignals] = useState(initialSignals);
  const [selected, setSelected] = useState(0);
  const activeSignals = useMemo(
    () => signals.filter((signal) => signal.state !== "resolved" && signal.state !== "dismissed"),
    [signals],
  );
  const resolvedSignals = useMemo(
    () => signals.filter((signal) => signal.state === "resolved" || signal.state === "dismissed"),
    [signals],
  );

  const updateSignal = (
    signal: Signal,
    state: "acknowledged" | "resolved" | "dismissed",
    reason?: string,
  ) => {
    setSignals((items) => items.map((item) => (item.id === signal.id ? { ...item, state } : item)));
    void sendSignalFeedback(signal.id, state, reason);
  };

  useEffect(() => {
    if (commandOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (event.key.toLocaleLowerCase() === "j") {
        setSelected((value) => Math.min(value + 1, activeSignals.length - 1));
      }
      if (event.key.toLocaleLowerCase() === "k") {
        setSelected((value) => Math.max(value - 1, 0));
      }
      const current = activeSignals[selected];
      if (!current) return;
      if (event.key.toLocaleLowerCase() === "e") {
        window.open(current.evidence[0]?.permalink, "_blank", "noopener,noreferrer");
      }
      if (event.key.toLocaleLowerCase() === "d") {
        updateSignal(current, "dismissed", "Keyboard dismissal");
        onToast("Dismissed — the detector will learn from this");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeSignals, commandOpen, onToast, selected]);

  useEffect(() => {
    const card = document.querySelector<HTMLElement>(
      `[data-signal-id="${activeSignals[selected]?.id}"]`,
    );
    card?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeSignals, selected]);

  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date("2026-07-21T11:30:00.000Z"));

  return (
    <div className="brief-surface">
      <header className="brief-masthead">
        <div className="brief-edition">
          <span>Morning brief</span>
          <time dateTime="2026-07-21">{date}</time>
        </div>
        <div className="brief-title-row">
          <div>
            <span className="eyebrow">Good morning, {viewer.name.split(" ")[0]}</span>
            <h1>Your company, in focus.</h1>
          </div>
          <div className="brief-keyboard" aria-label="Keyboard shortcuts">
            <span>
              <kbd>J</kbd>
              <kbd>K</kbd> move
            </span>
            <span>
              <kbd>E</kbd> evidence
            </span>
            <span>
              <kbd>D</kbd> dismiss
            </span>
          </div>
        </div>
        <p className="masthead-summary">
          <Feather size={16} aria-hidden="true" />
          <span>{activeSignals.length ? masthead : "Nothing needs you right now"}</span>
        </p>
      </header>

      <section className="brief-section" aria-labelledby="today-heading">
        <div className="section-label">
          <h2 id="today-heading">Today</h2>
          <span>{activeSignals.length} things worth your attention</span>
        </div>
        {activeSignals.length ? (
          <div className="story-list">
            {activeSignals.map((signal, index) => (
              <StoryCard
                key={signal.id}
                signal={signal}
                selected={selected === index}
                onPrimary={(item) => {
                  updateSignal(
                    item,
                    item.primaryAction.intent === "resolve" ? "resolved" : "acknowledged",
                  );
                  onToast(
                    item.primaryAction.intent === "nudge"
                      ? "Update drafted with both sources attached"
                      : item.primaryAction.intent === "merge"
                        ? "Owners invited to a shared working note"
                        : "Opened with its evidence trail",
                  );
                }}
                onDismiss={(item, reason) => {
                  updateSignal(item, "dismissed", reason);
                  onToast("Dismissed — the detector will learn from this");
                }}
              />
            ))}
          </div>
        ) : (
          <div className="brief-empty">
            <CircleCheck size={28} />
            <h3>Nothing needs you.</h3>
            <p>The brief is quiet. That’s a good state, not an empty dashboard.</p>
            <button className="text-action" type="button" onClick={onAsk}>
              Ask me something <ArrowRight size={14} />
            </button>
          </div>
        )}
      </section>

      {resolvedSignals.length > 0 && (
        <section
          className="brief-section brief-section--resolved"
          aria-labelledby="resolved-heading"
        >
          <div className="section-label">
            <h2 id="resolved-heading">Resolved</h2>
            <span>{resolvedSignals.length} cleared from today</span>
          </div>
          <div className="resolved-list">
            {resolvedSignals.map((signal) => (
              <div className="resolved-row" key={signal.id}>
                <CircleCheck size={14} />
                <span>{signal.headline}</span>
                <span>{signal.state}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <button className="floating-ask" type="button" onClick={onAsk}>
        <Search size={15} /> Ask the brain <span>⌘K</span>
      </button>
    </div>
  );
}
