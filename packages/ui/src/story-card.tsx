"use client";

import type { Signal } from "@meminios/shared";
import { ArrowUpRight, Check, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { ConfidenceTick } from "./confidence";
import { EvidenceChip } from "./evidence-chip";

const dismissReasons = ["Not useful", "Already handled", "Wrong owner", "Not accurate"] as const;

export interface StoryCardProps {
  signal: Signal;
  selected?: boolean;
  onPrimary?: (signal: Signal) => void;
  onDismiss?: (signal: Signal, reason: string) => void;
}

export function StoryCard({ signal, selected = false, onPrimary, onDismiss }: StoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDismiss, setShowDismiss] = useState(false);

  return (
    <article
      className={`story-card story-card--${signal.severity}${selected ? " is-selected" : ""}`}
      data-signal-id={signal.id}
      tabIndex={0}
      aria-label={`${signal.headline}. ${Math.round(signal.confidence * 100)}% confidence.`}
    >
      <div className="story-rule" aria-hidden="true" />
      <div className="story-content">
        <div className="story-meta">
          <span>{signal.type.replaceAll("_", " ")}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={signal.occurredAt}>
            {new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(
              new Date(signal.occurredAt),
            )}
          </time>
          <ConfidenceTick value={signal.confidence} />
        </div>

        <button
          className="story-expand"
          type="button"
          onClick={() => setExpanded((value) => !value)}
        >
          <span>
            <h3>{signal.headline}</h3>
            <p>{signal.summary}</p>
          </span>
          <ChevronDown className={expanded ? "is-rotated" : ""} size={18} aria-hidden="true" />
        </button>

        {expanded && (
          <div className="story-rationale">
            <span>Why this surfaced</span>
            <p>{signal.rationale}</p>
          </div>
        )}

        <div className="story-evidence" aria-label="Evidence">
          {signal.evidence.map((item) => (
            <EvidenceChip evidence={item} key={item.id} />
          ))}
        </div>

        <div className="story-actions">
          <button
            className="button button--primary"
            type="button"
            onClick={() => onPrimary?.(signal)}
          >
            {signal.primaryAction.intent === "resolve" ? (
              <Check size={15} />
            ) : (
              <ArrowUpRight size={15} />
            )}
            {signal.primaryAction.label}
          </button>
          <div className="dismiss-wrap">
            <button
              className="button button--quiet"
              type="button"
              onClick={() => setShowDismiss((value) => !value)}
              aria-expanded={showDismiss}
            >
              <X size={14} /> Dismiss
            </button>
            {showDismiss && (
              <div className="dismiss-menu" role="menu" aria-label="Why are you dismissing this?">
                <span>Help the brief get sharper</span>
                {dismissReasons.map((reason) => (
                  <button
                    role="menuitem"
                    type="button"
                    key={reason}
                    onClick={() => {
                      onDismiss?.(signal, reason);
                      setShowDismiss(false);
                    }}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
