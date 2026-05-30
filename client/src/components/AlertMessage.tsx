type Variant = "error" | "success" | "warning";

const STYLES: Record<Variant, string> = {
  error:   "bg-destructive/10 border-destructive/30 text-destructive",
  success: "bg-green-50 border-green-200 text-green-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
};

export function AlertMessage({ message, variant = "error", className }: { message: string; variant?: Variant; className?: string }) {
  return (
    <div role="alert" className={`rounded-md border px-4 py-3 text-sm ${STYLES[variant]}${className ? ` ${className}` : ""}`}>
      {message}
    </div>
  );
}
