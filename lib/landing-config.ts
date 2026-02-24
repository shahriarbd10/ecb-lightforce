export type LandingConfig = {
  hero: {
    badge: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
  sections: {
    showPulse: boolean;
    showVideoZone: boolean;
    showSpotlight: boolean;
    showReels: boolean;
    showAds: boolean;
  };
  labels: {
    pulseEyebrow: string;
    pulseTitle: string;
    videoEyebrow: string;
    videoTitle: string;
    spotlightEyebrow: string;
    spotlightTitle: string;
    reelsEyebrow: string;
    reelsTitle: string;
    adsEyebrow: string;
    adsTitle: string;
  };
};

export const defaultLandingConfig: LandingConfig = {
  hero: {
    badge: "Football + Futsal Club Since 2025",
    titleLine1: "Build Your Player Identity.",
    titleLine2: "Get Seen Through ECB Lightforce.",
    description:
      "A modern talent ecosystem for local, school, college, university, and club players in Bangladesh. Create your profile, publish achievements, show match availability, and unlock exposure.",
    primaryCtaLabel: "Join As Player",
    primaryCtaHref: "/register",
    secondaryCtaLabel: "Browse ECB Hub",
    secondaryCtaHref: "/ecb-hub"
  },
  sections: {
    showPulse: true,
    showVideoZone: true,
    showSpotlight: true,
    showReels: true,
    showAds: true
  },
  labels: {
    pulseEyebrow: "Latest Football Pulse",
    pulseTitle: "Live Highlights, Fixtures, And Match Context",
    videoEyebrow: "Video Zone",
    videoTitle: "Match Highlights And Breakdown Clips",
    spotlightEyebrow: "Spotlight Section",
    spotlightTitle: "Admin Curated Campaign Media",
    reelsEyebrow: "Reels Wall",
    reelsTitle: "Short Clips Managed By Admin",
    adsEyebrow: "Club Ads & Media",
    adsTitle: "Admin Managed Promotions"
  }
};
