import { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '../../extension/popup/theme'

/** 在 ThemeProvider 包裹下渲染组件，使 useTheme() 在测试中可用 */
export function renderWithTheme(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { themeMode?: 'dark' | 'light' | 'system' },
) {
  const { themeMode = 'dark', ...renderOptions } = options ?? {}
  return render(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider themeMode={themeMode}>
        {children}
      </ThemeProvider>
    ),
    ...renderOptions,
  })
}
