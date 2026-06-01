import React from "react";

export function Button({
  className = "",
  variant = "default",
  disabled = false,
  children,
  ...props
}) {
  const base = "inline-flex items-center justify-center font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500",
    outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus:ring-slate-400",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-400",
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.default} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
