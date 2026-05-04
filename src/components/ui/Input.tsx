import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <input
    ref={ref}
    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-md px-4 py-3 text-base text-[var(--text-bright)] focus:outline-none focus:border-gray-400"
    {...props}
  />
));

Input.displayName = "Input";
