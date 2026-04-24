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

import AddFriendTab from "./contacts/AddFriendTab";
import FriendListTab from "./contacts/FriendListTab";
import InvitationsTab from "./contacts/InvitationsTab";

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

export default function ContactsPanel({ appSettings, currentUser }) {
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
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
      if (!e.isLocalGuard) {
        if (e.message.includes('401')) {
          setError(t('user.login_required', lang));
        } else {
          console.error(e);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [lang]);

  const fetchInvitations = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    try {
      setLoading(true);
      const data = await getInvitations();
      setInvitations(data);
    } catch (e) {
      if (!e.isLocalGuard && !e.message.includes('401')) console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === TABS.CONNECTED) fetchFriends();
    if (activeTab === TABS.INVITATIONS) fetchInvitations();

    // Auto refresh friends list to update unread counts
    const interval = setInterval(() => {
      if (activeTab === TABS.CONNECTED && !chatFriendId) {
        fetchFriends();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab, fetchFriends, fetchInvitations, chatFriendId]);

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
    const conn = friends.find(f => f.id === chatFriendId);
    if (conn) {
      const isSender = conn.sender === currentUser?.id;
      const friendName = isSender ? conn.receiver_name : conn.sender_name;
      const friend = {
        name: friendName, 
        id: conn.id,
        color: "bg-blue-500",
        avatar: friendName?.[0]?.toUpperCase() || "F"
      };
      return <ChatView contact={friend} onBack={() => setChatFriendId(null)} currentUser={currentUser} />;
    }
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
        {!localStorage.getItem('token') ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 px-6 text-center">
              <Users className="w-10 h-10 opacity-20" />
              <p className="text-xs font-bold text-slate-500">{t('user.login_required', lang)}</p>
              <p className="text-[10px] text-slate-400">Bạn cần đăng nhập để tìm kiếm người dùng và quản lý danh bạ.</p>
            </div>
        ) : activeTab === TABS.NOT_CONNECTED ? (
          <AddFriendTab
            searchEmail={searchEmail}
            setSearchEmail={setSearchEmail}
            isSearching={isSearching}
            searchResult={searchResult}
            error={error}
            handleSearch={handleSearch}
            handleConnect={handleConnect}
            requestSent={requestSent}
            lang={lang}
          />
        ) : activeTab === TABS.CONNECTED ? (
          <FriendListTab
            friends={friends}
            currentUser={currentUser}
            setChatFriendId={setChatFriendId}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            handleFriendAction={handleFriendAction}
            menuRef={menuRef}
            lang={lang}
          />
        ) : activeTab === TABS.INVITATIONS ? (
          <InvitationsTab
            invitations={invitations}
            handleInviteAction={handleInviteAction}
            lang={lang}
          />
        ) : null}
      </div>
    </div>
  );
}
