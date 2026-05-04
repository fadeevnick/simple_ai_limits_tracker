type Variant = "primary" | "secondary" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-[var(--primary)] text-[var(--primary-text)] hover:bg-[var(--primary-hover)]",
  secondary: "border border-[var(--border)] text-gray-600 hover:bg-[var(--hover)]",
  danger: "border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300",
};

export function Button({ variant = "secondary", className = "", children, ...props }: {
  variant?: Variant;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`px-4 py-2 text-sm rounded-md ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
