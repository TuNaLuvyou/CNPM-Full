import React, { useState, useEffect } from "react";
import SidebarStrip from "./SidebarStrip";
import TasksPanel from "@/components/panels/TasksPanel";
import KeepPanel from "@/components/panels/KeepPanel";
import MapsPanel from "@/components/panels/MapsPanel";
import ContactsPanel from "@/components/panels/ContactsPanel";
import { CheckSquare, Lightbulb, MapPin, Users } from "lucide-react";
import { t } from "@/lib/i18n";

export default function RightSidebar({ appSettings, currentUser }) {
  const lang = appSettings?.language || "vi";
  const [rightPanel, setRightPanel] = useState(null);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  // States moved from Calendar.jsx or simplified for now
  // In a real app, these might come from context or props
  const tasksCount = 0; // Simplified
  const contactUnreadTotal = 0; // Simplified

  const toggleRightPanel = (panel) =>
    setRightPanel((prev) => (prev === panel ? null : panel));

  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = "col-resize";
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const newWidth = window.innerWidth - e.clientX - 48;
      if (newWidth >= 280 && newWidth <= 600) {
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "default";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const sidebarButtons = [
    {
      id: "tasks",
      icon: <CheckSquare className="w-5 h-5" />,
      label: t('sidebar_tools.tasks', lang),
      activeColor: "text-blue-600",
      activeBg: "bg-blue-50",
      badge: tasksCount || null,
      badgeColor: "bg-blue-500",
    },
    {
      id: "keep",
      icon: <Lightbulb className="w-5 h-5" />,
      label: t('sidebar_tools.keep', lang),
      activeColor: "text-yellow-500",
      activeBg: "bg-yellow-50",
      badge: null,
      badgeColor: "",
    },
    {
      id: "maps",
      icon: <MapPin className="w-5 h-5" />,
      label: t('sidebar_tools.maps', lang),
      activeColor: "text-red-500",
      activeBg: "bg-red-50",
      badge: null,
      badgeColor: "",
    },
    {
      id: "contacts",
      icon: <Users className="w-5 h-5" />,
      label: t('sidebar_tools.contacts', lang),
      activeColor: "text-emerald-600",
      activeBg: "bg-emerald-50",
      badge: contactUnreadTotal || null,
      badgeColor: "bg-red-500",
    },
  ];

  const getRightPanelContent = () => {
    switch (rightPanel) {
      case "tasks":
        return <TasksPanel appSettings={appSettings} />;
      case "keep":
        return <KeepPanel appSettings={appSettings} />;
      case "maps":
        return <MapsPanel appSettings={appSettings} />;
      case "contacts":
        return <ContactsPanel appSettings={appSettings} currentUser={currentUser} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-shrink-0">
      {rightPanel && (
        <>
          <div
            onMouseDown={startResizing}
            className={`w-1.5 h-full cursor-col-resize hover:bg-blue-400/30 transition-colors z-30 flex-shrink-0 -mr-1.5 relative ${
              isResizing ? "bg-blue-500/40" : ""
            }`}
          />
          <div
            className="border-l border-slate-200 bg-white flex-shrink-0 flex flex-col overflow-hidden shadow-lg relative z-20"
            style={{ 
              width: `${rightPanelWidth}px`,
              animation: "slideInRight 0.2s ease-out" 
            }}
          >
            {getRightPanelContent()}
          </div>
        </>
      )}
      <SidebarStrip
        buttons={sidebarButtons}
        rightPanel={rightPanel}
        toggleRightPanel={toggleRightPanel}
      />
    </div>
  );
}
