import React, { useEffect } from 'react';
import './LandingPage.css';

const FEATURES = [
  {
    title: 'Inventory Management',
    desc: 'Add, edit, delete, and search medications. Receive batch shipments to restock efficiently.',
  },
  {
    title: 'Stockout Prediction',
    desc: 'ML model analyzes usage patterns and flags medications at critical, high, or medium risk of running out.',
  },
  {
    title: 'Order Workflow',
    desc: 'Auto-generated reorder suggestions based on stock levels, with order tracking and supplier info.',
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

const HIGHLIGHTS = [
  'Multi-tier architecture: C++ core, Python API, React frontend sharing a single database',
  'ML-powered stockout predictions with risk level alerts',
  'Batch shipment receiving for efficient restocking',
  'PDF report generation for inventory documentation',
];

export default function LandingPage({ onEnterApp }) {
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
      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <span className="lp-accent-bar lp-reveal lp-stagger-1 lp-visible" />
          <h1 className="lp-hero-headline lp-reveal lp-stagger-2 lp-visible">
            Pharmacy inventory,{' '}
            <span style={{ color: 'var(--lp-accent)' }}>built by a pharmacy tech</span>
          </h1>
          <p className="lp-hero-subtitle lp-reveal lp-stagger-3 lp-visible">
            I built PharmTrack after experiencing inventory challenges firsthand as a pharmacy
            technician at Safeway. It combines real-world pharmacy workflow knowledge with modern
            software engineering — featuring ML-powered stockout predictions and automated reorder
            workflows.
          </p>
          <button className="lp-cta lp-reveal lp-stagger-4 lp-visible" onClick={onEnterApp}>
            Enter Dashboard <span className="lp-cta-arrow">&rarr;</span>
          </button>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-features">
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

      {/* ── Tech Stack ── */}
      <section className="lp-tech">
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

      {/* ── About ── */}
      <section className="lp-about">
        <p className="lp-section-label lp-reveal">About</p>
        <h2 className="lp-section-title lp-reveal">Project context</h2>
        <p className="lp-about-text lp-reveal">
          PharmTrack started from a real problem I observed while working as a pharmacy technician.
          I wanted to apply what I'm learning as a Computer Science student at UW Bothell to solve it.
          This project demonstrates full-stack development across C++, Python, and React — all sharing
          a single SQLite database.
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
    </div>
  );
}
