"use client";

import { useFormStatus } from "react-dom";

/** Submit button styled as an on/off switch. The state is also spelled out as text. */
export function AvailabilitySwitch({ name, checked }: { name: string; checked: boolean }) {
  const { pending } = useFormStatus();
  // While the action runs, show the state the click will produce.
  const on = pending ? !checked : checked;
  return (
    <button
      type="submit"
      role="switch"
      aria-checked={on}
      aria-label={`Available: ${name}`}
      aria-busy={pending}
      disabled={pending}
      className="group inline-flex items-center gap-2 rounded-full py-1 disabled:cursor-wait"
    >
      <span
        aria-hidden="true"
        className={
          "relative h-6 w-11 rounded-full transition-colors " +
          (on ? "bg-status-completed" : "bg-mocha/50")
        }
      >
        <span
          className={
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all " +
            (on ? "left-[1.375rem]" : "left-0.5")
          }
        />
      </span>
      <span className={"w-7 text-xs font-semibold " + (on ? "text-status-completed-ink" : "text-mocha")}>
        {on ? "On" : "Off"}
      </span>
    </button>
  );
}
