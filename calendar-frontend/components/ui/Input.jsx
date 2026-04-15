import React, { forwardRef } from "react";

const Input = forwardRef(({ className = "", icon: Icon, wrapperClassName = "", ...props }, ref) => {
  return (
    <div className={`relative flex items-center ${wrapperClassName}`}>
      {Icon && (
        <span className="absolute left-3 text-slate-400">
          <Icon className="w-4 h-4" />
        </span>
      )}
      <input
        ref={ref}
        className={`w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl outline-none focus:border-blue-300 focus:bg-white transition-all placeholder:text-slate-400
          ${Icon ? "pl-10 pr-4 py-2" : "px-4 py-2"}
          ${className}`}
        {...props}
      />
    </div>
  );
});

Input.displayName = "Input";

export default Input;
