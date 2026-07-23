import type React from 'react'

// ─── 颜色方案类型 ──────────────────────────────────────────
export interface ColorScheme {
  bg: string; surface: string; surfaceAlt: string
  border: string; borderLight: string
  text: string; textMuted: string; textDim: string
  accent: string; accentDim: string; accentGlow: string
  green: string; red: string; orange: string
  blue: string; purple: string
}

// ─── 暗色主题 ──────────────────────────────────────────────
export const darkColors: ColorScheme = {
  bg: '#0d1117',
  surface: '#161b22',
  surfaceAlt: '#1c2333',
  border: '#30363d',
  borderLight: '#21262d',
  text: '#e6edf3',
  textMuted: '#8b949e',
  textDim: '#6e7681',
  accent: '#3dd6c8',
  accentDim: '#2ea89c',
  accentGlow: 'rgba(61, 214, 200, 0.15)',
  green: '#3fb950',
  red: '#f85149',
  orange: '#d29922',
  blue: '#58a6ff',
  purple: '#bc8cff',
}

// ─── 亮色主题 ──────────────────────────────────────────────
export const lightColors: ColorScheme = {
  bg: '#ffffff',
  surface: '#f6f8fa',
  surfaceAlt: '#eef1f5',
  border: '#d8dee4',
  borderLight: '#e8ecf0',
  text: '#1f2328',
  textMuted: '#656d76',
  textDim: '#8b949e',
  accent: '#0d9488',
  accentDim: '#0f766e',
  accentGlow: 'rgba(13, 148, 136, 0.1)',
  green: '#1a7f37',
  red: '#cf222e',
  orange: '#9a6700',
  blue: '#0969da',
  purple: '#8250df',
}

export const fonts = {
  mono: '"JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace',
  ui: '"SF Mono", "Fira Code", "Consolas", monospace',
} as const

