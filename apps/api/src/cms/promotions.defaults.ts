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
