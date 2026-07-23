import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TenantDocument = HydratedDocument<Tenant>;

@Schema({ _id: false })
export class HeroContent {
  @Prop({ default: 'Handcrafted Bamboo Furniture for Modern Indian Homes' })
  headline: string;

  @Prop({
    default:
      'Shop sustainable bamboo home decor, space-saving furniture, and natural living accents — delivered across India.',
  })
  subheading: string;

  /** Legacy single desktop image (kept in sync with imageUrls[0]). */
  @Prop()
  imageUrl?: string;

  /** Desktop / laptop hero images (carousel). */
  @Prop({ type: [String], default: [] })
  imageUrls?: string[];

  /** Legacy single mobile image (kept in sync with mobileImageUrls[0]). */
  @Prop()
  mobileImageUrl?: string;

  /** Mobile hero images (carousel). Falls back to imageUrls when empty. */
  @Prop({ type: [String], default: [] })
  mobileImageUrls?: string[];

  @Prop()
  videoUrl?: string;

  @Prop({ default: 'Shop Bamboo Decor' })
  primaryCta: string;

  @Prop({ default: 'Explore Collections' })
  secondaryCta: string;
}

@Schema({ _id: false })
export class BrandPillar {
  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;
}

@Schema({ _id: false })
export class WhyChooseItem {
  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;
}

@Schema({ _id: false })
export class TenantTheme {
  @Prop({ default: '#FAF8F3' })
  background: string;

  @Prop({ default: '#4B3621' })
  primary: string;

  @Prop({ default: '#7A8F6B' })
  secondary: string;

  @Prop({ default: '#2E2E2E' })
  text: string;

  @Prop({ default: '#C4A962' })
  gold: string;

  @Prop({ default: 'light' })
  mode: string;
}

@Schema({ _id: false })
export class HomepageSectionConfig {
  @Prop({ default: true })
  enabled: boolean;

  @Prop({ default: '' })
  label: string;

  @Prop({ default: '' })
  title: string;

  @Prop({ default: '' })
  description?: string;

  @Prop({ default: '' })
  href?: string;

  @Prop({ default: '' })
  linkText?: string;

  @Prop({ default: 4 })
  limit?: number;
}

@Schema({ _id: false })
export class HomepageSections {
  @Prop({ type: HomepageSectionConfig, default: () => ({}) })
  collections: HomepageSectionConfig;

  @Prop({ type: HomepageSectionConfig, default: () => ({}) })
  lifestyle: HomepageSectionConfig;

  @Prop({ type: HomepageSectionConfig, default: () => ({}) })
  newArrivals: HomepageSectionConfig;

  @Prop({ type: HomepageSectionConfig, default: () => ({}) })
  bestSellers: HomepageSectionConfig;

  @Prop({ type: HomepageSectionConfig, default: () => ({}) })
  whyChooseUs: HomepageSectionConfig;

  @Prop({ type: HomepageSectionConfig, default: () => ({}) })
  customerHomes: HomepageSectionConfig;

  @Prop({ type: HomepageSectionConfig, default: () => ({}) })
  reviews: HomepageSectionConfig;

  @Prop({ type: HomepageSectionConfig, default: () => ({}) })
  journal: HomepageSectionConfig;

  @Prop({ type: HomepageSectionConfig, default: () => ({}) })
  gallery: HomepageSectionConfig;
}

@Schema({ _id: false })
export class TenantSeo {
  /** Site-wide meta description (search engines & social). */
  @Prop({ default: '' })
  description: string;

  /** Used in default title: `{storeName} | {defaultTitle}` */
  @Prop({ default: '' })
  defaultTitle: string;

  /** Site-wide meta keywords */
  @Prop({ default: '' })
  keywords: string;

  /** Open Graph / HTML locale, e.g. en_IN */
  @Prop({ default: 'en_IN' })
  locale: string;

  /** Browser / PWA theme color */
  @Prop({ default: '' })
  themeColor: string;

  /** Browser / PWA background color */
  @Prop({ default: '' })
  backgroundColor: string;

  /** Google Search Console HTML-tag verification content */
  @Prop({ default: '' })
  gscVerification: string;

  /** Default Open Graph / social share image URL */
  @Prop({ default: '' })
  ogImage: string;

  /** Twitter/X site handle */
  @Prop({ default: '' })
  twitterHandle: string;

  /** Bing Webmaster Tools verification meta token */
  @Prop({ default: '' })
  bingVerification: string;

  /** Pinterest verification token */
  @Prop({ default: '' })
  pinterestVerification: string;

  /** Social profile URLs */
  @Prop({ type: Object, default: () => ({}) })
  socialLinks: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    pinterest?: string;
    twitter?: string;
  };
}

@Schema({ timestamps: true })
export class Tenant {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  domain: string;

  /** Extra hostnames that resolve to this tenant (e.g. Vercel preview, custom domain). */
  @Prop({ type: [String], default: [] })
  domains: string[];

  @Prop({ default: 'starter', enum: ['starter', 'growth', 'enterprise'] })
  plan: string;

  @Prop({ type: TenantTheme, default: () => ({}) })
  theme: TenantTheme;

  @Prop({ type: TenantSeo, default: () => ({}) })
  seo: TenantSeo;

  @Prop({ default: 'Handcrafted Bamboo Home Decor & Eco-Friendly Furniture Online in India' })
  tagline: string;

  @Prop({ type: HeroContent, default: () => ({}) })
  hero: HeroContent;

  @Prop({ type: [BrandPillar], default: [] })
  brandPillars: BrandPillar[];

  @Prop({ type: [WhyChooseItem], default: [] })
  whyChooseUs: WhyChooseItem[];

  @Prop({ type: HomepageSections, default: () => ({}) })
  homepageSections: HomepageSections;

  @Prop({
    type: {
      enabled: { type: Boolean, default: false },
      mode: { type: String, enum: ['html', 'image'], default: 'html' },
      html: { type: String, default: '' },
      imageUrl: { type: String, default: '' },
      imageLink: { type: String, default: '' },
    },
    default: () => ({}),
  })
  welcomePopup: {
    enabled: boolean;
    mode: 'html' | 'image';
    html: string;
    imageUrl: string;
    imageLink: string;
  };

  @Prop({
    type: {
      enabled: { type: Boolean, default: false },
      html: { type: String, default: '' },
      backgroundColor: { type: String, default: '#5c6b52' },
      textColor: { type: String, default: '#ffffff' },
      animation: { type: String, enum: ['marquee', 'pulse', 'slide', 'none'], default: 'marquee' },
      dismissible: { type: Boolean, default: true },
    },
    default: () => ({}),
  })
  announcementBar: {
    enabled: boolean;
    html: string;
    backgroundColor: string;
    textColor: string;
    animation: 'marquee' | 'pulse' | 'slide' | 'none';
    dismissible: boolean;
  };

  /**
   * When false, checkout creates the order and completes without Razorpay
   * (same customer flow, payment step skipped).
   */
  @Prop({ default: true })
  paymentEnabled: boolean;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
TenantSchema.index({ domains: 1 });
