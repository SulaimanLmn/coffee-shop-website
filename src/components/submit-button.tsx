"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  children: ReactNode;
  /** Shown while the surrounding form's action is running. */
  pendingLabel?: string;
};

/** Submit button that reports pending state: disabled, aria-busy and a "Saving…" label. */
export function SubmitButton({ children, pendingLabel = "Saving…", disabled, ...rest }: Props) {
  const { pending } = useFormStatus();
  return (
    <button {...rest} type="submit" disabled={disabled || pending} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
