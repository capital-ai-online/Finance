import React from 'react';
import { LandingPage as AuthenticationLandingPage } from './LandingPageBase';
import { VerifiedNewsFeed } from './VerifiedNewsFeed';

interface LandingPageProps {
  onLoginEmail: (email: string, password: string) => Promise<void>;
  onGuestLogin: () => void;
  onRegisterEmail: (name: string, email: string, password: string) => Promise<void>;
  justLoggedOut?: boolean;
}

/**
 * Public landing projection.
 * Authentication UI remains byte-identical in LandingPageBase while the public page now carries
 * the same verified NewsAPI evidence used by the in-app AI Newsfeed Viewer. This wrapper does not
 * create a second news data path and does not synthesize replacement headlines.
 */
export function LandingPage(props: LandingPageProps) {
  return (
    <div className="min-h-screen bg-neutral-950">
      <AuthenticationLandingPage {...props} />
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <VerifiedNewsFeed
          limit={4}
          title="CAPITAL-AI · Live Market & AI News"
          className="shadow-2xl shadow-black/30"
        />
      </div>
    </div>
  );
}
