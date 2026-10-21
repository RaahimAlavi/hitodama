import React from 'react';
import { HeroStage } from './HeroStage';

interface HeroProps {
  onBuyClick?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onBuyClick }) => {
  return (
    <header className="Hero_hero__T3Fr4" id="top">
      <div className="Hero_intro__HVyOZ">
        <h1 aria-label="Give your computer a soul." data-hero-step="2">
          <span className="Hero_line__yemTU" aria-hidden="true">
            <span className="Hero_heroWord__8kpk3">Give</span>{' '}
            <span className="Hero_heroWord__8kpk3">your</span>{' '}
            <span className="Hero_heroWord__8kpk3">computer</span>
          </span>
          <span className="Hero_line__yemTU Hero_accentLine__SWWcu" aria-hidden="true">
            <span className="Hero_heroWord__8kpk3">a</span>{' '}
            <span className="Hero_heroWord__8kpk3">soul.</span>
          </span>
        </h1>

        <p className="Hero_subhead__OAvNr" data-hero-step="3">
          The voice AI that runs your computer for you.
        </p>

        <div className="Hero_actions__LI5fP" data-hero-step="4">
          <a
            className="button-primary button-hero"
            href="/buy/"
            onClick={(e) => {
              if (onBuyClick) {
                e.preventDefault();
                onBuyClick();
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M0 2.4 6.5 1.5v6H0Zm7.4-1L16 0v7.4H7.4ZM0 8.5h6.5v6L0 13.6Zm7.4 0H16V16l-8.6-1.2Z" />
            </svg>
            <span>Get Hito</span>
          </a>
        </div>
      </div>

      <HeroStage onBuyClick={onBuyClick} />
      <div className="StraySoul_host__fhYz_" aria-hidden="true" />
    </header>
  );
};
