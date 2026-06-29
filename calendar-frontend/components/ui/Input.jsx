import React, { forwardRef } from "react";

const Input = forwardRef(({ className = "", icon: Icon, wrapperClassName = "", ...props }, ref) => {
  return (
    <div className={`relative flex items-center ${wrapperClassName}`}>
      {Icon && (
        <span className="absolute left-3 text-slate-400 dark:text-[#9e9e9e]">
          <Icon className="w-4 h-4" />
        </span>
      )}
      <input
        ref={ref}
        className={`w-full bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#484848] text-slate-800 dark:text-[#e3e3e3] text-sm rounded-xl outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-[#1f1f1f] transition-all placeholder:text-slate-400 dark:placeholder:text-[#757575]
          ${Icon ? "pl-10 pr-4 py-2" : "px-4 py-2"}
          ${className}`}
        {...props}
      />
    </div>
  );
});

Input.displayName = "Input";

export default Input;
