import React, { useState, useEffect, useCallback, useRef } from "react";
import { Users, Search, ChevronLeft, MessageCircle, Phone, Mail, Loader2, UserPlus, Check, X, Inbox, MoreVertical, Trash2, Ban, Pin, PinOff } from "lucide-react";
import ChatView from "./ChatView";
import { 
  getFriends, 
  searchUserByEmail, 
  sendConnectionRequest, 
  getInvitations, 
  acceptInvitation, 
  declineInvitation,
  blockConnection,
  togglePinConnection
} from "@/lib/api";
import { t } from "@/lib/i18n";

const AVATAR_COLORS = [
  "bg-blue-500", "bg-pink-500", "bg-emerald-500",
  "bg-purple-500", "bg-orange-500", "bg-cyan-500", "bg-rose-500",
];

function getAvatarColor(id) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length] || "bg-slate-400";
}

const TABS = {
  NOT_CONNECTED: 'not_connected',
  CONNECTED: 'connected',
  INVITATIONS: 'invitations'
};

export default function ContactsPanel({ appSettings }) {
  const lang = appSettings?.language || "vi";
  const [activeTab, setActiveTab] = useState(TABS.CONNECTED);
  
  // Data states
  const [friends, setFriends] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // UI state
  const [chatFriendId, setChatFriendId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // ── Helpers ──
  const normalizeUser = (u) => ({
    ...u,
    id: u.id,
    name: u.first_name || u.username || u.name || "Unknown",
    email: u.email,
    avatar: (u.first_name?.[0] || u.username?.[0] || "?").toUpperCase(),
    color: getAvatarColor(u.id),
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Load Data ──
  const fetchFriends = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await getFriends();
      setFriends(data); 
      setError(null);
    } catch (e) {
      if (e.message.includes('401')) {
        setError(t('user.login_required', lang));
      } else {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  }, [lang]);

  const fetchInvitations = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) return;

    try {
      setLoading(true);
      const data = await getInvitations();
      setInvitations(data);
    } catch (e) {
      if (!e.message.includes('401')) console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === TABS.CONNECTED) fetchFriends();
    if (activeTab === TABS.INVITATIONS) fetchInvitations();
  }, [activeTab, fetchFriends, fetchInvitations]);

  // ── Actions ──
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setIsSearching(true);
    setError(null);
    setSearchResult(null);
    setRequestSent(false);
    try {
      const user = await searchUserByEmail(searchEmail);
      setSearchResult(normalizeUser(user));
    } catch (e) {
      setError(t('contacts_panel.no_results', lang));
    } finally {
      setIsSearching(false);
    }
  };

  const handleConnect = async (userId) => {
    try {
      await sendConnectionRequest(userId);
      setRequestSent(true);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleInviteAction = async (id, status) => {
    try {
      if (status === 'accept') await acceptInvitation(id);
      else await declineInvitation(id);
      fetchInvitations();
      if (status === 'accept') fetchFriends();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleFriendAction = async (id, action) => {
    try {
      if (action === 'unfriend') await declineInvitation(id);
      else if (action === 'block') await blockConnection(id);
      else if (action === 'pin') await togglePinConnection(id);
      
      setOpenMenuId(null);
      fetchFriends();
    } catch (e) {
      alert(e.message);
    }
  };

  // ── Render Views ──
  
  if (chatFriendId) {
    const friendConn = friends.find(f => f.id === chatFriendId);
    const friend = {
      name: friendConn.sender_name, 
      id: friendConn.id,
      color: "bg-blue-500",
      avatar: friendConn.sender_name?.[0]?.toUpperCase() || "F"
    };
    return <ChatView contact={friend} onBack={() => setChatFriendId(null)} />;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-white z-10">
        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-emerald-600" /> {t('contacts_panel.title', lang)}
        </h2>
        
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {Object.values(TABS).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === tab 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t(`contacts_panel.tabs.${tab}`, lang)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === TABS.NOT_CONNECTED && (
          <div className="p-4 space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 focus-within:border-blue-300 focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder={t('contacts_panel.search_user_placeholder', lang)}
                  className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder-slate-300"
                />
              </div>
              <button 
                type="submit"
                disabled={isSearching}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:bg-slate-300"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : t('search', lang)}
              </button>
            </form>

            {searchResult && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${searchResult.color} flex items-center justify-center text-white text-lg font-bold shadow-sm ring-2 ring-white`}>
                    {searchResult.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{searchResult.name}</p>
                    <p className="text-xs text-slate-400 truncate">{searchResult.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleConnect(searchResult.id)}
                  disabled={requestSent}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                    requestSent 
                    ? "bg-emerald-50 text-emerald-600 cursor-default border border-emerald-100" 
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  }`}
                >
                  {requestSent ? <Check className="w-3 h-3" /> : <UserPlus className="w-3.5 h-3.5" />}
                  {requestSent ? t('contacts_panel.request_sent', lang) : t('contacts_panel.connect_btn', lang)}
                </button>
              </div>
            )}

            {error && <p className="text-xs text-center text-red-500 py-4">{error}</p>}
            
            {!searchResult && !isSearching && !error && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2 opacity-60">
                <Search className="w-10 h-10" />
                <p className="text-xs font-medium">{t('contacts_panel.search_user_placeholder', lang)}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === TABS.CONNECTED && (
          <div className="divide-y divide-slate-50">
            {friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2">
                <Users className="w-10 h-10 opacity-20" />
                <p className="text-xs font-medium">{t('contacts_panel.no_contacts', lang)}</p>
              </div>
            ) : (
              friends.map((conn) => (
                <div key={conn.id} className="group relative flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition">
                  {conn.is_pinned && (
                    <div className="absolute top-2 right-2">
                       <Pin className="w-2.5 h-2.5 text-blue-500 fill-blue-500" />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {conn.sender_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{conn.sender_name}</p>
                    <p className="text-xs text-slate-400 truncate">{conn.sender_email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setChatFriendId(conn.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition shadow-sm bg-white border border-slate-100"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === conn.id ? null : conn.id)}
                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {openMenuId === conn.id && (
                        <div 
                          ref={menuRef}
                          className="absolute right-0 mt-2 w-40 bg-white border border-slate-100 rounded-xl shadow-xl z-20 py-1 overflow-hidden"
                        >
                          <button 
                            onClick={() => handleFriendAction(conn.id, 'pin')}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 transition"
                          >
                            {conn.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                            {conn.is_pinned ? t('contacts_panel.unpin', lang) : t('contacts_panel.pin', lang)}
                          </button>
                          <button 
                            onClick={() => handleFriendAction(conn.id, 'unfriend')}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t('contacts_panel.unfriend', lang)}
                          </button>
                          <button 
                            onClick={() => handleFriendAction(conn.id, 'block')}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-800 hover:bg-slate-100 transition border-t border-slate-50"
                          >
                            <Ban className="w-3.5 h-3.5 text-slate-400" />
                            {t('contacts_panel.block', lang)}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === TABS.INVITATIONS && (
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
        )}
      </div>
    </div>
  );
}
