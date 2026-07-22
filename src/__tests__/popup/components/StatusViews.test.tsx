import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingView } from '../../../extension/popup/components/LoadingView'
import { UnconfiguredView } from '../../../extension/popup/components/UnconfiguredView'

describe('LoadingView', () => {
  it('应显示加载文本', () => {
    render(<LoadingView />)
    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })
})

describe('UnconfiguredView', () => {
  it('应显示配置提示', () => {
    render(<UnconfiguredView onOpenOptions={vi.fn()} />)
    expect(screen.getByText('🔧 请先配置 GitHub 仓库连接')).toBeInTheDocument()
    expect(screen.getByText('前往设置')).toBeInTheDocument()
  })
})
