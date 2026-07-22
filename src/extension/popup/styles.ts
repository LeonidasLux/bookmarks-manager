import type React from 'react'

export const styles = {
  container: {
    width: 400,
    padding: '14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    background: '#ffffff',
    color: '#202124',
    fontSize: '13px',
    lineHeight: 1.5,
  } as React.CSSProperties,

  toolbar: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    marginBottom: '10px',
    paddingBottom: '10px',
    borderBottom: '1px solid #e8eaed',
  } as React.CSSProperties,

  iconBtn: {
    width: 30,
    height: 30,
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    color: '#5f6368',
    transition: 'background 0.15s',
  } as React.CSSProperties,

  iconBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  } as React.CSSProperties,

  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '12px',
    fontSize: '12px',
    color: '#5f6368',
    flexWrap: 'wrap' as const,
    minHeight: 26,
  },

  backBtn: {
    cursor: 'pointer',
    border: 'none',
    background: '#f1f3f4',
    borderRadius: '6px',
    padding: '3px 10px',
    fontSize: '12px',
    color: '#5f6368',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    marginRight: '2px',
    whiteSpace: 'nowrap' as const,
    transition: 'background 0.15s',
  } as React.CSSProperties,

  breadcrumbItem: {
    cursor: 'pointer',
    color: '#1a73e8',
    textDecoration: 'none',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    transition: 'background 0.15s',
  } as React.CSSProperties,

  breadcrumbSep: {
    color: '#9aa0a6',
    fontSize: '10px',
    userSelect: 'none' as const,
  },

  currentLabel: {
    color: '#202124',
    fontWeight: 500,
    fontSize: '12px',
    padding: '2px 4px',
    maxWidth: 140,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '8px',
  },

  folderTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 16px',
    borderRadius: '20px',
    background: '#f1f3f4',
    color: '#3c4043',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid #e0e0e0',
    transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
    userSelect: 'none' as const,
    maxWidth: 260,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  bookmarkRow: {
    padding: '8px 4px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    transition: 'background 0.15s',
  } as React.CSSProperties,

  bookmarkTitle: {
    textDecoration: 'none',
    color: '#1a73e8',
    fontWeight: 500,
    fontSize: '13px',
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  bookmarkMeta: {
    fontSize: '11px',
    color: '#9aa0a6',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    marginTop: '2px',
  },

  sectionLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#9aa0a6',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '6px',
    marginTop: '2px',
  },

  empty: {
    color: '#9aa0a6',
    textAlign: 'center' as const,
    padding: '24px 0',
    fontSize: '13px',
  },

  footerDivider: {
    borderTop: '1px solid #e8eaed',
    margin: '10px 0',
  },

  footerLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#9aa0a6',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },

  status: {
    fontSize: '12px',
    color: '#5f6368',
    textAlign: 'center' as const,
    paddingTop: '8px',
    borderTop: '1px solid #e8eaed',
    marginTop: '2px',
  },

  statusLoading: {
    fontSize: '12px',
    color: '#e37400',
  },

  center: {
    textAlign: 'center' as const,
    padding: '40px 14px',
    color: '#9aa0a6',
  },

  /** 差异审核 UI 样式 */
  diffContainer: {
    width: 400,
    padding: '12px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,

  diffHeader: {
    fontWeight: 600,
    fontSize: '14px',
    marginBottom: '6px',
    color: '#202124',
  },

  diffSub: {
    fontSize: '12px',
    color: '#5f6368',
    marginBottom: '8px',
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
    marginTop: '4px',
  },

  diffGroupTitle: {
    fontSize: '12px',
    fontWeight: 600,
  },

  diffActions: {
    fontSize: '11px',
    display: 'flex',
    gap: 8,
  },

  diffActionLink: {
    cursor: 'pointer' as const,
    color: '#1a73e8',
    textDecoration: 'none' as const,
  },

  diffItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 6,
    padding: '5px 0',
    borderBottom: '1px solid #f0f0f0',
  },

  diffCheckbox: {
    marginTop: 2,
    flexShrink: 0,
  },

  diffContent: {
    flex: 1,
    minWidth: 0,
  },

  diffTitle: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  diffChanges: {
    fontSize: '11px',
    color: '#888',
    marginTop: 2,
  },

  diffBottom: {
    display: 'flex',
    gap: '6px',
    justifyContent: 'flex-end' as const,
    borderTop: '1px solid #eee',
    paddingTop: '6px',
  },

  /** Tab 栏样式 */
  tabBar: {
    display: 'flex',
    gap: '2px',
    marginBottom: '8px',
    borderBottom: '2px solid #e8eaed',
  } as React.CSSProperties,

  tabItem: {
    padding: '5px 10px',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer' as const,
    border: 'none',
    background: 'transparent',
    color: '#5f6368',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
    transition: 'color 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  tabItemActive: {
    color: '#1a73e8',
    borderBottomColor: '#1a73e8',
  } as React.CSSProperties,

  emptyFolderWarning: {
    background: '#fff3e0',
    border: '1px solid #ffe0b2',
    borderRadius: '6px',
    padding: '8px 10px',
    marginBottom: '8px',
    fontSize: '11px',
    color: '#e65100',
    lineHeight: 1.5,
  } as React.CSSProperties,

  emptyFolderDisabled: {
    background: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    padding: '8px 10px',
    marginBottom: '8px',
    fontSize: '11px',
    color: '#888',
    lineHeight: 1.5,
  } as React.CSSProperties,

  emptyFolderItem: {
    padding: '4px 0',
    fontSize: '12px',
    color: '#5f6368',
    borderBottom: '1px solid #f0f0f0',
  } as React.CSSProperties,

  btnSecondary: {
    padding: '6px 14px',
    border: '1px solid #dadce0',
    borderRadius: '6px',
    background: '#fff',
    cursor: 'pointer' as const,
    fontSize: '12px',
    color: '#3c4043',
  },

  btnPrimary: {
    padding: '6px 14px',
    border: 'none',
    borderRadius: '6px',
    background: '#1a73e8',
    color: '#fff',
    cursor: 'pointer' as const,
    fontSize: '12px',
    fontWeight: 500,
  } as React.CSSProperties,

  btnPrimaryDisabled: {
    padding: '6px 14px',
    border: 'none',
    borderRadius: '6px',
    background: '#c4c7cc',
    color: '#fff',
    cursor: 'not-allowed' as const,
    fontSize: '12px',
    fontWeight: 500,
  } as React.CSSProperties,
}
