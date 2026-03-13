import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import './LandingPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'About', href: '#about' },
];

const FEATURES = [
  {
    title: 'Inventory Management',
    desc: 'Add, edit, delete, and search medications. Receive batch shipments to restock in bulk.',
  },
  {
    title: 'Stockout Prediction',
    desc: 'Predicts which medications will run out and when, ranked by risk level so you know what to reorder first.',
  },
  {
    title: 'Order Workflow',
    desc: 'Suggests what to reorder based on current stock, with built-in order tracking and supplier details.',
  },
  {
    title: 'Reporting & Analytics',
    desc: 'Charts for inventory trends and one-click PDF export for documentation.',
  },
];

const TECH_STACK = [
  { layer: 'Frontend', items: ['React 19', 'Recharts', 'Axios', 'jsPDF'] },
  { layer: 'API Layer', items: ['Python', 'Flask', 'REST', 'CORS'] },
  { layer: 'Core Engine', items: ['C++', 'SQLite', 'CMake'] },
  { layer: 'Intelligence', items: ['scikit-learn', 'Pandas', 'NumPy'] },
];

const USE_CASES = [
  {
    scenario: 'End-of-day inventory count',
    problem: 'Manually counting stock and cross-referencing paper logs takes 30+ minutes and is error-prone.',
    solution: 'PharmTrack shows real-time quantities with search and filtering. Discrepancies are visible instantly.',
  },
  {
    scenario: 'Catching expired medications',
    problem: 'Expired stock sitting on shelves is a compliance risk. Checking dates by hand is easy to miss.',
    solution: 'The expired medications view flags everything past its date automatically, so nothing slips through.',
  },
  {
    scenario: 'Restocking before you run out',
    problem: 'You only realize a medication is out of stock when a patient needs it.',
    solution: 'ML predictions flag at-risk medications days in advance, ranked by urgency so you reorder in time.',
  },
  {
    scenario: 'Receiving a shipment',
    problem: 'Updating inventory item by item after a delivery is slow and interrupts the workflow.',
    solution: 'Batch receiving lets you log an entire shipment at once with supplier tracking built in.',
  },
];

const HIGHLIGHTS = [
  'Three-layer architecture with C++, Python, and React all sharing one SQLite database',
  'Stockout predictions using machine learning, with risk level alerts',
  'Batch shipment receiving to restock multiple items at once',
  'PDF report generation for inventory documentation',
];

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const counted = useRef(false);

  const startCount = useCallback(() => {
    if (counted.current || target === 0) return;
    counted.current = true;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) startCount(); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [startCount]);

  return { value, ref };
}

