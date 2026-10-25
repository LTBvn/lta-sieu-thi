import { useEffect, useRef, useState } from 'react'
import { orderApi } from '../services/api'
import { useToast } from '../store/useToast'

/** Tiếng "ting" ngắn bằng Web Audio, không cần file âm thanh */
function ding() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)
  } catch {
    /* trình duyệt chặn âm thanh khi chưa có thao tác: bỏ qua */
  }
}

/**
 * Admin: hỏi server mỗi 10 giây. Có đơn mới thì kêu "ting", hiện thông báo,
 * và đưa số đơn chờ xử lý lên tiêu đề tab.
 */
export function useOrderAlerts() {
  const show = useToast(s => s.show)
  const [waiting, setWaiting] = useState(0)
  const latest = useRef<number | null>(null)

  useEffect(() => {
    let alive = true
    const baseTitle = document.title
    const poll = () =>
      orderApi.summary().then(({ counts, latestId }) => {
        if (!alive) return
        const n = counts.pending ?? 0
        setWaiting(n)
        document.title = n ? `(${n}) Đơn mới · LTA Admin` : baseTitle
        if (latest.current !== null && latestId > latest.current) {
          ding()
          show(`🔔 Có đơn hàng mới! ${n} đơn đang chờ xác nhận`)
        }
        latest.current = latestId
      }).catch(() => {})
    poll()
    const t = setInterval(poll, 10000)
    return () => { alive = false; clearInterval(t); document.title = baseTitle }
  }, [])

  return waiting
}
