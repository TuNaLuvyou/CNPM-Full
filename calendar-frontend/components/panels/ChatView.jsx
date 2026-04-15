import React, { useState } from "react";
import { ChevronLeft, Phone, Send } from "lucide-react";

export default function ChatView({ contact, onBack }) {
  const [messages, setMessages] = useState([
    { id: 'm1', sender: 'them', text: `Chào bạn, tôi là ${contact.name}. Rất vui được kết nối!`, time: '09:00' }
  ]);
  const [inputText, setInputText] = useState("");

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      sender: "me",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className={`w-8 h-8 rounded-full ${contact.color} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
            {contact.avatar}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-none">{contact.name}</p>
            <p className="text-[10px] text-emerald-500 font-medium mt-1">Đang hoạt động</p>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
          <Phone className="w-4 h-4" />
        </button>
      </div>

      {/* Messages body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm
              ${msg.sender === 'me' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
              <p className="leading-relaxed">{msg.text}</p>
              <p className={`text-[10px] mt-1 text-right ${msg.sender === 'me' ? 'text-blue-100' : 'text-slate-400'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(inputText);
          }}
          className="flex items-center gap-2 bg-slate-50 rounded-2xl px-3 py-2 border border-slate-200 focus-within:border-blue-300 focus-within:bg-white transition-all shadow-sm"
        >
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập tin nhắn..."
            autoComplete="off"
            className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400"
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="text-blue-600 hover:text-blue-700 p-1.5 rounded-xl hover:bg-blue-50 transition border border-transparent active:scale-95 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
