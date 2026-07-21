import type { Answer } from "@meminios/shared";
import { AnswerCanvas, EvidenceChip } from "@meminios/ui";
import { ArrowRight, MessageCircleQuestion, Search, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

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
  const renderedAnswer =
    activeQuestion === answer.question ? answer : { ...answer, question: activeQuestion };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = query.trim();
    if (next.length < 2) return;
    setActiveQuestion(next);
    onToast("Answer composed from 3 permission-checked sources");
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
        <span>Answers are scoped to what you can already access.</span>
      </div>

      <AnswerCanvas
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
            {answer.evidence.slice(0, 2).map((item) => (
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
