import type {
  FulfilledThemeConfiguration,
  Variant,
} from '@/theme/types/config';
import type { ComponentTheme, Theme } from '@/theme/types/theme';
import type { PropsWithChildren } from 'react';
import type { MMKV } from 'react-native-mmkv';

import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import {
  generateBackgrounds,
  staticBackgroundStyles,
} from '@/theme/backgrounds';
import {
  generateBorderColors,
  generateBorderRadius,
  generateBorderWidths,
  staticBorderStyles,
} from '@/theme/borders';
import componentsGenerator from '@/theme/components';
import {
  generateFontColors,
  generateFontSizes,
  staticFontStyles,
} from '@/theme/fonts';
import { generateGutters, staticGutterStyles } from '@/theme/gutters';
import layout from '@/theme/layout';
import generateConfig from '@/theme/ThemeProvider/generateConfig';

type Context = {
  changeTheme: (variant: Variant | 'auto') => void;
  currentThemeSetting: Variant | 'auto';
  storage: MMKV;
} & Theme;

export const ThemeContext = createContext<Context | undefined>(undefined);

type Properties = PropsWithChildren<{
  readonly storage: MMKV;
}>;

function ThemeProvider({ children = false, storage }: Properties) {
  const systemColorScheme = useColorScheme();
  
  // Current theme variant
  const [variant, setVariant] = useState(
    (storage.getString('theme') ?? 'auto') as Variant | 'auto',
  );

  // Initialize theme at auto if not defined
  useEffect(() => {
    const appHasThemeDefined = storage.contains('theme');
    if (!appHasThemeDefined) {
      storage.set('theme', 'auto');
      setVariant('auto');
    }
  }, [storage]);

  // Auto-detect system theme
  const effectiveVariant = useMemo(() => {
    if (variant === 'auto') {
      return systemColorScheme === 'dark' ? 'dark' : 'default';
    }
    return variant as Variant;
  }, [variant, systemColorScheme]);

  const changeTheme = useCallback(
    (nextVariant: Variant | 'auto') => {
      setVariant(nextVariant);
      storage.set('theme', nextVariant);
    },
    [storage],
  );

  // Flatten config with current variant
  const fullConfig = useMemo(() => {
    return generateConfig(effectiveVariant) satisfies FulfilledThemeConfiguration;
  }, [effectiveVariant]);

  const fonts = useMemo(() => {
    return {
      ...generateFontSizes(),
      ...generateFontColors(fullConfig),
      ...staticFontStyles,
    };
  }, [fullConfig]);

  const backgrounds = useMemo(() => {
    return {
      ...generateBackgrounds(fullConfig),
      ...staticBackgroundStyles,
    };
  }, [fullConfig]);

  const gutters = useMemo(() => {
    return {
      ...generateGutters(fullConfig),
      ...staticGutterStyles,
    };
  }, [fullConfig]);

  const borders = useMemo(() => {
    return {
      ...generateBorderColors(fullConfig),
      ...generateBorderRadius(),
      ...generateBorderWidths(),
      ...staticBorderStyles,
    };
  }, [fullConfig]);

  const navigationTheme = useMemo(() => {
    if (effectiveVariant === 'dark') {
      return {
        ...DarkTheme,
        colors: fullConfig.navigationColors,
        dark: true,
      };
    }
    return {
      ...DefaultTheme,
      colors: fullConfig.navigationColors,
      dark: false,
    };
  }, [effectiveVariant, fullConfig.navigationColors]);

  const theme = useMemo(() => {
    return {
      backgrounds,
      borders,
      colors: fullConfig.colors,
      fonts,
      gutters,
      layout,
      variant: effectiveVariant,
    } satisfies ComponentTheme;
  }, [effectiveVariant, fonts, backgrounds, borders, fullConfig.colors, gutters]);

  const components = useMemo(() => {
    return componentsGenerator(theme);
  }, [theme]);

  const value = useMemo(() => {
    return { ...theme, changeTheme, components, navigationTheme, currentThemeSetting: variant, storage };
  }, [theme, components, navigationTheme, changeTheme, variant, storage]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export default ThemeProvider;
