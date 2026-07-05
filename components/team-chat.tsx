"use client";

import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { sendTeamMessage } from "@/app/actions/chat";

export function TeamChat({ currentUserId }: { currentUserId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Polling every 15 seconds for team messages to prevent DB limits
    const load = () =>
      fetch(`/api/chat/team`)
        .then(res => res.json())
        .then(data => Array.isArray(data) && setMessages(data))
        .catch(err => console.error(err));

    const interval = setInterval(load, 15000);
    load(); // Initial fetch

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    
    // Optimistic UI
    const tempMsg = { 
      id: Date.now(), 
      body, 
      senderName: "Siz", 
      senderId: currentUserId, 
      createdAt: new Date().toISOString() 
    };
    setMessages(prev => [...prev, tempMsg]);
    
    const formData = new FormData();
    formData.append("body", body);
    setBody("");
    
    await sendTeamMessage(formData);
  }

  return (
    <div className="flex h-[600px] flex-col rounded-xl border border-ink/15 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-ink/15 bg-brand-600 px-4 py-3 text-white">
        <h2 className="font-bold text-sm">Ofis İçi Ekip Sohbeti</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-ink/40 mt-10">Ekibinizle sohbete başlayın.</p>
        ) : (
          messages.map(m => {
            const isMe = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className="text-[10px] text-ink/50 px-1 mb-0.5">{m.senderName}</span>
                <div className={`rounded-xl px-3 py-2 text-sm max-w-[85%] ${isMe ? "bg-brand-600 text-white" : "bg-white border border-ink/10 text-ink"}`}>
                  {m.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-ink/15 bg-white p-3">
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Mesajınız..." 
            required 
            value={body}
            onChange={e => setBody(e.target.value)}
            className="flex-1 rounded-lg border border-ink/20 px-3 py-2 text-sm focus:border-brand-600 focus:ring-1 focus:outline-none"
          />
          <button type="submit" className="flex items-center justify-center rounded-lg bg-brand-600 p-2 text-white hover:bg-brand-700 transition-colors">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
