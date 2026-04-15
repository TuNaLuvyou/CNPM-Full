import React from "react";

export default function Tooltip({ children, label, position = "left" }) {
  const positionClasses = {
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  };

  const arrowClasses = {
    left: "absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45",
    right: "absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45",
    top: "absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45",
    bottom: "absolute top-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45",
  };

  return (
    <div className="relative group inline-block">
      {children}
      <div 
        className={`absolute z-[100] ${positionClasses[position]} bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity delay-300 shadow-lg`}
      >
        {label}
        <div className={arrowClasses[position]} />
      </div>
    </div>
  );
}
