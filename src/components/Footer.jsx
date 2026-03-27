import React, { useState } from "react";
import { Link } from "react-router-dom";

/* ══════════════════════════════════════════
   DISCLAIMERS (Tabbed Data)
══════════════════════════════════════════ */
const DISCLAIMER_TABS = [
  {
    id: "job-seekers",
    label: "Job Seekers",
    content: [
      "Vetted is an advertising platform, not a recruitment agency. We publish job opportunities on behalf of verified South African employers. We are not involved in any part of the hiring process — including shortlisting, interviewing, or making employment decisions. Any such decisions rest entirely with the employer who posted the listing.",
      "Vetted will never ask job seekers for any form of payment, fee, or deposit at any stage of the application process. Browsing jobs and applying is completely free. If any employer or individual using this platform requests payment from you — whether for training, uniforms, background checks, or any other reason — do not pay and report it to us immediately at support@vetted.co.za."
    ]
  },
  {
    id: "employers",
    label: "Employers",
    content: [
      "Vetted verifies employer registrations through CIPC documentation and supporting identity records before granting platform access. While we take reasonable steps to confirm that employers are legitimate registered entities, we cannot guarantee the accuracy of job descriptions, advertised salaries, or employment outcomes. We encourage all applicants to conduct their own due diligence."
    ]
  },
  {
    id: "platform-ai",
    label: "Platform & AI",
    content: [
      "All job applications submitted through this platform are sent directly to the relevant employer. Vetted does not receive, review, store, forward, or influence any application at any stage. Once you submit your application, your information is shared solely with the employer associated with that specific listing.",
      "Vetted does not use artificial intelligence, automated scoring systems, or algorithmic ranking to evaluate, filter, or prioritise any candidate's application at any point. Every application you submit reaches the employer exactly as you submitted it — no modifications, no scoring, no filtering by our platform."
    ]
  }
];

/* ══════════════════════════════════════════
   NAVIGATION DATA
══════════════════════════════════════════ */
const NAV_COLUMNS = [
  {
    heading: 'Job Seekers',
    links: [
      { label: 'Browse Jobs', href: '/jobs' },
      { label: 'Sign In',     href: '/jobseeker/login' },
      { label: 'Register',    href: '/jobseeker/register' },
      { label: 'Verify',      href: '/verification' },
    ]
  },
  {
    heading: 'Employers',
    links: [
      { label: 'Apply for Access', href: '/employer/join' },
      { label: 'Portal Login',     href: '/employer/login' },
    ]
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms of Service',             href: '/terms' },
      { label: 'Privacy Policy',               href: '/privacy' },
      { label: 'Technology Ethics Charter',    href: '#' },
      { label: 'Privacy Statement',            href: '#' },
      { label: 'Privacy Portal',               href: '#' },
      { label: 'Responsible Disclosure Policy',href: '#' },
      { label: 'Privacy Principles',           href: '#' },
    ]
  },
  {
    heading: 'Support & Resources',
    links: [
      { label: 'Developer Hub',             href: '/developer-hub' },
      { label: 'Contact Us',                href: '#' },
      { label: 'Glossary',                  href: '/glossary' },
      { label: 'Bot',                       href: '#' },
      { label: 'Learn',                     href: '/learn' },
      { label: 'Research',                  href: '/research' },
    ]
  },
  {
    heading: 'Updates',
    links: [
      { label: 'X',         href: '#' },
      { label: 'YouTube',   href: '#' },
      { label: 'Facebook',  href: '#' },
      { label: 'Instagram', href: '#' },
    ]
  },
  {
    heading: 'Job Candidates Privacy Statement',
    links: [] // no links — heading only (desktop) / static row (mobile)
  },
];

const BOTTOM_LINKS = [
  { label: 'Support',         href: '#' },
  { label: 'Contact Us',      href: '/contact-us' },
  { label: 'Legal',           href: '#' },
  { label: 'Certificates',    href: '#' },
  { label: 'Privacy Policy',  href: '/privacy' },
  { label: 'Terms of Service',href: '/terms' },
  { label: 'Press Enquiries', href: '#' },
];

