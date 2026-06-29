import React from "react";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-100",
    secondary: "bg-slate-100 dark:bg-[#353535] hover:bg-slate-200 dark:hover:bg-[#484848] text-slate-700 dark:text-[#e3e3e3]",
    outline: "border border-slate-200 dark:border-[#484848] text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-50 dark:hover:bg-[#2d2d2d]",
    ghost: "text-slate-600 dark:text-[#bdbdbd] hover:text-slate-900 dark:hover:text-[#ffffff] dark:text-white hover:bg-slate-100 dark:hover:bg-[#353535]",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-xl",
    lg: "px-5 py-2.5 text-base rounded-xl",
    icon: "p-2 rounded-xl",
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
