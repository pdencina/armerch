'use client'

import { useEffect } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export type NotifyType = 'success' | 'error' | 'warning' | 'info'

export interface NotifyState {
  type: NotifyType
  title: string
  message?: string
  icon?: string
}

const CONFIG = {
  success: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', Icon: CheckCircle2 },
  error:   { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',         Icon: XCircle },
  warning: { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     Icon: AlertTriangle },
  info:    { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       Icon: Info },
}

export function NotifyModal({
  notify,
  onClose,
  autoClose = true,
  autoCloseMs = 2500,
}: {
  notify: NotifyState | null
  onClose: () => void
  autoClose?: boolean
  autoCloseMs?: number
}) {
  useEffect(() => {
    if (!notify || !autoClose) return
    const t = setTimeout(onClose, autoCloseMs)
    return () => clearTimeout(t)
  }, [notify, autoClose, autoCloseMs, onClose])

  if (!notify) return null

  const cfg = CONFIG[notify.type]
  const Icon = cfg.Icon

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={`relative flex flex-col items-center gap-4 rounded-3xl border ${cfg.bg} px-10 py-8 shadow-2xl text-center max-w-sm w-full`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 hover:text-zinc-300 transition"
        >
          <X size={14} />
        </button>

        {/* Icon or emoji */}
        {notify.icon ? (
          <div className="text-5xl">{notify.icon}</div>
        ) : (
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${cfg.bg}`}>
            <Icon size={28} className={cfg.color} />
          </div>
        )}

        {/* Text */}
        <div>
          <p className={`text-lg font-bold ${cfg.color}`}>{notify.title}</p>
          {notify.message && (
            <p className="mt-1.5 text-sm text-zinc-400">{notify.message}</p>
          )}
        </div>

        {/* Button */}
        <button
          onClick={onClose}
          className="mt-1 rounded-2xl bg-zinc-700 hover:bg-zinc-600 px-8 py-2.5 text-sm font-semibold text-white transition"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}

// Hook helper
import { useState, useCallback } from 'react'

export function useNotify() {
  const [notify, setNotify] = useState<NotifyState | null>(null)

  const show = useCallback((type: NotifyType, title: string, message?: string, icon?: string) => {
    setNotify({ type, title, message, icon })
  }, [])

  const success = useCallback((title: string, message?: string, icon?: string) =>
    show('success', title, message, icon ?? '✅'), [show])

  const error = useCallback((title: string, message?: string) =>
    show('error', title, message), [show])

  const warning = useCallback((title: string, message?: string) =>
    show('warning', title, message), [show])

  const info = useCallback((title: string, message?: string) =>
    show('info', title, message), [show])

  const close = useCallback(() => setNotify(null), [])

  return { notify, success, error, warning, info, close }
}
