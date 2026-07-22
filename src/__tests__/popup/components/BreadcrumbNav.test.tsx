import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BreadcrumbNav } from '../../../extension/popup/components/BreadcrumbNav'

describe('BreadcrumbNav', () => {
  const defaultProps = {
    breadcrumbs: [
      { id: '1', title: '书签栏' },
      { id: '10', title: '工作' },
    ],
    currentFolderTitle: '项目',
    onGoBack: vi.fn(),
    onNavigateToBreadcrumb: vi.fn(),
  }

  it('应显示返回按钮', () => {
    render(<BreadcrumbNav {...defaultProps} />)
    expect(screen.getByText('← 返回')).toBeInTheDocument()
  })

  it('应显示面包屑路径', () => {
    render(<BreadcrumbNav {...defaultProps} />)
    expect(screen.getByText('书签栏')).toBeInTheDocument()
    expect(screen.getByText('工作')).toBeInTheDocument()
  })

  it('应显示当前文件夹名', () => {
    render(<BreadcrumbNav {...defaultProps} />)
    expect(screen.getByTitle('项目')).toBeInTheDocument()
  })

  it('点击面包屑项应触发 onNavigateToBreadcrumb', () => {
    const onNavigate = vi.fn()
    render(<BreadcrumbNav {...defaultProps} onNavigateToBreadcrumb={onNavigate} />)
    fireEvent.click(screen.getByText('书签栏'))
    expect(onNavigate).toHaveBeenCalledWith(0)
  })

  it('点击返回按钮应触发 onGoBack', () => {
    const onGoBack = vi.fn()
    render(<BreadcrumbNav {...defaultProps} onGoBack={onGoBack} />)
    fireEvent.click(screen.getByText('← 返回'))
    expect(onGoBack).toHaveBeenCalledTimes(1)
  })
})
