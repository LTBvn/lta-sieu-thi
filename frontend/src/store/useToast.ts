import { create } from 'zustand'

type Toast = { id: number; message: string; image?: string }

type ToastState = {
  toasts: Toast[]
  show: (message: string, image?: string) => void
  dismiss: (id: number) => void
}

let nextId = 1

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  show(message, image) {
    const id = nextId++
    set({ toasts: [...get().toasts.slice(-2), { id, message, image }] })
    setTimeout(() => get().dismiss(id), 2500)
  },
  dismiss(id) {
    set({ toasts: get().toasts.filter(t => t.id !== id) })
  }
}))
