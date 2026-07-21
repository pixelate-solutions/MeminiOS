"use client";

import { demoBootstrap } from "@meminios/shared/demo";
import { Brand, StoryCard } from "@meminios/ui";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  Code2,
  Copy,
  KeyRound,
  Menu,
  Network,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

const mcpCommand = "npx @meminios/mcp@latest --url https://brain.yourcompany.com/mcp";

export function LandingPage() {
  const [activeSignal, setActiveSignal] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveSignal((value) => (value + 1) % demoBootstrap.signals.length),
      4_200,
    );
    return () => window.clearInterval(timer);
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.includes("@")) return;
    setSubmitted(true);
  };

  const signal = demoBootstrap.signals[activeSignal] ?? demoBootstrap.signals[0];

  return (
    <main className="landing-shell">
      <nav className="landing-nav" aria-label="Marketing navigation">
        <a href="#top" aria-label="MeminiOS home">
          <Brand />
        </a>
        <div className={`landing-links${menuOpen ? " is-open" : ""}`}>
          <a href="#product" onClick={() => setMenuOpen(false)}>
            Product
          </a>
          <a href="#security" onClick={() => setMenuOpen(false)}>
            Security
          </a>
          <a href="#integrations" onClick={() => setMenuOpen(false)}>
            Integrations
          </a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>
            Pricing
          </a>
          <a href="#agents" onClick={() => setMenuOpen(false)}>
            For agents
          </a>
        </div>
        <a className="nav-cta" href="#waitlist">
          Start a pilot <ArrowRight size={13} />
        </a>
        <button
          className="mobile-menu"
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      <section className="landing-hero" id="top">
        <div className="hero-copy">
          <span className="hero-kicker">
            <span /> Institutional intelligence, governed
          </span>
          <h1>The brain layer for your company’s AI.</h1>
          <p>
            MeminiOS turns scattered company knowledge into permission-aware answers, proactive
            signals, and human-approved skills your agents can safely use.
          </p>
          <div className="hero-actions">
            <a className="landing-button landing-button--ink" href="#waitlist">
              Start a 14-day pilot <ArrowRight size={14} />
            </a>
            <a className="landing-button landing-button--line" href="#product">
              See the morning brief
            </a>
          </div>
          <div className="hero-proof">
            <span>
              <ShieldCheck size={13} /> Source permissions preserved
            </span>
            <span>
              <CircleCheck size={13} /> Every claim cited
            </span>
            <span>
              <KeyRound size={13} /> Your keys available
            </span>
          </div>
        </div>
        <aside className="hero-note">
          <span className="eyebrow">The premise</span>
          <p>Search tells you where to read.</p>
          <p>A brain reads, connects, and tells you what matters—before you remember to ask.</p>
        </aside>
      </section>

      <section className="product-demonstration" id="product">
        <header>
          <span className="eyebrow">A live-feeling Brief · Canned Acme Robotics data</span>
          <h2>Your company tells you what matters today.</h2>
          <p>
            No chart grid. No notification flood. A short, cited morning brief built around action.
          </p>
        </header>
        <div className="demo-frame">
          <div className="demo-chrome">
            <Brand compact />
            <div>
              <span className="is-active">Brief</span>
              <span>Ask</span>
              <span>Map</span>
              <span>Skills</span>
            </div>
            <span>MC</span>
          </div>
          <div className="demo-body">
            <div className="demo-edition">
              <span>Morning brief</span>
              <span>Tuesday, July 21</span>
            </div>
            <h3>Your company, in focus.</h3>
            <p className="demo-summary">
              <Sparkles size={14} /> {demoBootstrap.masthead}
            </p>
            <div className="demo-story-wrap" aria-live="polite">
              {signal && <StoryCard key={signal.id} signal={signal} />}
            </div>
            <div className="demo-dots" aria-label="Choose sample signal">
              {demoBootstrap.signals.map((item, index) => (
                <button
                  key={item.id}
                  className={index === activeSignal ? "is-active" : ""}
                  type="button"
                  onClick={() => setActiveSignal(index)}
                  aria-label={`Show signal ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="difference-section">
        <div className="section-number">01</div>
        <div className="difference-copy">
          <span className="eyebrow">Beyond retrieval</span>
          <h2>Answers, not a pile of chunks.</h2>
          <p>
            Hybrid search and graph traversal assemble the right evidence. A synthesis layer writes
            a direct answer, cites every claim, and says what the brain still doesn’t know.
          </p>
        </div>
        <div className="answer-specimen">
          <span className="answer-question">Who approves pricing exceptions in EMEA?</span>
          <h3>Elena owns the first decision; Finance is the backstop.</h3>
          <p>
            Elena Rossi can approve discounts from 10–18% when standard term and margin guardrails
            are met.<sup>1</sup>
            <sup>2</sup>
          </p>
          <div>
            <span>What the brain doesn’t know</span>
            <strong>The current margin floor hasn’t synced since April.</strong>
          </div>
        </div>
      </section>

      <section className="custody-section" id="security">
        <header>
          <span className="eyebrow">The custody ladder</span>
          <h2>Your knowledge stays yours at every rung.</h2>
        </header>
        <div className="custody-ladder">
          <div>
            <span>01</span>
            <ShieldCheck size={20} />
            <h3>Per-tenant keys</h3>
            <p>
              Hard Postgres RLS, source ACL snapshots, and a dedicated envelope key for every
              tenant.
            </p>
            <small>Standard</small>
          </div>
          <div>
            <span>02</span>
            <KeyRound size={20} />
            <h3>Your keys</h3>
            <p>
              Wrap tenant data keys with your AWS or GCP KMS grant. Revoke it and the data becomes
              unreadable.
            </p>
            <small>Enterprise</small>
          </div>
          <div>
            <span>03</span>
            <Network size={20} />
            <h3>Your cloud</h3>
            <p>
              A config-driven data plane keeps database, storage, queue, model, and KMS endpoints
              portable.
            </p>
            <small>Roadmap</small>
          </div>
        </div>
        <div className="security-line">
          <span>Zero-retention model tiers</span>
          <span>Every read audited</span>
          <span>US / EU residency</span>
          <span>Full self-serve export</span>
        </div>
      </section>

      <section className="integrations-section" id="integrations">
        <header>
          <span className="eyebrow">Bring the work, keep the permissions</span>
          <h2>One brain across every place your company already thinks.</h2>
        </header>
        <div className="integration-wall">
          {[
            "Slack",
            "Google Drive",
            "Notion",
            "GitHub",
            "Linear",
            "Jira",
            "Confluence",
            "Zendesk",
            "Gmail",
            "Calendar",
            "Salesforce",
            "HubSpot",
            "Teams",
            "SharePoint",
            "Intercom",
          ].map((name, index) => (
            <span key={name}>
              <i>{name.slice(0, 1)}</i>
              {name}
              {index < 3 && <small>Native</small>}
            </span>
          ))}
          <span className="integration-more">
            <i>+</i>250+ through Composio
          </span>
        </div>
      </section>

      <section className="agents-section" id="agents">
        <div>
          <span className="eyebrow">The flagship agent surface</span>
          <h2>Give Claude Code or Codex a company memory in one command.</h2>
          <p>
            Search, synthesize, traverse the graph, read approved skills, and propose pending facts
            through a scope-aware MCP server.
          </p>
          <ul>
            <li>
              <Check size={13} /> Delegated human permissions by default
            </li>
            <li>
              <Check size={13} /> Approved skills only
            </li>
            <li>
              <Check size={13} /> Every call leaves an audit trail
            </li>
          </ul>
        </div>
        <div className="command-window">
          <div>
            <span />
            <span />
            <span />
            <small>terminal</small>
          </div>
          <code>
            <span>$</span> {mcpCommand}
          </code>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(mcpCommand);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            }}
          >
            <Copy size={13} /> {copied ? "Copied" : "Copy"}
          </button>
          <p>
            <Code2 size={13} /> 6 permission-scoped tools connected
          </p>
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <header>
          <span className="eyebrow">Pricing that compounds with usage</span>
          <h2>Start with one team. Leave with everything.</h2>
        </header>
        <div className="pricing-grid">
          <article>
            <span className="eyebrow">Pilot</span>
            <h3>
              $0 <small>/ 14 days</small>
            </h3>
            <p>Prove the signal in one working team.</p>
            <ul>
              <li>
                <Check size={12} /> Up to 15 people
              </li>
              <li>
                <Check size={12} /> Slack + Google Drive
              </li>
              <li>
                <Check size={12} /> Cited Ask and Brief
              </li>
              <li>
                <Check size={12} /> 100k ingested items
              </li>
            </ul>
            <a href="#waitlist">
              Start a pilot <ChevronRight size={13} />
            </a>
          </article>
          <article className="pricing-featured">
            <span className="eyebrow">Company</span>
            <h3>
              $38 <small>/ seat / mo</small>
            </h3>
            <p>The governed brain for a growing company.</p>
            <ul>
              <li>
                <Check size={12} /> All standard connectors
              </li>
              <li>
                <Check size={12} /> Signals + governed skills
              </li>
              <li>
                <Check size={12} /> SSO, SCIM, and audit export
              </li>
              <li>
                <Check size={12} /> Metered model usage
              </li>
            </ul>
            <a href="#waitlist">
              Talk to us <ChevronRight size={13} />
            </a>
          </article>
          <article>
            <span className="eyebrow">Enterprise</span>
            <h3>Let’s talk</h3>
            <p>Control the keys, region, and model path.</p>
            <ul>
              <li>
                <Check size={12} /> Hold your own key
              </li>
              <li>
                <Check size={12} /> BYO model account
              </li>
              <li>
                <Check size={12} /> US / EU residency
              </li>
              <li>
                <Check size={12} /> Custom retention controls
              </li>
            </ul>
            <a href="#waitlist">
              Design your deployment <ChevronRight size={13} />
            </a>
          </article>
        </div>
      </section>

      <section className="waitlist-section" id="waitlist">
        <div>
          <span className="eyebrow">Build a brain that gets sharper overnight</span>
          <h2>What should your company remember tomorrow?</h2>
        </div>
        {submitted ? (
          <div className="waitlist-success">
            <CircleCheck size={22} />
            <span>
              <strong>You’re on the pilot list.</strong>
              <small>We’ll write with the next available onboarding window.</small>
            </span>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label>
              <span>Work email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
              />
            </label>
            <button type="submit">
              Request a pilot <ArrowRight size={14} />
            </button>
          </form>
        )}
      </section>

      <footer className="landing-footer">
        <Brand />
        <p>Institutional memory for people and the agents working beside them.</p>
        <div>
          <a href="#security">Security</a>
          <a href="#agents">MCP docs</a>
          <a href="mailto:hello@meminios.com">Contact</a>
        </div>
        <span>© 2026 MeminiOS</span>
      </footer>
    </main>
  );
}
