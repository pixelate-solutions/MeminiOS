import type { Answer } from "@meminios/shared";
import { AnswerCanvas, EvidenceChip } from "@meminios/ui";
import { ArrowRight, Lock, MessageCircleQuestion, Search, Send, ShieldCheck } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { composeAnswerFor, personas } from "../demo/permissioned-answer";

export function AskSurface({
  answer,
  onToast,
}: {
  answer: Answer;
  onToast: (message: string) => void;
}) {
  const [query, setQuery] = useState(answer.question);
  const [activeQuestion, setActiveQuestion] = useState(answer.question);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [interviewAnswer, setInterviewAnswer] = useState("");
  const [personaId, setPersonaId] = useState(personas[0]!.id);
  const persona = personas.find((item) => item.id === personaId) ?? personas[0]!;
  const scoped = useMemo(() => composeAnswerFor(persona), [persona]);
  const scopedAnswer = answer.id === scoped.answer.id ? scoped.answer : answer;
  const renderedAnswer =
    activeQuestion === answer.question
      ? scopedAnswer
      : { ...scopedAnswer, question: activeQuestion };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = query.trim();
    if (next.length < 2) return;
    setActiveQuestion(next);
    onToast(`Answer composed from ${scoped.readable} permission-checked sources`);
  };

  return (
    <div className="ask-surface">
      <div className="ask-composer-wrap">
        <form className="ask-composer" onSubmit={submit}>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Ask the company brain"
            placeholder="Ask what your company knows…"
          />
          <button type="submit" aria-label="Ask">
            <ArrowRight size={17} />
          </button>
        </form>
        <div className="persona-switch" role="radiogroup" aria-label="View answer as">
          <span>Viewing as</span>
          {personas.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={item.id === persona.id}
              className={item.id === persona.id ? "is-active" : ""}
              onClick={() => setPersonaId(item.id)}
              title={`${item.name} · ${item.title}`}
            >
              <span className="persona-switch__avatar">{item.initials}</span>
              {item.team}
            </button>
          ))}
        </div>
      </div>

      <section className="permission-strip" aria-label="Permission filter">
        <span className="permission-strip__label">
          <ShieldCheck size={14} /> Permission-aware retrieval
        </span>
        <span>
          <strong>{persona.name}</strong> · {persona.title}
        </span>
        <span>
          <strong>{scoped.searched}</strong> matching sources
        </span>
        <span>
          <strong>{scoped.readable}</strong> readable
        </span>
        <span className="permission-strip__withheld">
          <Lock size={12} /> <strong>{scoped.withheldSources}</strong> excluded before synthesis
          {scoped.withheldPassages > 0
            ? ` · ${scoped.withheldPassages} passage${scoped.withheldPassages === 1 ? "" : "s"} withheld`
            : ""}
        </span>
      </section>

      <AnswerCanvas
        key={persona.id}
        answer={renderedAnswer}
        onSave={() => onToast("Saved to tomorrow’s Brief")}
        onProposeSkill={() => onToast("Draft skill created in the steward review queue")}
        onAskExpert={() => setInterviewOpen(true)}
      />

      {interviewOpen && (
        <section className="interview-card" aria-label="Expert interview">
          <button className="interview-close" type="button" onClick={() => setInterviewOpen(false)}>
            Close
          </button>
          <span className="eyebrow">
            <MessageCircleQuestion size={13} /> Tacit knowledge interview
          </span>
          <h2>Daniel, what margin floor do you use in practice?</h2>
          <p>
            Think about the last three EMEA exceptions you reviewed. What made one safe to approve
            and another worth escalating?
          </p>
          <div className="interview-context">
            {renderedAnswer.evidence.slice(0, 2).map((item) => (
              <EvidenceChip key={item.id} evidence={item} />
            ))}
          </div>
          <label>
            Your answer
            <textarea
              value={interviewAnswer}
              onChange={(event) => setInterviewAnswer(event.target.value)}
              placeholder="Walk through a real example…"
              rows={5}
            />
          </label>
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              onToast("Interview saved; a cited skill draft is ready for review");
              setInterviewOpen(false);
            }}
          >
            <Send size={14} /> Save and draft the skill
          </button>
        </section>
      )}
    </div>
  );
}
