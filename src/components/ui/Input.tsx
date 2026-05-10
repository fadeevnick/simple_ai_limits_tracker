import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-3.5 py-2.5 text-base text-[var(--text-bright)] placeholder:text-[var(--text-faint)] transition-colors focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 ${className}`}
      {...props}
    />
  ),
);

Input.displayName = "Input";