// ─── 基于主题色生成样式 ─────────────────────────────────────
export function createStyles(colors: ColorScheme) {
  const baseInput = {
    fontFamily: fonts.mono,
    fontSize: '12px',
    padding: '6px 10px',
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    background: colors.bg,
    color: colors.text,
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  } as React.CSSProperties

  return {
    // ─── 容器 ───
    container: {
      width: 420,
      padding: '12px',
      fontFamily: fonts.ui,
      background: colors.bg,
      color: colors.text,
      fontSize: '12px',
      lineHeight: 1.6,
    } as React.CSSProperties,

    // ─── 工具栏 ───
    toolbar: {
      display: 'flex',
      gap: '4px',
      alignItems: 'center',
      marginBottom: '10px',
      paddingBottom: '8px',
      borderBottom: `1px solid ${colors.borderLight}`,
    } as React.CSSProperties,

    toolbarTitle: {
      flex: 1,
      fontWeight: 600,
      fontSize: '12px',
      color: colors.text,
      letterSpacing: '0.5px',
      textTransform: 'uppercase' as const,
    } as React.CSSProperties,

    iconBtn: {
      width: 28,
      height: 28,
      border: `1px solid transparent`,
      borderRadius: '6px',
      background: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '13px',
      color: colors.textMuted,
      transition: 'all 0.15s',
    } as React.CSSProperties,

    iconBtnHover: {
      background: colors.surface,
      borderColor: colors.border,
      color: colors.text,
    } as React.CSSProperties,

    iconBtnDisabled: {
      opacity: 0.3,
      cursor: 'not-allowed',
    } as React.CSSProperties,

    // ─── 导航（终端路径风格） ───
    nav: {
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      marginBottom: '10px',
      fontSize: '11px',
      color: colors.textMuted,
      flexWrap: 'wrap' as const,
      minHeight: 24,
      fontFamily: fonts.mono,
    } as React.CSSProperties,

    backBtn: {
      cursor: 'pointer',
      border: `1px solid ${colors.border}`,
      background: colors.surface,
      borderRadius: '4px',
      padding: '2px 8px',
      fontSize: '11px',
      color: colors.textMuted,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      marginRight: '4px',
      whiteSpace: 'nowrap' as const,
      fontFamily: fonts.mono,
      transition: 'all 0.15s',
    } as React.CSSProperties,

    breadcrumbItem: {
      cursor: 'pointer',
      color: colors.accent,
      textDecoration: 'none',
      padding: '1px 4px',
      borderRadius: '3px',
      fontSize: '11px',
      maxWidth: 100,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
      transition: 'color 0.15s',
    } as React.CSSProperties,

    breadcrumbSep: {
      color: colors.textDim,
      fontSize: '10px',
      userSelect: 'none' as const,
      margin: '0 1px',
    } as React.CSSProperties,

    currentLabel: {
      color: colors.text,
      fontWeight: 500,
      fontSize: '11px',
      padding: '1px 4px',
      maxWidth: 140,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    } as React.CSSProperties,

    // ─── 文件夹标签 ───
    tagContainer: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '4px',
      marginBottom: '6px',
    },

    folderTag: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 10px',
      borderRadius: '4px',
      background: colors.surface,
      color: colors.text,
      fontSize: '12px',
      cursor: 'pointer',
      border: `1px solid ${colors.border}`,
      fontFamily: fonts.mono,
      transition: 'all 0.15s',
      userSelect: 'none' as const,
      maxWidth: 240,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },

    // ─── 书签列表 ───
    bookmarkRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 8px',
      borderBottom: `1px solid ${colors.borderLight}`,
      cursor: 'pointer',
      borderRadius: '4px',
      transition: 'background 0.12s',
    } as React.CSSProperties,

    bookmarkIcon: {
      width: 16,
      height: 16,
      borderRadius: 2,
      flexShrink: 0,
    } as React.CSSProperties,

    bookmarkContent: {
      flex: 1,
      minWidth: 0,
    } as React.CSSProperties,

    bookmarkTitle: {
      color: colors.text,
      fontWeight: 500,
      fontSize: '12px',
      display: 'block',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },

    bookmarkMeta: {
      fontSize: '10px',
      color: colors.textDim,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
      marginTop: '1px',
    },

    sectionLabel: {
      fontSize: '10px',
      fontWeight: 600,
      color: colors.textDim,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.8px',
      marginBottom: '6px',
      marginTop: '8px',
      paddingLeft: '2px',
    },

    empty: {
      color: colors.textDim,
      textAlign: 'center' as const,
      padding: '28px 0',
      fontSize: '12px',
      fontFamily: fonts.mono,
    },

    divider: {
      borderTop: `1px solid ${colors.borderLight}`,
      margin: '8px 0',
    },

    footerLabel: {
      fontSize: '10px',
      fontWeight: 600,
      color: colors.textDim,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.8px',
      marginBottom: '6px',
      paddingLeft: '2px',
    },

    status: {
      fontSize: '11px',
      color: colors.textMuted,
      textAlign: 'center' as const,
      paddingTop: '6px',
      borderTop: `1px solid ${colors.borderLight}`,
      marginTop: '4px',
      fontFamily: fonts.mono,
    },

    statusLoading: {
      fontSize: '11px',
      color: colors.orange,
    },

    center: {
      textAlign: 'center' as const,
      padding: '48px 14px',
      color: colors.textMuted,
      fontFamily: fonts.mono,
      fontSize: '12px',
    },

    // ─── 差异审核 UI ───
    diffContainer: {
      width: 420,
      padding: '12px',
      fontFamily: fonts.ui,
      background: colors.bg,
      color: colors.text,
    } as React.CSSProperties,

    diffHeader: {
      fontWeight: 600,
      fontSize: '13px',
      marginBottom: '4px',
      color: colors.text,
      fontFamily: fonts.mono,
    },

    diffSub: {
      fontSize: '11px',
      color: colors.textMuted,
      marginBottom: '8px',
      fontFamily: fonts.mono,
    },

    diffList: {
      maxHeight: 360,
      overflowY: 'auto' as const,
      marginBottom: '8px',
    },

    diffGroupLabel: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '4px',
      marginTop: '6px',
      padding: '0 2px',
    },

    diffGroupTitle: {
      fontSize: '11px',
      fontWeight: 600,
      fontFamily: fonts.mono,
    },

    diffActions: {
      fontSize: '10px',
      display: 'flex',
      gap: 8,
    },

    diffActionLink: {
      cursor: 'pointer' as const,
      color: colors.accent,
      textDecoration: 'none' as const,
      transition: 'color 0.15s',
    },

    diffItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 6,
      padding: '4px 6px',
      borderBottom: `1px solid ${colors.borderLight}`,
      borderRadius: '3px',
      transition: 'background 0.1s',
    } as React.CSSProperties,

    diffCheckbox: {
      marginTop: 2,
      flexShrink: 0,
      accentColor: colors.accent,
    },

    diffContent: {
      flex: 1,
      minWidth: 0,
    },

    diffTitle: {
      fontSize: '11px',
      fontWeight: 500,
      color: colors.text,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
      fontFamily: fonts.mono,
    },

    diffChanges: {
      fontSize: '10px',
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: fonts.mono,
      lineHeight: 1.5,
    },

    diffBottom: {
      display: 'flex',
      gap: '6px',
      justifyContent: 'flex-end' as const,
      borderTop: `1px solid ${colors.borderLight}`,
      paddingTop: '8px',
    },

    // ─── Tab 栏 ───
    tabBar: {
      display: 'flex',
      gap: '1px',
      marginBottom: '8px',
      borderBottom: `1px solid ${colors.border}`,
    } as React.CSSProperties,

    tabItem: {
      padding: '5px 10px',
      fontSize: '11px',
      fontWeight: 500,
      cursor: 'pointer' as const,
      border: 'none',
      background: 'transparent',
      color: colors.textMuted,
      borderBottom: '2px solid transparent',
      marginBottom: '-1px',
      fontFamily: fonts.mono,
      transition: 'color 0.15s, border-color 0.15s',
      whiteSpace: 'nowrap' as const,
    } as React.CSSProperties,

    tabItemActive: {
      color: colors.accent,
      borderBottomColor: colors.accent,
    } as React.CSSProperties,

    emptyFolderWarning: {
      background: `${colors.orange}15`,
      border: `1px solid ${colors.orange}40`,
      borderRadius: '6px',
      padding: '8px 10px',
      marginBottom: '8px',
      fontSize: '11px',
      color: colors.orange,
      lineHeight: 1.5,
      fontFamily: fonts.mono,
    } as React.CSSProperties,

    emptyFolderDisabled: {
      background: `${colors.textDim}10`,
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      padding: '8px 10px',
      marginBottom: '8px',
      fontSize: '11px',
      color: colors.textMuted,
      lineHeight: 1.5,
      fontFamily: fonts.mono,
    } as React.CSSProperties,

    emptyFolderItem: {
      padding: '3px 0',
      fontSize: '11px',
      color: colors.textMuted,
      borderBottom: `1px solid ${colors.borderLight}`,
      fontFamily: fonts.mono,
    } as React.CSSProperties,

    btnSecondary: {
      padding: '5px 12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      background: colors.surface,
      cursor: 'pointer' as const,
      fontSize: '11px',
      color: colors.textMuted,
      fontFamily: fonts.mono,
      transition: 'all 0.15s',
    } as React.CSSProperties,

    btnPrimary: {
      padding: '5px 12px',
      border: `1px solid ${colors.accent}`,
      borderRadius: '6px',
      background: `${colors.accent}15`,
      color: colors.accent,
      cursor: 'pointer' as const,
      fontSize: '11px',
      fontWeight: 600,
      fontFamily: fonts.mono,
      transition: 'all 0.15s',
    } as React.CSSProperties,

    btnPrimaryDisabled: {
      padding: '5px 12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      background: 'transparent',
      color: colors.textDim,
      cursor: 'not-allowed' as const,
      fontSize: '11px',
      fontWeight: 600,
      fontFamily: fonts.mono,
    } as React.CSSProperties,

    syncLog: {
      marginTop: '4px',
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      background: colors.surfaceAlt,
      fontSize: '11px',
      fontFamily: fonts.mono,
    } as React.CSSProperties,

    syncLogHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '5px 8px',
      borderBottom: `1px solid ${colors.border}`,
      color: colors.textMuted,
      fontSize: '10px',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    } as React.CSSProperties,

    syncLogClose: {
      cursor: 'pointer',
      color: colors.textDim,
      fontSize: '12px',
      padding: '0 2px',
      lineHeight: 1,
      transition: 'color 0.15s',
    } as React.CSSProperties,

    syncLogBody: {
      padding: '4px 8px',
      maxHeight: 120,
      overflowY: 'auto' as const,
    } as React.CSSProperties,

    syncLogItem: {
      padding: '2px 0',
      color: colors.textMuted,
      lineHeight: 1.5,
      wordBreak: 'break-all' as const,
    } as React.CSSProperties,

    // ─── 统计栏 ───
    statsBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '5px 8px',
      marginBottom: '8px',
      background: colors.surface,
      borderRadius: '6px',
      border: `1px solid ${colors.border}`,
      fontSize: '11px',
      color: colors.textMuted,
      fontFamily: fonts.mono,
      overflow: 'hidden',
    } as React.CSSProperties,

    statsBarItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '3px',
      whiteSpace: 'nowrap' as const,
    },

    statsBarNum: {
      fontWeight: 600,
      color: colors.accent,
    } as React.CSSProperties,

    statsBarSep: {
      color: colors.textDim,
      userSelect: 'none' as const,
    } as React.CSSProperties,

    statsBarDivider: {
      width: 1,
      height: 12,
      background: colors.border,
      flexShrink: 0,
    } as React.CSSProperties,

    statsBarFolders: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      overflow: 'hidden',
      flex: 1,
      minWidth: 0,
    } as React.CSSProperties,

    statsBarFolder: {
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      whiteSpace: 'nowrap' as const,
      color: colors.textMuted,
    } as React.CSSProperties,

    // ─── 模态框 ───
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
    },

    modalContainer: {
      width: 360,
      maxHeight: 460,
      background: colors.surface,
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    } as React.CSSProperties,

    modalHeader: {
      fontSize: '13px',
      fontWeight: 600,
      color: colors.text,
      padding: '14px 16px 6px',
      fontFamily: fonts.mono,
    },

    modalFieldLabel: {
      fontSize: '10px',
      fontWeight: 600,
      color: colors.textDim,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      margin: '6px 16px 2px',
      fontFamily: fonts.mono,
    },

    modalInput: {
      ...baseInput,
      margin: '4px 16px 6px',
      width: 'calc(100% - 32px)',
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,

    modalSearchInput: {
      ...baseInput,
      margin: '4px 16px 8px',
      width: 'calc(100% - 32px)',
      boxSizing: 'border-box' as const,
      background: colors.bg,
    } as React.CSSProperties,

    modalList: {
      flex: 1,
      overflowY: 'auto' as const,
      maxHeight: 200,
      padding: '4px 8px',
    },

    modalEmptyState: {
      textAlign: 'center' as const,
      color: colors.textDim,
      padding: '24px 0',
      fontSize: '12px',
      fontFamily: fonts.mono,
    },

    modalItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 10px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background 0.1s',
    } as React.CSSProperties,

    modalItemSelected: {
      background: `${colors.accent}12`,
      border: `1px solid ${colors.accent}30`,
    } as React.CSSProperties,

    modalItemIcon: {
      fontSize: '14px',
      flexShrink: 0,
    },

    modalItemContent: {
      flex: 1,
      minWidth: 0,
    },

    modalItemTitle: {
      fontSize: '12px',
      fontWeight: 500,
      color: colors.text,
      fontFamily: fonts.mono,
      display: 'block',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },

    modalItemPath: {
      fontSize: '10px',
      color: colors.textDim,
      fontFamily: fonts.mono,
      display: 'block',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
      marginTop: '1px',
    },

    modalCheckmark: {
      color: colors.accent,
      fontSize: '13px',
      fontWeight: 700,
      flexShrink: 0,
    },

    modalActions: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'flex-end' as const,
      padding: '10px 16px 14px',
      borderTop: `1px solid ${colors.borderLight}`,
    },

    terminalPrompt: {
      color: colors.accent,
      fontWeight: 600,
      marginRight: '6px',
      userSelect: 'none' as const,
    } as React.CSSProperties,

    folderIcon: {
      color: colors.blue,
      fontSize: '12px',
      flexShrink: 0,
    } as React.CSSProperties,

    bookmarkDot: {
      color: colors.textDim,
      fontSize: '10px',
      flexShrink: 0,
      width: 16,
      textAlign: 'center' as const,
    } as React.CSSProperties,

    statusDot: {
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      marginRight: 4,
      flexShrink: 0,
    } as React.CSSProperties,

    statusDotGreen: {
      background: colors.green,
      boxShadow: `0 0 6px ${colors.green}60`,
    } as React.CSSProperties,

    statusDotRed: {
      background: colors.red,
      boxShadow: `0 0 6px ${colors.red}60`,
    } as React.CSSProperties,

    statusDotOrange: {
      background: colors.orange,
      boxShadow: `0 0 6px ${colors.orange}60`,
    } as React.CSSProperties,

    statusDotMuted: {
      background: colors.textDim,
    } as React.CSSProperties,
  }
}

export type Styles = ReturnType<typeof createStyles>
