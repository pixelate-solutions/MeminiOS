import type { Skill } from "@meminios/shared";
import { EvidenceChip, TrustBadge } from "@meminios/ui";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock3,
  FileDiff,
  Search,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

export function SkillsSurface({
  skills,
  onToast,
}: {
  skills: Skill[];
  onToast: (message: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [reviewOnly, setReviewOnly] = useState(false);
  const selected = skills.find((skill) => skill.id === selectedId);
  const filtered = useMemo(
    () =>
      skills.filter((skill) => {
        const matchesQuery = `${skill.title} ${skill.domain} ${skill.owner.name}`
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase());
        return matchesQuery && (!reviewOnly || skill.status === "in_review");
      }),
    [query, reviewOnly, skills],
  );
  const grouped = Object.groupBy(filtered, (skill) => skill.domain);
  const reviewCount = skills.filter((skill) => skill.status === "in_review").length;

  if (selected) {
    return <SkillDetail skill={selected} onBack={() => setSelectedId(null)} onToast={onToast} />;
  }

  return (
    <div className="skills-surface">
      <header className="surface-intro skills-intro">
        <div>
          <span className="eyebrow">Governed procedures · {skills.length} active</span>
          <h1>The way your company works.</h1>
          <p>Readable by people. Executable by agents only at the trust level you choose.</p>
        </div>
        <button
          className={`review-queue${reviewOnly ? " is-active" : ""}`}
          type="button"
          onClick={() => setReviewOnly((value) => !value)}
        >
          <span>{reviewCount}</span>
          <span>
            <strong>Review queue</strong>
            <small>Needs a steward</small>
          </span>
          <ChevronRight size={16} />
        </button>
      </header>

      <div className="skills-tools">
        <label>
          <Search size={14} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a skill, owner, or domain"
          />
        </label>
        <span>{filtered.length} shown</span>
      </div>

      <div className="skills-library">
        {Object.entries(grouped).map(([domain, domainSkills]) => (
          <section className="skill-domain" key={domain}>
            <div className="domain-heading">
              <h2>{domain}</h2>
              <span>{domainSkills?.length ?? 0}</span>
            </div>
            <div className="skills-table" role="table" aria-label={`${domain} skills`}>
              <div className="skills-table-head" role="row">
                <span>Procedure</span>
                <span>Trust</span>
                <span>Owner</span>
                <span>Freshness</span>
                <span>Version</span>
                <span />
              </div>
              {domainSkills?.map((skill) => (
                <button
                  className="skill-row"
                  type="button"
                  role="row"
                  key={skill.id}
                  onClick={() => setSelectedId(skill.id)}
                >
                  <span className="skill-title-cell">
                    <strong>{skill.title}</strong>
                    <small>{skill.trigger}</small>
                  </span>
                  <span>
                    <TrustBadge level={skill.trustLevel} />
                  </span>
                  <span className="owner-cell">
                    <span>{skill.owner.initials}</span>
                    {skill.owner.name}
                  </span>
                  <span className="freshness-cell">
                    <span>
                      <i style={{ width: `${skill.freshness * 100}%` }} />
                    </span>
                    <small>{Math.round(skill.freshness * 100)}%</small>
                  </span>
                  <span className="version-cell">v{skill.version}</span>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function SkillDetail({
  skill,
  onBack,
  onToast,
}: {
  skill: Skill;
  onBack: () => void;
  onToast: (message: string) => void;
}) {
  const [tab, setTab] = useState<"procedure" | "history">("procedure");
  return (
    <div className="skill-detail">
      <div className="skill-detail-bar">
        <button className="text-action" type="button" onClick={onBack}>
          <ArrowLeft size={14} /> All skills
        </button>
        <div>
          <TrustBadge level={skill.trustLevel} />
          <span className="skill-version">v{skill.version}</span>
        </div>
      </div>
      <header>
        <span className="eyebrow">
          {skill.domain} · Owned by {skill.owner.name}
        </span>
        <h1>{skill.title}</h1>
        <p>{skill.trigger}</p>
        <div className="skill-verification">
          <Clock3 size={13} /> Last verified{" "}
          {new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(
            new Date(skill.lastVerifiedAt),
          )}
        </div>
      </header>
      <nav className="skill-tabs" aria-label="Skill detail tabs">
        <button
          className={tab === "procedure" ? "is-active" : ""}
          type="button"
          onClick={() => setTab("procedure")}
        >
          Procedure
        </button>
        <button
          className={tab === "history" ? "is-active" : ""}
          type="button"
          onClick={() => setTab("history")}
        >
          Version history
        </button>
      </nav>
      {tab === "procedure" ? (
        <div className="procedure-layout">
          <article className="procedure-document">
            <section>
              <span className="procedure-number">01</span>
              <div>
                <h2>Before you begin</h2>
                <ul>
                  {skill.preconditions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
            <section>
              <span className="procedure-number">02</span>
              <div>
                <h2>Decision procedure</h2>
                <ol>
                  {skill.steps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
            </section>
            <section>
              <span className="procedure-number">03</span>
              <div>
                <h2>Exceptions</h2>
                <ul>
                  {skill.exceptions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
            <section>
              <span className="procedure-number">04</span>
              <div>
                <h2>Escalation</h2>
                <p>{skill.escalation}</p>
              </div>
            </section>
          </article>
          <aside className="skill-evidence">
            <span className="eyebrow">Why this procedure exists</span>
            {skill.evidence.map((item, index) => (
              <div key={item.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.title}</strong>
                <p>{item.excerpt}</p>
                <EvidenceChip evidence={item} compact />
              </div>
            ))}
          </aside>
        </div>
      ) : (
        <div className="version-history">
          <div className="history-entry history-entry--current">
            <span>v{skill.version}</span>
            <div>
              <strong>Current proposal</strong>
              <p>Clarified the approval boundary and added source-backed exceptions.</p>
              <small>{skill.owner.name} · 10 days ago</small>
            </div>
            <FileDiff size={17} />
          </div>
          <div className="history-entry">
            <span>v{Math.max(1, skill.version - 1)}</span>
            <div>
              <strong>Previously approved</strong>
              <p>Added the recorded escalation owner.</p>
              <small>MeminiOS · 3 months ago</small>
            </div>
            <FileDiff size={17} />
          </div>
        </div>
      )}
      {skill.status === "in_review" && (
        <div className="approval-bar">
          <div>
            <UserRoundCheck size={17} />
            <span>
              <strong>Ready for steward review</strong>
              <small>Approving makes this version agent-visible at its selected trust level.</small>
            </span>
          </div>
          <div>
            <button
              className="button button--quiet"
              type="button"
              onClick={() => onToast("Changes requested from the skill owner")}
            >
              <X size={14} /> Request changes
            </button>
            <button
              className="button button--primary"
              type="button"
              onClick={() => onToast("Skill approved and audit entry recorded")}
            >
              <Check size={14} /> Approve v{skill.version}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
