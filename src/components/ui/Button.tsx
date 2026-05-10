type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--primary)] text-[var(--primary-text)] hover:bg-[var(--primary-hover)] shadow-sm",
  secondary:
    "border border-[var(--border)] text-[var(--text)] hover:bg-[var(--hover)] hover:border-[var(--border-strong)]",
  ghost:
    "text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text-bright)]",
  danger:
    "border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300",
};

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
};

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}: {
  variant?: Variant;
  size?: Size;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-medium tracking-tight transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
