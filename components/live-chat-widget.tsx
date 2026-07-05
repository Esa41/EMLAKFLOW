"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { sendVitrinMessage } from "@/app/actions/chat";

export function LiveChatWidget({ tenantId }: { tenantId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    let sid = sessionStorage.getItem("emlakflow_chat_sid");
    if (!sid) {
      sid = "v_" + Math.random().toString(36).substring(2, 11);
      sessionStorage.setItem("emlakflow_chat_sid", sid);
    }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    
    // Polling every 15 seconds to prevent DB connection limits
    const load = () =>
      fetch(`/api/chat/${sessionId}?t=${tenantId}`)
        .then(res => res.json())
        .then(data => Array.isArray(data) && setMessages(data))
        .catch(err => console.error(err));

    const interval = setInterval(load, 15000);
    load(); // Initial fetch

    return () => clearInterval(interval);
  }, [isOpen, sessionId, tenantId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !name.trim()) return;
    
    // Optimistic UI
    const tempMsg = { id: Date.now(), body, senderName: name, senderId: null, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    
    const textToSend = body;
    setBody("");
    
    await sendVitrinMessage(tenantId, sessionId, name, textToSend);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="flex h-[400px] w-80 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-ink/10">
          <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
            <h3 className="font-bold">Canlı Destek</h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-brand-700 rounded-full p-1 transition-colors">
              <X size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-ink/50 mt-10">Bize bir mesaj gönderin, anında yanıtlayalım.</p>
            ) : (
              messages.map(m => {
                const isAgent = !!m.senderId;
                return (
                  <div key={m.id} className={`flex flex-col ${isAgent ? "items-start" : "items-end"}`}>
                    <span className="text-[10px] text-ink/50 px-1 mb-0.5">{m.senderName || "Ziyaretçi"}</span>
                    <div className={`rounded-xl px-3 py-2 text-sm max-w-[85%] ${isAgent ? "bg-white border border-ink/10 text-ink" : "bg-brand-600 text-white"}`}>
                      {m.body}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-ink/10 bg-white p-3">
            <form onSubmit={handleSend} className="space-y-2">
              <input 
                type="text" 
                placeholder="Adınız Soyadınız" 
                required 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-lg border border-ink/20 px-3 py-2 text-xs focus:border-brand-600 focus:ring-1 focus:outline-none"
              />
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Mesajınız..." 
                  required 
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className="flex-1 rounded-lg border border-ink/20 px-3 py-2 text-xs focus:border-brand-600 focus:ring-1 focus:outline-none"
                />
                <button type="submit" className="flex items-center justify-center rounded-lg bg-brand-600 p-2 text-white hover:bg-brand-700 transition-colors">
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl hover:bg-brand-700 transition-transform hover:scale-105"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
}
