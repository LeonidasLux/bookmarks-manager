import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithTheme } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { FolderPicker } from '../../../extension/popup/components/FolderPicker'

const mockTree: chrome.bookmarks.BookmarkTreeNode[] = [
  {
    id: '0',
    title: '',
    children: [
      {
        id: '1',
        title: '书签栏',
        children: [
          { id: '11', title: '技术', children: [] },
          { id: '12', title: '工具', children: [] },
        ],
      },
      {
        id: '2',
        title: '其他书签',
        children: [],
      },
    ],
  },
]

beforeEach(() => {
  vi.spyOn(chrome.bookmarks, 'getTree').mockResolvedValue(mockTree)
})

/** 获取文件夹列表中指定标题的元素（title span） */
function getFolderItem(title: string): HTMLElement | null {
  const allTitleSpans = screen.queryAllByText(title)
  return allTitleSpans.find(
    el => el.tagName === 'SPAN' && el.style.fontWeight === '500',
  ) ?? null
}

describe('FolderPicker', () => {
  const INITIAL_TITLE = '测试页面标题'

  it('应渲染标题、书签标题输入框和搜索框', async () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()

    renderWithTheme(<FolderPicker initialTitle={INITIAL_TITLE} onSave={onSave} onCancel={onCancel} />)

    await waitFor(() => {
      expect(screen.getByText('保存书签')).toBeInTheDocument()
    })

    // 书签标题输入框应存在并已填入初始值
    const titleInput = screen.getByDisplayValue(INITIAL_TITLE) as HTMLInputElement
    expect(titleInput).toBeInTheDocument()
    expect(titleInput.tagName).toBe('INPUT')

    expect(screen.getByPlaceholderText('搜索目录...')).toBeInTheDocument()
  })

  it('应可编辑书签标题', async () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()

    renderWithTheme(<FolderPicker initialTitle={INITIAL_TITLE} onSave={onSave} onCancel={onCancel} />)

    await waitFor(() => {
      expect(screen.getByText('保存书签')).toBeInTheDocument()
    })

    const titleInput = screen.getByDisplayValue(INITIAL_TITLE) as HTMLInputElement
    await userEvent.clear(titleInput)
    await userEvent.type(titleInput, '自定义标题')

    expect(titleInput).toHaveValue('自定义标题')
  })

  it('应渲染文件夹列表', async () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()

    renderWithTheme(<FolderPicker initialTitle={INITIAL_TITLE} onSave={onSave} onCancel={onCancel} />)

    await waitFor(() => {
      expect(getFolderItem('书签栏')).toBeTruthy()
    })

    expect(getFolderItem('技术')).toBeTruthy()
    expect(getFolderItem('工具')).toBeTruthy()
    expect(getFolderItem('其他书签')).toBeTruthy()
  })

  it('搜索应过滤文件夹', async () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()

    renderWithTheme(<FolderPicker initialTitle={INITIAL_TITLE} onSave={onSave} onCancel={onCancel} />)

    await waitFor(() => {
      expect(getFolderItem('书签栏')).toBeTruthy()
    })

    const searchInput = screen.getByPlaceholderText('搜索目录...')
    await userEvent.type(searchInput, '技术')

    expect(getFolderItem('技术')).toBeTruthy()

    await waitFor(() => {
      expect(getFolderItem('工具')).toBeNull()
    })
    expect(getFolderItem('其他书签')).toBeNull()
  })

  it('无匹配搜索应显示空状态', async () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()

    renderWithTheme(<FolderPicker initialTitle={INITIAL_TITLE} onSave={onSave} onCancel={onCancel} />)

    await waitFor(() => {
      expect(getFolderItem('书签栏')).toBeTruthy()
    })

    const searchInput = screen.getByPlaceholderText('搜索目录...')
    await userEvent.type(searchInput, '不存在的文件夹')

    expect(screen.getByText('∅ 未找到匹配的目录')).toBeInTheDocument()
  })

  it('选中文件夹并点击保存应调用 onSave 并传入标题和文件夹 ID', async () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()

    renderWithTheme(<FolderPicker initialTitle={INITIAL_TITLE} onSave={onSave} onCancel={onCancel} />)

    await waitFor(() => {
      expect(getFolderItem('技术')).toBeTruthy()
    })

    // 点击技术文件夹
    const techFolder = getFolderItem('技术')!
    await userEvent.click(techFolder)

    // 点击保存按钮
    await userEvent.click(screen.getByText('保存'))

    // 应传入文件夹 ID 和标题
    expect(onSave).toHaveBeenCalledWith('11', INITIAL_TITLE)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('编辑标题后保存应传入修改后的标题', async () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()

    renderWithTheme(<FolderPicker initialTitle={INITIAL_TITLE} onSave={onSave} onCancel={onCancel} />)

    await waitFor(() => {
      expect(getFolderItem('书签栏')).toBeTruthy()
    })

    // 修改标题
    const titleInput = screen.getByDisplayValue(INITIAL_TITLE) as HTMLInputElement
    await userEvent.clear(titleInput)
    await userEvent.type(titleInput, '修改后的标题')

    // 保存
    await userEvent.click(screen.getByText('保存'))
    expect(onSave).toHaveBeenCalledWith('1', '修改后的标题')
  })

  it('取消按钮应调用 onCancel', async () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()

    renderWithTheme(<FolderPicker initialTitle={INITIAL_TITLE} onSave={onSave} onCancel={onCancel} />)

    await waitFor(() => {
      expect(screen.getByText('保存书签')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('取消'))
    expect(onCancel).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('点击遮罩层应调用 onCancel', async () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()

    const { container } = renderWithTheme(<FolderPicker initialTitle={INITIAL_TITLE} onSave={onSave} onCancel={onCancel} />)

    await waitFor(() => {
      expect(screen.getByText('保存书签')).toBeInTheDocument()
    })

    const overlay = container.firstChild as HTMLElement
    await userEvent.click(overlay)
    expect(onCancel).toHaveBeenCalled()
  })
})
