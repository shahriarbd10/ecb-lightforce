import mongoose, { InferSchemaType, Model, Schema } from "mongoose";
import { defaultLandingConfig } from "@/lib/landing-config";

const LandingConfigSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "main" },
    hero: {
      badge: { type: String, default: defaultLandingConfig.hero.badge, trim: true },
      titleLine1: { type: String, default: defaultLandingConfig.hero.titleLine1, trim: true },
      titleLine2: { type: String, default: defaultLandingConfig.hero.titleLine2, trim: true },
      description: { type: String, default: defaultLandingConfig.hero.description, trim: true },
      primaryCtaLabel: { type: String, default: defaultLandingConfig.hero.primaryCtaLabel, trim: true },
      primaryCtaHref: { type: String, default: defaultLandingConfig.hero.primaryCtaHref, trim: true },
      secondaryCtaLabel: { type: String, default: defaultLandingConfig.hero.secondaryCtaLabel, trim: true },
      secondaryCtaHref: { type: String, default: defaultLandingConfig.hero.secondaryCtaHref, trim: true }
    },
    sections: {
      showPulse: { type: Boolean, default: defaultLandingConfig.sections.showPulse },
      showVideoZone: { type: Boolean, default: defaultLandingConfig.sections.showVideoZone },
      showSpotlight: { type: Boolean, default: defaultLandingConfig.sections.showSpotlight },
      showReels: { type: Boolean, default: defaultLandingConfig.sections.showReels },
      showAds: { type: Boolean, default: defaultLandingConfig.sections.showAds }
    },
    labels: {
      pulseEyebrow: { type: String, default: defaultLandingConfig.labels.pulseEyebrow, trim: true },
      pulseTitle: { type: String, default: defaultLandingConfig.labels.pulseTitle, trim: true },
      videoEyebrow: { type: String, default: defaultLandingConfig.labels.videoEyebrow, trim: true },
      videoTitle: { type: String, default: defaultLandingConfig.labels.videoTitle, trim: true },
      spotlightEyebrow: { type: String, default: defaultLandingConfig.labels.spotlightEyebrow, trim: true },
      spotlightTitle: { type: String, default: defaultLandingConfig.labels.spotlightTitle, trim: true },
      reelsEyebrow: { type: String, default: defaultLandingConfig.labels.reelsEyebrow, trim: true },
      reelsTitle: { type: String, default: defaultLandingConfig.labels.reelsTitle, trim: true },
      adsEyebrow: { type: String, default: defaultLandingConfig.labels.adsEyebrow, trim: true },
      adsTitle: { type: String, default: defaultLandingConfig.labels.adsTitle, trim: true }
    },
    feed: {
      useManualFeed: { type: Boolean, default: defaultLandingConfig.feed.useManualFeed },
      highlights: [
        {
          id: { type: String, default: "" },
          title: { type: String, default: "", trim: true },
          league: { type: String, default: "", trim: true },
          date: { type: String, default: "", trim: true },
          time: { type: String, default: "", trim: true },
          thumb: { type: String, default: "", trim: true },
          video: { type: String, default: "", trim: true },
          isActive: { type: Boolean, default: true },
          publishAt: { type: String, default: "", trim: true }
        }
      ],
      fixtures: [
        {
          id: { type: String, default: "" },
          event: { type: String, default: "", trim: true },
          league: { type: String, default: "", trim: true },
          date: { type: String, default: "", trim: true },
          time: { type: String, default: "", trim: true },
          isActive: { type: Boolean, default: true },
          publishAt: { type: String, default: "", trim: true }
        }
      ],
      videoZone: [
        {
          id: { type: String, default: "" },
          title: { type: String, default: "", trim: true },
          league: { type: String, default: "", trim: true },
          video: { type: String, default: "", trim: true },
          thumb: { type: String, default: "", trim: true },
          isActive: { type: Boolean, default: true },
          publishAt: { type: String, default: "", trim: true }
        }
      ]
    }
  },
  { timestamps: true }
);

export type LandingConfigDocument = InferSchemaType<typeof LandingConfigSchema>;

const LandingConfig: Model<LandingConfigDocument> =
  mongoose.models.LandingConfig || mongoose.model("LandingConfig", LandingConfigSchema);

export default LandingConfig;
