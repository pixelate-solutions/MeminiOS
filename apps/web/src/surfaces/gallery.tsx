import { demoBootstrap } from "@meminios/shared/demo";
import { AnswerCanvas, Brand, EvidenceChip, StoryCard, TrustBadge } from "@meminios/ui";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/use-theme";

export function Gallery() {
  const { theme, toggleTheme } = useTheme();
  const criticalSignal = demoBootstrap.signals[0];
  const duplicateSignal = demoBootstrap.signals[2];
  if (!criticalSignal || !duplicateSignal) throw new Error("Demo gallery signals are missing");
  return (
    <main className="gallery">
      <header className="gallery-header">
        <Brand />
        <div>
          <span className="eyebrow">Internal gallery · M0</span>
          <h1>The editorial primitives.</h1>
        </div>
        <button className="icon-button" type="button" onClick={toggleTheme}>
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </header>
      <section className="gallery-section">
        <div className="gallery-label">
          <span>01</span>
          <h2>Evidence is always tactile</h2>
        </div>
        <div className="gallery-stage gallery-stage--inline">
          {demoBootstrap.featuredAnswer.evidence.map((item) => (
            <EvidenceChip key={item.id} evidence={item} />
          ))}
        </div>
      </section>
      <section className="gallery-section">
        <div className="gallery-label">
          <span>02</span>
          <h2>Severity is a rule, not an alarm</h2>
        </div>
        <div className="gallery-stage">
          <StoryCard signal={criticalSignal} />
          <StoryCard signal={duplicateSignal} />
        </div>
      </section>
      <section className="gallery-section">
        <div className="gallery-label">
          <span>03</span>
          <h2>Trust reads at a glance</h2>
        </div>
        <div className="gallery-stage gallery-stage--inline">
          <TrustBadge level="reference" />
          <TrustBadge level="draft_for_approval" />
          <TrustBadge level="autonomous" />
        </div>
      </section>
      <section className="gallery-section gallery-section--answer">
        <div className="gallery-label">
          <span>04</span>
          <h2>An answer is a document</h2>
        </div>
        <AnswerCanvas answer={demoBootstrap.featuredAnswer} />
      </section>
    </main>
  );
}
