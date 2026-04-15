import React, { useState } from "react";
import { Users, Search, ChevronLeft, MessageCircle, Phone, Mail } from "lucide-react";
import Input from "@/components/ui/Input";
import ChatView from "./ChatView";

const MOCK_CONTACTS = [
  {
    id: 1,
    name: "Nguyễn Văn Minh",
    email: "minh@example.com",
    phone: "0901 234 567",
    unread: 3,
    avatar: "M",
    color: "bg-blue-500",
  },
  {
    id: 2,
    name: "Trần Thị Lan",
    email: "lan@example.com",
    phone: "0912 345 678",
    unread: 0,
    avatar: "L",
    color: "bg-pink-500",
  },
  {
    id: 3,
    name: "Phạm Quốc Hùng",
    email: "hung@example.com",
    phone: "0923 456 789",
    unread: 1,
    avatar: "H",
    color: "bg-emerald-500",
  },
  {
    id: 4,
    name: "Lê Thị Mai",
    email: "mai@example.com",
    phone: "0934 567 890",
    unread: 0,
    avatar: "M",
    color: "bg-purple-500",
  },
  {
    id: 5,
    name: "Đỗ Thanh Tùng",
    email: "tung@example.com",
    phone: "0945 678 901",
    unread: 0,
    avatar: "T",
    color: "bg-orange-500",
  },
];

export default function ContactsPanel() {
  const [contacts, setContacts] = useState(MOCK_CONTACTS);
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [chatContactId, setChatContactId] = useState(null);

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(contactSearch.toLowerCase()),
  );

  const markContactRead = (id) =>
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
    );

  if (chatContactId) {
    const contact = contacts.find((c) => c.id === chatContactId);
    return <ChatView contact={contact} onBack={() => setChatContactId(null)} />;
  }

  if (selectedContact) {
    const contact = contacts.find((c) => c.id === selectedContact);
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedContact(null)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-bold text-slate-700">Chi tiết liên hệ</h2>
          </div>
          <button 
            onClick={() => setChatContactId(contact.id)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center gap-4 py-8 px-4 border-b border-slate-50 bg-slate-50/30">
            <div
              className={`w-20 h-20 rounded-full ${contact.color} flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white relative`}
            >
              {contact.avatar}
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-800">{contact.name}</p>
              <p className="text-xs text-slate-400 font-medium">Làm việc tự do</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setChatContactId(contact.id)}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-md shadow-blue-100 active:scale-95"
              >
                <MessageCircle className="w-4 h-4" /> Nhắn tin
              </button>
              <button className="flex items-center justify-center w-9 h-9 border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 transition active:scale-95">
                <Phone className="w-4 h-4" />
              </button>
              <button className="flex items-center justify-center w-9 h-9 border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 transition active:scale-95">
                <Mail className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="px-6 py-6 space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Thông tin liên hệ</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Email</p>
                    <span className="text-slate-700 font-medium">{contact.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Số điện thoại</p>
                    <span className="text-slate-700 font-medium">{contact.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b border-slate-100 sticky top-0 bg-white z-10">
        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-600" /> Danh bạ
        </h2>
      </div>
      {/* Search */}
      <div className="px-3 py-2 border-b border-slate-50 sticky top-[45px] bg-white z-10">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 focus-within:border-blue-300 focus-within:bg-white transition-all shadow-sm">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            placeholder="Tìm kiếm liên hệ..."
            className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder-slate-300"
          />
        </div>
      </div>
      {/* Contact list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-300 gap-2">
            <Users className="w-10 h-10 opacity-20" />
            <p className="text-xs font-medium">Không tìm thấy liên hệ</p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="group relative flex items-center gap-3 px-4 py-3 hover:bg-slate-50/80 transition cursor-pointer border-b border-slate-50 last:border-0"
              onClick={() => {
                setSelectedContact(contact.id);
                markContactRead(contact.id);
              }}
            >
              <div
                className={`w-10 h-10 rounded-full ${contact.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 relative shadow-sm ring-2 ring-white`}
              >
                 {contact.avatar}
                {contact.unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {contact.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className={`text-sm truncate ${contact.unread > 0 ? "font-bold text-slate-800" : "text-slate-700 font-medium"}`}>
                  {contact.name}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {contact.email}
                </p>
              </div>
              {contact.unread > 0 && (
                <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full" />
              )}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setChatContactId(contact.id); 
                    markContactRead(contact.id);
                  }}
                  className="p-2 text-blue-500 hover:bg-white rounded-lg shadow-sm transition active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
