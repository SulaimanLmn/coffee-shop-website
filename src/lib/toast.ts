"use client";

import { create } from "zustand";

export type Toast = {
  id: number;
  message: string;
  variant: "success" | "error" | "info";
};

type ToastState = {
  toasts: Toast[];
  show: (message: string, variant?: Toast["variant"]) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message, variant = "success") => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 2800);
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, variant?: Toast["variant"]) {
  useToastStore.getState().show(message, variant);
}
