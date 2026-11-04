'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { DEFAULT_DISPLAY_FONT, type DisplayFont } from '@/theme/fonts';

export type NavigationPosition = 'auto' | 'top' | 'left' | 'bottom';

const DISPLAY_FONTS: DisplayFont[] = ['sans', 'serif'];

interface SettingsContextType {
  navigationPosition: NavigationPosition;
  setNavigationPosition: (position: NavigationPosition) => void;
  /** 表示名（JIS文字）用フォント。ゴシック（sans）／明朝（serif）。既定は sans。 */
  displayFont: DisplayFont;
  setDisplayFont: (font: DisplayFont) => void;
  /** 各画面のタイトル下に「架空のテストデータ」である旨を表示するか。既定は false（表示しない）。 */
  showDemoDataNotice: boolean;
  setShowDemoDataNotice: (show: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [navigationPosition, setNavigationPositionState] = useState<NavigationPosition>('auto');
  const [displayFont, setDisplayFontState] = useState<DisplayFont>(DEFAULT_DISPLAY_FONT);
  const [showDemoDataNotice, setShowDemoDataNoticeState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // localStorage は reactive ではないため、マウント後に一度だけ読み込んで state に反映する。
    const savedPosition = localStorage.getItem('navigationPosition') as NavigationPosition | null;
    if (savedPosition && ['auto', 'top', 'left', 'bottom'].includes(savedPosition)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNavigationPositionState(savedPosition);
    }
    const savedFont = localStorage.getItem('displayFont') as DisplayFont | null;
    if (savedFont && DISPLAY_FONTS.includes(savedFont)) {
      setDisplayFontState(savedFont);
    }
    if (localStorage.getItem('showDemoDataNotice') === 'true') {
      setShowDemoDataNoticeState(true);
    }
    setIsLoaded(true);
  }, []);

  const setNavigationPosition = (position: NavigationPosition) => {
    setNavigationPositionState(position);
    localStorage.setItem('navigationPosition', position);
  };

  const setDisplayFont = (font: DisplayFont) => {
    setDisplayFontState(font);
    localStorage.setItem('displayFont', font);
  };

  const setShowDemoDataNotice = (show: boolean) => {
    setShowDemoDataNoticeState(show);
    localStorage.setItem('showDemoDataNotice', show ? 'true' : 'false');
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <SettingsContext.Provider
      value={{
        navigationPosition,
        setNavigationPosition,
        displayFont,
        setDisplayFont,
        showDemoDataNotice,
        setShowDemoDataNotice,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
