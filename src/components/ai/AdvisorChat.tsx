"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  "What fabric count should I use for a detailed design?",
  "How do I wash a finished cross stitch?",
  "Tips for neat backstitching?",
  "How do I frame a finished piece?",
  "What's the difference between AIDA and linen?",
  "How many strands for 14-count AIDA?",
];

export function AdvisorChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
    };

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    // Build message history for API
    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      abortRef.current = new AbortController();

      const res = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        throw new Error("Failed to connect to advisor");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);

          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: m.content + parsed.text }
                    : m
                )
              );
            }
          } catch {
            // Skip unparseable chunks
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                content:
                  "I had trouble connecting. Please try again in a moment. ✿",
              }
            : m
        )
      );
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-4 pt-8">
            <div className="text-5xl">🪡</div>
            <div className="text-center">
              <p className="font-playfair font-bold text-[18px] text-[#3A2418]">
                Your Stitch Advisor
              </p>
              <p className="font-nunito text-[13px] text-[#896E66] mt-1 max-w-[280px]">
                Ask me anything about cross stitch, threads, fabric, techniques, or finishing!
              </p>
            </div>

            {/* Quick question chips */}
            <div className="flex flex-wrap gap-2 justify-center mt-2 max-w-sm">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-2 rounded-full bg-[#FAF6F0] border border-[#E4D6C8] font-nunito text-[12px] text-[#3A2418] active:scale-[0.97] transition-transform"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-[#B36050] text-white rounded-br-md"
                  : "bg-white border border-[#E4D6C8] text-[#3A2418] rounded-bl-md"
              }`}
            >
              <p
                className={`font-nunito text-[14px] leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user" ? "text-white" : "text-[#3A2418]"
                }`}
              >
                {msg.content}
                {msg.role === "assistant" && streaming && msg.content === "" && (
                  <span className="inline-block w-2 h-4 bg-[#B36050] animate-pulse ml-0.5" />
                )}
                {msg.role === "assistant" &&
                  streaming &&
                  msg === messages[messages.length - 1] &&
                  msg.content !== "" && (
                    <span className="inline-block w-1.5 h-4 bg-[#B36050] animate-pulse ml-0.5" />
                  )}
              </p>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-[#E4D6C8] bg-white px-4 py-3 flex items-end gap-2"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about stitching..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-[#E4D6C8] bg-[#FAF6F0] px-4 py-2.5 font-nunito text-[14px] text-[#3A2418] placeholder:text-[#B6A090] focus:outline-none focus:border-[#B36050] max-h-28"
          style={{ minHeight: 44 }}
        />
        <button
          type="submit"
          disabled={!input.trim() || streaming}
          className="w-11 h-11 rounded-full bg-[#B36050] text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