/* ══════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════ */
export default function Footer() {
  const [openAcc, setOpenAcc] = useState(null);
  const [activeTab, setActiveTab] = useState(DISCLAIMER_TABS[0].id);

  const toggleAcc = (index) => {
    setOpenAcc(openAcc === index ? null : index);
  };

  return (
    <>
      <div className="cr-ftr-shell">
        
        {/* 1. Disclaimers (New Tabbed UI) */}
        <section className="cdm-disclaimer-wrapper">
          <div className="cdm-disclaimer-header">Important Notices</div>
          
          <ul className="cdm-country-nav">
            {DISCLAIMER_TABS.map((tab) => (
              <li 
                key={tab.id}
                className={`cdm-nav-item ${activeTab === tab.id ? 'cdm-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </li>
            ))}
          </ul>

          <div className="cdm-content-wrapper">
            {DISCLAIMER_TABS.map((tab) => (
              <div 
                key={tab.id}
                className={`cdm-content-panel ${activeTab === tab.id ? 'cdm-active' : ''}`}
              >
                {tab.content.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* 2. Desktop Nav */}
        <nav className="cr-ftr-nav-desktop" aria-label="Footer Navigation">
          {NAV_COLUMNS.map((col, idx) => (
            <div key={idx} className={`cr-ftr-col ${col.links.length === 0 ? 'cr-ftr-col-linkedin' : ''}`}>
              <span className="cr-ftr-col-heading">{col.heading}</span>
              {col.links.length > 0 && (
                <div className="cr-ftr-col-links">
                  {col.links.map((l, i) => (
                    <Link key={i} to={l.href}>{l.label}</Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* 3. Mobile Nav (Accordion) */}
        <nav className="cr-ftr-nav-mobile" aria-label="Footer Navigation Mobile">
          {NAV_COLUMNS.map((col, idx) => {
            if (col.links.length === 0) {
              return (
                <div key={idx} className="cr-ftr-acc-linkedin-row">
                  <span className="cr-ftr-acc-linkedin-label">{col.heading}</span>
                </div>
              );
            }

            const isOpen = openAcc === idx;
            return (
              <div key={idx} className={`cr-ftr-acc-item ${isOpen ? 'cr-ftr-acc-open' : ''}`}>
                <button
                  className="cr-ftr-acc-trigger"
                  aria-expanded={isOpen}
                  onClick={() => toggleAcc(idx)}
                >
                  <span className="cr-ftr-acc-trigger-label">{col.heading}</span>
                  <span className="cr-ftr-acc-icon" aria-hidden="true">+</span>
                </button>
                <div className="cr-ftr-acc-panel" role="region">
                  <div className="cr-ftr-acc-panel-inner">
                    {col.links.map((l, i) => (
                      <Link key={i} to={l.href}>{l.label}</Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* 4. Wave Wrap */}
        <div className="cr-ftr-wave-wrap" aria-hidden="true">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 C360,90 1080,0 1440,50 L1440,80 L0,80 Z" fill="#061a35"/>
          </svg>
        </div>

        {/* 5. Bottom Bar */}
        <section className="cr-ftr-bottom-bar">
          <div className="cr-ftr-brand-block">
            <div className="cr-ftr-logo-placeholder">
              <img src="Public/logo.png" alt="Company Logo"/>
            </div>
            <p className="cr-ftr-brand-tagline">
              Operating across 30+ countries, Cronos IT is a leader in enterprise technology solutions and digital transformation.
            </p>
          </div>
          <div className="cr-ftr-bottom-nav">
            <nav className="cr-ftr-bottom-links" aria-label="Footer Quick Links">
              {BOTTOM_LINKS.map((l, i) => (
                <Link key={i} to={l.href}>{l.label}</Link>
              ))}
            </nav>
            <p className="cr-ftr-copyright">&copy; Copyright {new Date().getFullYear()}, Cronos IT. All rights are reserved</p>
          </div>
        </section>

      </div>

      <style>{`
        @import url('https://fonts.cdnfonts.com/css/circular-std');

        .cr-ftr-shell {
          display: flex;
          flex-direction: column;
          font-family: 'Circular Std', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: #080d1b;
          color: #ffffff;
          line-height: 1;
        }
        
        .cr-ftr-shell *, .cr-ftr-shell *::before, .cr-ftr-shell *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .cr-ftr-shell a {
          text-decoration: none;
          color: inherit;
        }

        /* ── New Disclaimers Tab UI ── */
        .cdm-disclaimer-wrapper {
            background-color: #080d1b; /* Slightly different tone as per original injected code */
            padding: 48px 60px;
            box-sizing: border-box;
            line-height: 1.5;
            order: 0;
        }

        .cdm-disclaimer-header {
            color: #ffffff;
            font-weight: 500;
            font-size: 16px;
            margin: 0 0 24px 0;
            letter-spacing: -0.02em;
        }

        .cdm-country-nav {
            list-style-type: none;
            margin: 0 0 24px 0;
            padding: 0;
            display: flex;
            gap: 24px;
            flex-wrap: wrap; /* Helps gracefully fall back on smaller screens */
        }

        .cdm-nav-item {
            color: #7b8595;
            font-weight: 500;
            font-size: 16px;
            cursor: pointer;
            text-transform: capitalize;
            transition: color 0.2s ease;
            user-select: none;
        }

        .cdm-nav-item:hover {
            color: #ffffff;
        }

        .cdm-nav-item.cdm-active {
            color: #f0f0f0;
            font-weight: 500;
        }

        .cdm-content-panel {
            color: #7b849b;
            font-weight: 400;
            font-size: 14px;
            display: none;
        }

        .cdm-content-panel.cdm-active {
            display: block;
        }

        .cdm-content-panel p {
            margin: 0 0 16px 0; font-size: 15px;
            line-height: 1.7; color: #7b849b;
        }

        /* ── Ordering ── */
        .cr-ftr-nav-desktop { order: 1; }
        .cr-ftr-nav-mobile  { order: 2; }
        .cr-ftr-wave-wrap   { order: 3; }
        .cr-ftr-bottom-bar  { order: 4; }

        /* ── Desktop Grid ── */
        .cr-ftr-nav-desktop {
          padding: 64px 60px 56px;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 32px;
        }
        .cr-ftr-col-heading {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          line-height: 1.35;
          letter-spacing: 0.01em;
          margin-bottom: 26px;  
          padding-top: 1rem;
        }
        .cr-ftr-col-links {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .cr-ftr-col-links a {
          font-size: 17px;
          font-weight: 400;
          color: #c2c3c4;
          line-height: 1.45;
          display: block;
          transition: color 0.18s ease;
        }
        .cr-ftr-col-links a:hover {
          color: #ffffff;
        }
        .cr-ftr-col-linkedin {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        /* ── Wave ── */
        .cr-ftr-wave-wrap {
          display: block;
          width: 100%;
          overflow: hidden;
          line-height: 0;
          background: #080d1b;
        }
        .cr-ftr-wave-wrap svg {
          display: block;
          width: 100%;
          height: 80px;
        }

        /* ── Bottom Bar ── */
        .cr-ftr-bottom-bar {
          background: #061a35;
          padding: 40px 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 32px;
        }
        .cr-ftr-brand-block {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          max-width: 420px;
        }
        .cr-ftr-logo-placeholder {
          width: 110px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cr-ftr-logo-placeholder img {
          width: 110px;
          height: 44px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .cr-ftr-brand-tagline {
          font-size: 13px;
          font-weight: 400;
          color: #8da0bd;
          line-height: 1.65;
          padding-top: 3px;
        }
        .cr-ftr-bottom-nav {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 14px;
        }
        .cr-ftr-bottom-links {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px 22px;
          justify-content: flex-end;
        }
        .cr-ftr-bottom-links a {
          font-size: 13px;
          font-weight: 400;
          color: #8da7bd;
          white-space: nowrap;
          transition: color 0.18s ease;
        }
        .cr-ftr-bottom-links a:hover {
          color: #ffffff;
        }
        .cr-ftr-copyright {
          font-size: 12px;
          color: #55697a;
          text-align: right;
        }

        /* ── Mobile Accordion ── */
        .cr-ftr-nav-mobile {
          display: none;
        }
        .cr-ftr-acc-item {
          border-bottom: 1px solid rgba(255,255,255,0.09);
        }
        .cr-ftr-acc-item:first-child {
          border-top: 1px solid rgba(255,255,255,0.09);
        }
        .cr-ftr-acc-trigger {
          appearance: none;
          -webkit-appearance: none;
          background: none;
          border: none;
          outline: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          min-height: 56px;
          padding: 0 22px;
          gap: 16px;
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.01em;
          text-align: left;
          line-height: 1.3;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          transition: background 0.15s ease;
        }
        .cr-ftr-acc-trigger:active {
          background: rgba(255,255,255,0.05);
        }
        .cr-ftr-acc-trigger-label {
          flex: 1 1 0;
          min-width: 0;
        }
        .cr-ftr-acc-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          flex-grow: 0;
          font-size: 18px;
          font-weight: 300;
          line-height: 1;
          color: #ffffff;
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), color 0.2s ease;
        }
        .cr-ftr-acc-open .cr-ftr-acc-icon {
          transform: rotate(45deg);
        }
        .cr-ftr-acc-panel {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-height 0.36s cubic-bezier(0.4,0,0.2,1), opacity 0.24s ease;
        }
        .cr-ftr-acc-open .cr-ftr-acc-panel {
          max-height: 500px;
          opacity: 1;
        }
        .cr-ftr-acc-panel-inner {
          padding: 6px 22px 24px 22px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .cr-ftr-acc-panel-inner a {
          font-size: 13.5px;
          font-weight: 400;
          color: #92a8bf;
          line-height: 1.45;
          min-height: 28px;
          display: flex;
          align-items: center;
          transition: color 0.18s ease;
        }
        .cr-ftr-acc-panel-inner a:hover {
          color: #ffffff;
        }
        .cr-ftr-acc-linkedin-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          min-height: 56px;
          padding: 0 22px;
          border-bottom: 1px solid rgba(255,255,255,0.09);
        }
        .cr-ftr-acc-linkedin-label {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.01em;
          line-height: 1.35;
          flex: 1 1 0;
          min-width: 0;
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .cdm-disclaimer-wrapper {
            padding: 48px 40px;
          }
          .cr-ftr-nav-desktop {
            grid-template-columns: repeat(3, 1fr);
            padding: 48px 40px 40px;
          }
        }

        @media (max-width: 720px) {
          .cdm-disclaimer-wrapper { padding: 40px 22px; }
          .cr-ftr-nav-desktop { display: none; }
          
          .cr-ftr-nav-mobile  { display: block; order: 1; padding-top: 52px; }
          .cr-ftr-wave-wrap   { order: 2; }
          .cr-ftr-bottom-bar  { order: 3; }

          .cr-ftr-wave-wrap svg { height: 50px; }

          .cr-ftr-bottom-bar {
            padding: 32px 22px 28px;
            flex-direction: column;
            align-items: flex-start;
            gap: 24px;
          }
          .cr-ftr-brand-block {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
            max-width: 100%;
            width: 100%;
          }
          .cr-ftr-bottom-nav { align-items: flex-start; width: 100%; }
          .cr-ftr-bottom-links { justify-content: flex-start; gap: 10px 16px; }
          .cr-ftr-copyright { text-align: left; }
        }

        @media (max-width: 380px) {
          .cdm-disclaimer-wrapper { padding: 32px 16px; }
          .cr-ftr-acc-trigger { font-size: 13px; padding: 0 16px; }
          .cr-ftr-acc-panel-inner { padding: 6px 16px 20px 16px; }
          .cr-ftr-acc-linkedin-row { padding: 0 16px; }
          .cr-ftr-bottom-bar { padding: 28px 16px 24px; }
        }
      `}</style>
    </>
  );
}