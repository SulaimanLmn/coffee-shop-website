"use client";

import { useId, useState } from "react";
import { inputClass } from "./form-kit";

/**
 * Password input with a show/hide toggle (aria-pressed). With `minLength` it
 * also shows a live "at least N characters" hint. The field stays a normal
 * named input, so it posts in a plain <form action>.
 */
export function PasswordField({
  name,
  label,
  autoComplete,
  minLength,
  required = true,
  invalid,
  describedBy,
  hint,
}: {
  name: string;
  label: string;
  autoComplete: string;
  minLength?: number;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [length, setLength] = useState(0);
  const hintId = useId();
  const ids = [minLength || hint ? hintId : null, describedBy].filter(Boolean).join(" ") || undefined;

  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium text-espresso">
        {label}
        <span className="relative mt-1.5 block">
          <input
            name={name}
            type={visible ? "text" : "password"}
            required={required}
            minLength={minLength}
            autoComplete={autoComplete}
            onChange={(e) => setLength(e.target.value.length)}
            aria-invalid={invalid || undefined}
            aria-describedby={ids}
            className={`${inputClass} pr-11 font-normal`}
          />
          <button
            type="button"
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-1 my-1 flex items-center rounded-md px-2.5 text-caramel-dark hover:text-espresso"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {visible && <path d="M4 4l16 16" />}
            </svg>
            <span className="sr-only">
              {visible ? "Hide" : "Show"} {label.toLowerCase()}
            </span>
          </button>
        </span>
      </label>
      {(minLength || hint) && (
        <p id={hintId} className="text-xs text-mocha">
          {minLength
            ? length >= minLength
              ? `${length} characters. Good.`
              : `At least ${minLength} characters${length > 0 ? ` (${length} so far)` : ""}.`
            : hint}
        </p>
      )}
    </div>
  );
}
