import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '../../../extension/popup/theme'
import { PushConfirmModal } from '../../../extension/popup/components/PushConfirmModal'
import type { Bookmark } from '../../../shared/types'

const mockBookmarks: Bookmark[] = [
  {
    id: '1',
    title: 'GitHub',
    url: 'https://github.com',
    folder: '/书签栏',
    tags: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Google',
    url: 'https://google.com',
    folder: '/书签栏/工具',
    tags: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '3',
    title: 'React',
    url: 'https://react.dev',
    folder: '/其他书签',
    tags: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
]

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider themeMode="dark">{ui}</ThemeProvider>)
}

describe('PushConfirmModal', () => {
  it('显示总书签数和目录分布', () => {
    renderWithTheme(
      <PushConfirmModal
        bookmarks={mockBookmarks}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('条书签将推送到 GitHub')).toBeTruthy()
    expect(screen.getByText(/书签栏/)).toBeTruthy()
    expect(screen.getByText(/其他书签/)).toBeTruthy()
  })

  it('点击确认触发 onConfirm', () => {
    const onConfirm = vi.fn()
    renderWithTheme(
      <PushConfirmModal
        bookmarks={mockBookmarks}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('✓ 确认推送'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('点击取消触发 onCancel', () => {
    const onCancel = vi.fn()
    renderWithTheme(
      <PushConfirmModal
        bookmarks={mockBookmarks}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )

    fireEvent.click(screen.getByText('✕ 取消'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('点击遮罩层触发 onCancel', () => {
    const onCancel = vi.fn()
    const { container } = renderWithTheme(
      <PushConfirmModal
        bookmarks={mockBookmarks}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )

    // 遮罩层是第一个 div（overlay）
    const overlay = container.firstChild as HTMLElement
    fireEvent.click(overlay)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('点击模态框内容不触发 onCancel（stopPropagation）', () => {
    const onCancel = vi.fn()
    renderWithTheme(
      <PushConfirmModal
        bookmarks={mockBookmarks}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )

    // 点击确认按钮，不应穿透到 overlay
    fireEvent.click(screen.getByText('✓ 确认推送'))
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('显示强制覆盖警告', () => {
    renderWithTheme(
      <PushConfirmModal
        bookmarks={mockBookmarks}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText(/强制覆盖远程/)).toBeTruthy()
  })

  it('空书签列表显示 0', () => {
    renderWithTheme(
      <PushConfirmModal
        bookmarks={[]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('0')).toBeTruthy()
  })
})
