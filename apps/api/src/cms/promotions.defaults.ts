export type WelcomePopupMode = 'html' | 'image';
export type AnnouncementAnimation = 'none' | 'marquee' | 'pulse' | 'slide';

export type WelcomePopupConfig = {
  enabled: boolean;
  mode: WelcomePopupMode;
  html: string;
  imageUrl: string;
  imageLink: string;
};

export type AnnouncementBarConfig = {
  enabled: boolean;
  html: string;
  backgroundColor: string;
  textColor: string;
  animation: AnnouncementAnimation;
  dismissible: boolean;
};

export type GoogleCustomerReviewsConfig = {
  enabled: boolean;
  merchantId: string;
  badgeEnabled: boolean;
  badgePosition: 'BOTTOM_RIGHT' | 'BOTTOM_LEFT' | 'USER_DEFINED';
  estimatedDeliveryDays: number;
  deliveryCountry: string;
};

export const DEFAULT_WELCOME_POPUP: WelcomePopupConfig = {
  enabled: false,
  mode: 'html',
  html: '',
  imageUrl: '',
  imageLink: '',
};

export const DEFAULT_ANNOUNCEMENT_BAR: AnnouncementBarConfig = {
  enabled: false,
  html: '',
  backgroundColor: '#5c6b52',
  textColor: '#ffffff',
  animation: 'marquee',
  dismissible: true,
};

export const DEFAULT_GOOGLE_CUSTOMER_REVIEWS: GoogleCustomerReviewsConfig = {
  enabled: true,
  merchantId: '5827864300',
  badgeEnabled: true,
  badgePosition: 'BOTTOM_RIGHT',
  estimatedDeliveryDays: 5,
  deliveryCountry: 'IN',
};

export function resolveWelcomePopup(
  stored?: Partial<WelcomePopupConfig> | null,
): WelcomePopupConfig {
  return {
    ...DEFAULT_WELCOME_POPUP,
    ...(stored ?? {}),
    mode: stored?.mode === 'image' ? 'image' : 'html',
  };
}

export function resolveAnnouncementBar(
  stored?: Partial<AnnouncementBarConfig> | null,
): AnnouncementBarConfig {
  const animation = stored?.animation;
  const validAnimation: AnnouncementAnimation =
    animation === 'marquee' || animation === 'pulse' || animation === 'slide' || animation === 'none'
      ? animation
      : DEFAULT_ANNOUNCEMENT_BAR.animation;

  return {
    ...DEFAULT_ANNOUNCEMENT_BAR,
    ...(stored ?? {}),
    animation: validAnimation,
  };
}

export function resolveGoogleCustomerReviews(
  stored?: Partial<GoogleCustomerReviewsConfig> | null,
): GoogleCustomerReviewsConfig {
  const pos = stored?.badgePosition;
  const validPos = pos === 'BOTTOM_LEFT' || pos === 'USER_DEFINED' ? pos : 'BOTTOM_RIGHT';

  return {
    ...DEFAULT_GOOGLE_CUSTOMER_REVIEWS,
    ...(stored ?? {}),
    merchantId: String(stored?.merchantId || DEFAULT_GOOGLE_CUSTOMER_REVIEWS.merchantId).trim(),
    badgePosition: validPos,
    estimatedDeliveryDays: typeof stored?.estimatedDeliveryDays === 'number' ? stored.estimatedDeliveryDays : 5,
    deliveryCountry: String(stored?.deliveryCountry || 'IN').trim().toUpperCase(),
  };
}
