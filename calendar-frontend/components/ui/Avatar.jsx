import React from "react";

export default function Avatar({ 
  src, 
  alt, 
  initials, 
  size = "md", 
  color = "bg-blue-600",
  className = "" 
}) {
  const sizes = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
    xl: "w-20 h-20 text-3xl",
  };

  const baseClasses = `flex items-center justify-center rounded-full font-bold text-white shadow-sm shrink-0 ${sizes[size]} ${className}`;

  if (src) {
    return (
      <img 
        src={src} 
        alt={alt || "Avatar"} 
        className={`${baseClasses} object-cover`} 
      />
    );
  }

  return (
    <div className={`${baseClasses} ${color}`}>
      {initials || "?"}
    </div>
  );
}
