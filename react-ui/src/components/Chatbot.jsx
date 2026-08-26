import { useState, useRef, useEffect } from 'react';
import { chatbotAsk } from '../api/travelApi';

const suggestions = ['Who is travelling today?', 'Currently abroad?', 'Returning today?', 'Country breakdown', 'Upcoming travel'];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hi! I'm your Travel Intelligence Assistant. Ask me anything about company travel!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (question) => {
    if (!question.trim()) return;
    const q = question.trim();
    setInput('');
    setMessages(prev => [...prev, { type: 'user', text: q }]);
    setLoading(true);

    try {
      const data = await chatbotAsk(q);
      let answer = data.answer || 'No response received.';
      if (data.data?.length > 0) {
        answer += '\n\n';
        const keys = Object.keys(data.data[0]).filter(k => !['createdAt', 'modifiedAt', 'createdBy', 'modifiedBy'].includes(k));
        const visibleKeys = keys.slice(0, 6);
        data.data.slice(0, 8).forEach((row, i) => {
          const parts = visibleKeys.filter(k => row[k] != null && row[k] !== '').map(k => `${k}: ${row[k]}`);
          answer += `${i + 1}. ${parts.join(' | ')}\n`;
        });
        if (data.data.length > 8) answer += `... and ${data.data.length - 8} more`;
      }
      setMessages(prev => [...prev, { type: 'bot', text: answer }]);
    } catch {
      setMessages(prev => [...prev, { type: 'bot', text: 'Sorry, unable to connect to chatbot server. Make sure it is running on port 5000.' }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition z-50 hover:scale-110">
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 w-96 h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <p className="text-white text-sm font-semibold">Travel Intelligence Bot</p>
                <p className="text-blue-200 text-xs">Ask anything about travel data</p>
              </div>
            </div>
            <button onClick={() => { setMessages([{ type: 'bot', text: 'Chat cleared. Ask me anything!' }]); }}
              className="text-blue-200 hover:text-white text-xs">Clear</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${m.type === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-xl text-sm">Thinking...</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Suggestions */}
          <div className="px-3 py-2 flex gap-1.5 flex-wrap border-t border-gray-100">
            {suggestions.map(s => (
              <button key={s} onClick={() => send(s)}
                className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full hover:bg-blue-100 transition">{s}</button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send(input)}
              placeholder="Ask anything about travel..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            <button onClick={() => send(input)} disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">Send</button>
          </div>
        </div>
      )}
    </>
  );
}
