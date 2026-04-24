import React from "react";
import { Inbox, Check, X } from "lucide-react";
import { t } from "@/lib/i18n";

export default function InvitationsTab({
  invitations,
  handleInviteAction,
  lang
}) {
  return (
    <div className="p-4 space-y-3">
      {invitations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2">
          <Inbox className="w-10 h-10 opacity-20" />
          <p className="text-xs font-medium">{t('contacts_panel.no_invitations', lang)}</p>
        </div>
      ) : (
        invitations.map((inv) => (
          <div key={inv.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
                {inv.sender_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">{inv.sender_name}</p>
                <p className="text-xs text-slate-400">{inv.sender_email}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleInviteAction(inv.id, 'accept')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
              >
                <Check className="w-3.5 h-3.5" /> {t('contacts_panel.accept_btn', lang)}
              </button>
              <button
                onClick={() => handleInviteAction(inv.id, 'decline')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
              >
                <X className="w-3.5 h-3.5" /> {t('contacts_panel.decline_btn', lang)}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
