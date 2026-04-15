import React from "react";
import Tooltip from "../../ui/Tooltip";

export default function SidebarStrip({ buttons, rightPanel, toggleRightPanel }) {
  return (
    <div className="w-12 border-l border-slate-200 bg-white flex-shrink-0 flex flex-col items-center py-3 gap-1">
      {buttons.map((btn) => (
        <Tooltip key={btn.id} label={btn.label} position="left">
          <button
            onClick={() => toggleRightPanel(btn.id)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative
              ${
                rightPanel === btn.id
                  ? `${btn.activeBg} ${btn.activeColor}`
                  : `${btn.activeColor} hover:bg-slate-100`
              }`}
          >
            {btn.icon}
            {btn.badge && (
              <span
                className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 ${btn.badgeColor} text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none`}
              >
                {btn.badge}
              </span>
            )}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
