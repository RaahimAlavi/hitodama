import React, { useState } from 'react';

interface LandingHeaderProps {
  currentRoute?: string;
  onNavigate?: (route: string) => void;
  currency?: 'IN' | 'INTL';
  onToggleCurrency?: () => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  currentRoute = '/',
  onNavigate,
  currency = 'INTL',
  onToggleCurrency,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (href: string, e: React.MouseEvent) => {
    if (onNavigate && (href === '/' || href.startsWith('/buy') || href.startsWith('/account'))) {
      e.preventDefault();
      onNavigate(href);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="LandingHeader_header__a69_s">
      <nav className="LandingHeader_nav__Tl9G0" aria-label="Main navigation">
        <a
          className="LandingHeader_brand__ioVxh"
          href="/"
          onClick={(e) => handleNav('/', e)}
          aria-label="Hitodama home"
        >
          <img src="/hitodama-logo.png" alt="Hitodama" width="32" height="32" />
          <span>
            <b>HITODAMA</b>
            <small>人魂</small>
          </span>
        </a>

        <div className="LandingHeader_links___BLCL">
          <a href="#demo">How it works</a>
          <a href="#faq">FAQ</a>
          <button
            type="button"
            onClick={onToggleCurrency}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              opacity: 0.6,
              padding: '0 4px',
            }}
            title="Toggle Currency (₹ / $)"
          >
            {currency === 'IN' ? '₹ INR' : '$ USD'}
          </button>
        </div>

        <a
          className="LandingHeader_account__7r7Ty"
          href="/account/"
          onClick={(e) => handleNav('/account/', e)}
          aria-label="Account"
          title="Account"
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true" focusable="false">
            <circle cx="12" cy="8.2" r="3.6" stroke="currentColor" strokeWidth="1.7" />
            <path d="M4.8 19.6a7.2 7.2 0 0 1 14.4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </a>

        <a
          className="LandingHeader_buy__w0ASK"
          href="/buy/"
          onClick={(e) => handleNav('/buy/', e)}
        >
          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M0 2.4 6.5 1.5v6H0Zm7.4-1L16 0v7.4H7.4ZM0 8.5h6.5v6L0 13.6Zm7.4 0H16V16l-8.6-1.2Z" />
          </svg>
          Buy {currency === 'IN' ? '₹499' : '$14'}
        </a>

        <button
          className="LandingHeader_menuButton__FgYld"
          type="button"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <i />
          <i />
        </button>
      </nav>

      <div
        id="mobile-menu"
        className={`LandingHeader_mobileMenu__aUj28 ${mobileMenuOpen ? 'open' : ''}`}
        aria-hidden={!mobileMenuOpen}
        style={{ display: mobileMenuOpen ? 'flex' : 'none' }}
      >
        <a href="#demo" onClick={() => setMobileMenuOpen(false)}>How it works<span>↗</span></a>
        <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ<span>↗</span></a>
        <a href="/account/" onClick={(e) => handleNav('/account/', e)}>Account<span>↗</span></a>
        <a href="/buy/" onClick={(e) => handleNav('/buy/', e)}>Buy Hitodama ({currency === 'IN' ? '₹499' : '$14'})<span>↗</span></a>
      </div>
    </header>
  );
};
