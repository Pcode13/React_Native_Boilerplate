import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { MMKV } from 'react-native-mmkv';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/theme';

import Example from './Example';

describe('Example screen should render correctly', () => {
  let storage: MMKV;
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        gcTime: Infinity,
      },
      queries: {
        gcTime: Infinity,
        retry: false,
      },
    },
  });

  beforeAll(() => {
    storage = new MMKV();
  });



  test('the user change the theme', () => {
    const component = (
      <SafeAreaProvider>
        <ThemeProvider storage={storage}>
          <QueryClientProvider client={queryClient}>
            <Example />
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    );

    render(component);

    expect(storage.getString('theme')).toBe('default');

    const button = screen.getByTestId('change-theme-button');
    expect(button).toBeDefined();
    fireEvent.press(button);

    expect(storage.getString('theme')).toBe('dark');
  });
});
