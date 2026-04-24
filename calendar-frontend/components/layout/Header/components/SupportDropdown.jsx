import React, { useState } from 'react';
import { HelpCircle, Check, AlertCircle, Send } from 'lucide-react';
import { t } from "@/lib/i18n";
import { submitSupportRequest } from "../../../../lib/api";

export default function SupportDropdown({
  helpRef,
  isHelpOpen,
  setIsHelpOpen,
  setIsSearchOpen,
  setIsNotifOpen,
  setIsSettingsOpen,
  lang
}) {
  const [helpFormData, setHelpFormData] = useState({ type: "other", subject: "", message: "" });
  const [helpStatus, setHelpStatus] = useState("idle");
  const [helpErrorMsg, setHelpErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHelpStatus("sending");
    try {
      await submitSupportRequest(helpFormData);
      setHelpStatus("success");
      setTimeout(() => {
        setIsHelpOpen(false);
        setHelpStatus("idle");
        setHelpFormData({ type: "other", subject: "", message: "" });
      }, 2000);
    } catch (err) {
      setHelpStatus("error");
      setHelpErrorMsg(err.message);
    }
  };

  return (
    <div ref={helpRef} className="relative">
      <button
        onClick={() => {
          setIsHelpOpen((v) => !v);
          setIsSearchOpen(false);
          setIsNotifOpen(false);
          setIsSettingsOpen(false);
        }}
        className={`p-2 rounded-full transition ${isHelpOpen ? "bg-blue-50 text-blue-600" : "hover:text-slate-700 hover:bg-slate-100"}`}
        title={t('help', lang)}
      >
        <HelpCircle className="w-5 h-5" />
      </button>
      {isHelpOpen && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 p-4">
          {helpStatus === "success" ? (
            <div className="py-6 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center animate-bounce">
                <Check className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">{t('support.success', lang)}</h3>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">{t('support.title', lang)}</h3>
              </div>
              
              <select
                value={helpFormData.type}
                onChange={(e) => setHelpFormData({ ...helpFormData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50"
              >
                {['bug_report', 'feedback', 'feature_request', 'password_reset', 'other'].map(type => (
                  <option key={type} value={type}>{t(`support.types.${type}`, lang)}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder={t('support.subject_placeholder', lang)}
                value={helpFormData.subject}
                onChange={(e) => setHelpFormData({ ...helpFormData, subject: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50"
                required
              />

              <textarea
                placeholder={t('support.message_placeholder', lang)}
                value={helpFormData.message}
                onChange={(e) => setHelpFormData({ ...helpFormData, message: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50 resize-none h-20"
                required
              />

              {helpStatus === "error" && (
                <div className="flex items-start gap-2 p-2 rounded bg-red-50 text-[10px] text-red-600 border border-red-100">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <p>{helpErrorMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={helpStatus === "sending"}
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {helpStatus === "sending" ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('support.sending', lang)}
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    {t('support.submit', lang)}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
