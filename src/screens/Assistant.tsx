import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { api } from '../api';
import { Message } from '../types';

export function Assistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'What should I pack in an emergency kit?',
    'Is it safe to travel to Andheri today?',
    'How to handle a power cut safely?',
    'Emergency contacts for my area.',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const newMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    const history = [...messages, newMsg];
    setMessages(history);
    setInput('');
    setError(null);
    setIsTyping(true);

    try {
      const res = await api.chat(history.map(m => ({ role: m.role, content: m.content })));
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: res.text },
      ]);
    } catch {
      setError('Could not reach the assistant. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full pt-4 pb-20 sm:pb-24 animate-in fade-in duration-300">
      <header className="px-4 sm:px-6 py-2 border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">AI Assistant</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
            <div className="w-12 h-12 bg-[var(--surface)] border border-[var(--border)] rounded-full flex items-center justify-center mb-6">
              <span className="text-xl">👋</span>
            </div>
            <h2 className="font-medium mb-2">How can I help you prepare?</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              Ask me anything about weather safety, emergency kits, or local advisories — in any
              language.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="bg-[var(--surface)] text-[var(--text-primary)] text-xs sm:text-sm px-4 py-2.5 rounded-full border border-[var(--border)] hover:border-[var(--text-primary)] transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-[20px] px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-[var(--text-primary)] text-[var(--bg)] rounded-tr-sm'
                      : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-sm'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] rounded-tl-sm px-4 py-3.5 flex gap-1 items-center">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-start">
                <div className="bg-[var(--color-status-red)]/10 border border-[var(--color-status-red)]/30 text-[var(--color-status-red)] rounded-2xl px-4 py-3 text-sm">
                  {error}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="p-4 bg-[var(--bg)] border-t border-[var(--border)] shrink-0 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend(input);
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-full pl-5 pr-12 py-3.5 text-[15px] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
            className="absolute right-2 p-2 bg-[var(--text-primary)] text-[var(--bg)] rounded-full disabled:opacity-50 disabled:bg-[var(--surface)] disabled:text-[var(--text-secondary)] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-[var(--text-secondary)] text-center mt-2 font-medium tracking-wide">
          RESPONDS IN WHATEVER LANGUAGE YOU WRITE IN
        </p>
      </div>
    </div>
  );
}