export default function LandingPage({ onEnterApp }) {
  const [navScrolled, setNavScrolled] = useState(false);
  const [stats, setStats] = useState({ medications: 0, predictions: 0, lowStock: 0, expired: 0 });

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/medications`).catch(() => ({ data: [] })),
      axios.get(`${API_URL}/predictions`).catch(() => ({ data: { predictions: [] } })),
      axios.get(`${API_URL}/medications/low-stock`).catch(() => ({ data: [] })),
      axios.get(`${API_URL}/medications/expired`).catch(() => ({ data: [] })),
    ]).then(([meds, preds, low, exp]) => {
      setStats({
        medications: Array.isArray(meds.data) ? meds.data.length : 0,
        predictions: Array.isArray(preds.data?.predictions) ? preds.data.predictions.length
          : Array.isArray(preds.data) ? preds.data.length : 0,
        lowStock: Array.isArray(low.data) ? low.data.length : 0,
        expired: Array.isArray(exp.data) ? exp.data.length : 0,
      });
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('lp-visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    const els = document.querySelectorAll('.lp-reveal');
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="lp-page">
      <a className="lp-skip-link" href="#features">Skip to content</a>

      {/* Nav */}
      <nav className={`lp-nav${navScrolled ? ' lp-nav-scrolled' : ''}`} aria-label="Main navigation">
        <div className="lp-nav-inner">
          <a className="lp-nav-brand" href="#hero" aria-label="Back to top">PharmTrack</a>
          <div className="lp-nav-links" role="list">
            {NAV_LINKS.map((link) => (
              <a key={link.href} className="lp-nav-link" href={link.href}>
                {link.label}
              </a>
            ))}
            <button className="lp-nav-cta" onClick={onEnterApp}>
              Enter Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="lp-hero" id="hero" aria-label="Introduction">
        <div className="lp-hero-inner">
          <span className="lp-accent-bar lp-reveal lp-stagger-1 lp-visible" aria-hidden="true" />
          <h1 className="lp-hero-headline lp-reveal lp-stagger-2 lp-visible">
            Pharmacy inventory,{' '}
            <span style={{ color: 'var(--lp-accent)' }}>built by a pharmacy tech</span>
          </h1>
          <p className="lp-hero-subtitle lp-reveal lp-stagger-3 lp-visible">
            I built PharmTrack while working as a pharmacy technician at Safeway, where I saw
            firsthand how much time gets lost to manual inventory tracking. It uses machine
            learning to predict stockouts before they happen and automates the reorder process.
          </p>
          <button className="lp-cta lp-reveal lp-stagger-4 lp-visible" onClick={onEnterApp}>
            Enter Dashboard <span className="lp-cta-arrow">&rarr;</span>
          </button>
        </div>
      </section>

      {/* Live Stats */}
      <StatsBar stats={stats} />

      {/* Features */}
      <section className="lp-features" id="features" aria-label="Features">
        <p className="lp-section-label lp-reveal">Features</p>
        <h2 className="lp-section-title lp-reveal">What it does</h2>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div className="lp-feature-card lp-reveal" key={f.title} style={{ transitionDelay: `${i * 0.1}s` }}>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="lp-preview" id="preview" aria-label="Dashboard preview">
        <p className="lp-section-label lp-reveal">Preview</p>
        <h2 className="lp-section-title lp-reveal">See it in action</h2>
        <div className="lp-browser-frame lp-reveal">
          <div className="lp-browser-bar" aria-hidden="true">
            <span className="lp-browser-dot" />
            <span className="lp-browser-dot" />
            <span className="lp-browser-dot" />
            <span className="lp-browser-url">pharmacy-inventory-system-three.vercel.app</span>
          </div>
          <div className="lp-browser-content">
            <img
              src="/dashboard-preview.png"
              alt="PharmTrack dashboard showing medication inventory table, stock alerts, and prediction charts"
              className="lp-preview-img"
              loading="lazy"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
            <div className="lp-preview-placeholder" style={{ display: 'none' }}>
              <p>Dashboard preview</p>
              <button className="lp-cta" onClick={onEnterApp}>
                View live instead <span className="lp-cta-arrow">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
        <p className="lp-preview-caption lp-reveal">
          The dashboard with inventory table, stock level alerts, and prediction charts.
        </p>
      </section>

      {/* Tech Stack */}
      <section className="lp-tech" id="architecture" aria-label="Architecture">
        <p className="lp-section-label lp-reveal">Architecture</p>
        <h2 className="lp-section-title lp-reveal">How it's built</h2>
        <div className="lp-tech-grid">
          {TECH_STACK.map((col, i) => (
            <div className="lp-tech-col lp-reveal" key={col.layer} style={{ transitionDelay: `${i * 0.1}s` }}>
              <h3>{col.layer}</h3>
              <ul className="lp-tech-list">
                {col.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="lp-usecases" id="usecases" aria-label="Use cases">
        <p className="lp-section-label lp-reveal">Real-world scenarios</p>
        <h2 className="lp-section-title lp-reveal">Problems it solves</h2>
        <div className="lp-usecases-list">
          {USE_CASES.map((uc, i) => (
            <div className="lp-usecase lp-reveal" key={uc.scenario} style={{ transitionDelay: `${i * 0.08}s` }}>
              <h3 className="lp-usecase-scenario">{uc.scenario}</h3>
              <div className="lp-usecase-body">
                <div className="lp-usecase-problem">
                  <span className="lp-usecase-tag">Problem</span>
                  <p>{uc.problem}</p>
                </div>
                <div className="lp-usecase-solution">
                  <span className="lp-usecase-tag lp-usecase-tag-solution">Solution</span>
                  <p>{uc.solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="lp-about" id="about" aria-label="About the project">
        <p className="lp-section-label lp-reveal">About</p>
        <h2 className="lp-section-title lp-reveal">Project context</h2>
        <p className="lp-about-text lp-reveal">
          PharmTrack started from a real problem I noticed while working as a pharmacy technician.
          I wanted to apply what I'm learning as a Computer Science student at UW Bothell to build
          something useful. The result is a full-stack app spanning C++, Python, and React, all
          connected to a single SQLite database.
        </p>
        <p className="lp-highlights-label lp-reveal">Project Highlights</p>
        <ul className="lp-highlights lp-reveal">
          {HIGHLIGHTS.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        <div className="lp-about-actions lp-reveal">
          <button className="lp-cta" onClick={onEnterApp}>
            Enter Dashboard <span className="lp-cta-arrow">&rarr;</span>
          </button>
          <a
            className="lp-link"
            href="https://github.com/tranmin001/pharmacy-inventory-system"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer" aria-label="Site footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-footer-logo">PharmTrack</span>
            <p className="lp-footer-tagline">
              Built by a software engineering student with pharmacy experience.
            </p>
          </div>
          <div className="lp-footer-links">
            <div className="lp-footer-col">
              <h4>Navigation</h4>
              <a href="#features">Features</a>
              <a href="#architecture">Architecture</a>
              <a href="#about">About</a>
            </div>
            <div className="lp-footer-col">
              <h4>Project</h4>
              <a
                href="https://github.com/tranmin001/pharmacy-inventory-system"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <button className="lp-footer-dashboard-link" onClick={onEnterApp}>
                Live Dashboard
              </button>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p>&copy; {new Date().getFullYear()} Minh Tran, PharmTrack</p>
        </div>
      </footer>
    </div>
  );
}

function StatItem({ label, value }) {
  const counter = useCountUp(value);
  return (
    <div className="lp-stat" ref={counter.ref}>
      <span className="lp-stat-number">{counter.value}</span>
      <span className="lp-stat-label">{label}</span>
    </div>
  );
}

function StatsBar({ stats }) {
  return (
    <section className="lp-stats" aria-label="Live inventory statistics">
      <StatItem label="Medications tracked" value={stats.medications} />
      <StatItem label="Stockout predictions" value={stats.predictions} />
      <StatItem label="Low stock alerts" value={stats.lowStock} />
      <StatItem label="Expired flagged" value={stats.expired} />
    </section>
  );
}
