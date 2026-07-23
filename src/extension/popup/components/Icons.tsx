/** 基于 lucide-react 的专业图标，统一 currentColor */

import { Bookmark, Upload, Download, Settings } from 'lucide-react'

export function BookmarkIcon() {
  return <Bookmark size={18} strokeWidth={1.8} />
}

export function PushIcon() {
  return <Upload size={18} strokeWidth={1.8} />
}

export function PullIcon() {
  return <Download size={18} strokeWidth={1.8} />
}

export function SettingsIcon() {
  return <Settings size={18} strokeWidth={1.8} />
}
