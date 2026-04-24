import React from "react";
import { t } from "@/lib/i18n";

export default function CreateModalFooter({
  editingItem,
  isOwner,
  canEdit,
  deleting,
  saving,
  handleXoa,
  handleLeave,
  onClose,
  handleLuu,
  lang,
  activeTab
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-gray-50/50 rounded-b-2xl">
      <div className="flex-shrink-0 flex items-center gap-4">
        {editingItem && (
          isOwner ? (
            <button
              onClick={handleXoa}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              {deleting ? t('deleting', lang) : t('delete', lang)}
            </button>
          ) : (
            editingItem.is_invitee && (
              <button
                onClick={handleLeave}
                disabled={deleting}
                className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 border border-red-100 rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? '...' : t('contacts_panel.leave_event', lang)}
              </button>
            )
          )
        )}
        
        {!isOwner && editingItem?.owner_name && (
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{t('contacts_panel.owned_by', lang)}</span>
            <span className="text-xs text-slate-600 font-medium">@{editingItem.owner_name}</span>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
        >
          {t('cancel', lang)}
        </button>
        {canEdit && (
          <button
            onClick={handleLuu}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving ? t('saving', lang) : (editingItem ? t('update', lang) : t('save', lang))}
          </button>
        )}
      </div>
    </div>
  );
}
