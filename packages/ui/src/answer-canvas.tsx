"use client";

import type { Answer } from "@meminios/shared";
import { ArrowUpRight, Bookmark, MessageCircleQuestion, Sparkles } from "lucide-react";
import { EvidenceChip } from "./evidence-chip";

export interface AnswerCanvasProps {
  answer: Answer;
  onAskExpert?: () => void;
  onSave?: () => void;
  onProposeSkill?: () => void;
}

export function AnswerCanvas({ answer, onAskExpert, onSave, onProposeSkill }: AnswerCanvasProps) {
  const citationNumber = new Map(answer.evidence.map((item, index) => [item.id, index + 1]));

  return (
    <article className="answer-canvas">
      <header className="answer-header">
        <div>
          <span className="eyebrow">{answer.kicker}</span>
          <h1>{answer.question}</h1>
        </div>
        <div className={`answer-grade answer-grade--${answer.confidence}`}>
          <span aria-hidden="true" /> {answer.confidence} confidence
        </div>
      </header>

      <div className="answer-layout">
        <div className="answer-document">
          <p className="answer-dek">{answer.title}</p>
          <div className="answer-prose">
            {answer.paragraphs.map((paragraph) => (
              <p key={paragraph.id}>
                {paragraph.text}{" "}
                <span className="inline-citations">
                  {paragraph.citationIds.map((id) => {
                    const item = answer.evidence.find((candidate) => candidate.id === id);
                    const number = citationNumber.get(id);
                    return item && number ? (
                      <a
                        key={id}
                        href={`#evidence-${id}`}
                        title={`${item.title}: ${item.excerpt}`}
                        aria-label={`See evidence ${number}: ${item.title}`}
                      >
                        {number}
                      </a>
                    ) : null;
                  })}
                </span>
              </p>
            ))}
          </div>

          <div className="answer-actions">
            <button className="button button--quiet" type="button" onClick={onSave}>
              <Bookmark size={14} /> Save to Brief
            </button>
            <button className="button button--quiet" type="button" onClick={onProposeSkill}>
              <Sparkles size={14} /> Propose as skill
            </button>
          </div>

          <section className="gap-block">
            <span className="eyebrow">What the brain doesn’t know</span>
            <h2>{answer.gap.title}</h2>
            <p>{answer.gap.body}</p>
            <button className="text-action" type="button" onClick={onAskExpert}>
              <MessageCircleQuestion size={16} /> Ask {answer.gap.suggestedExpert}
              <ArrowUpRight size={14} />
            </button>
          </section>

          {answer.followUps.map((followUp, index) => (
            <section className="follow-up" key={followUp.id}>
              <span className="footnote-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h2>{followUp.question}</h2>
                <p>{followUp.answer}</p>
              </div>
            </section>
          ))}
        </div>

        <aside className="evidence-rail" aria-label="Evidence used in this answer">
          <div className="rail-heading">
            <span>Evidence</span>
            <span>{answer.evidence.length} sources</span>
          </div>
          {answer.evidence.map((item, index) => (
            <a
              id={`evidence-${item.id}`}
              className="evidence-card"
              href={item.permalink}
              target="_blank"
              rel="noreferrer"
              key={item.id}
            >
              <span className="evidence-card-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="evidence-card-body">
                <strong>{item.title}</strong>
                <span>{item.excerpt}</span>
                <span className="evidence-card-footer">
                  <EvidenceChip evidence={item} compact />
                </span>
              </span>
            </a>
          ))}
        </aside>
      </div>
    </article>
  );
}
