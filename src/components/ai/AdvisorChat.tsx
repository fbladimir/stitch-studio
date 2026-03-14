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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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

    // Auto-resize textarea back to 1 row
    if (inputRef.current) {
      inputRef.current.style.height = "44px";
    }

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
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to connect to advisor");
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
      const errorMsg =
        err instanceof Error
          ? err.message
          : "I had trouble connecting. Please try again in a moment. ✿";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: errorMsg } : m
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

  // Auto-grow textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "44px";
    el.style.height = Math.min(el.scrollHeight, 112) + "px";
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages — this is the ONLY scrollable area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 flex flex-col gap-3"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-4 pt-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F0C8BB] to-[#B36050] flex items-center justify-center">
              <span className="text-2xl">🪡</span>
            </div>
            <div className="text-center">
              <p className="font-playfair font-bold text-[18px] text-[#3A2418]">
                Your Stitch Advisor
              </p>
              <p className="font-nunito text-[13px] text-[#6B544D] mt-1 max-w-[280px] mx-auto">
                Ask me anything about cross stitch, threads, fabric, techniques, or finishing!
              </p>
            </div>

            {/* Quick question chips */}
            <div className="flex flex-wrap gap-2 justify-center mt-1 max-w-sm">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-3.5 py-2 rounded-2xl bg-white border border-[#E4D6C8] font-nunito text-[12px] text-[#3A2418] active:scale-[0.97] active:bg-[#FDF4F1] transition-all shadow-sm"
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
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#F0C8BB] to-[#B36050] flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <span className="text-[11px]">🪡</span>
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.role === "user"
                  ? "bg-[#B36050] text-white rounded-br-md"
                  : "bg-white border border-[#E4D6C8] text-[#3A2418] rounded-bl-md shadow-sm"
              }`}
            >
              <p
                className={`font-nunito text-[14px] leading-[1.55] whitespace-pre-wrap ${
                  msg.role === "user" ? "text-white" : "text-[#3A2418]"
                }`}
              >
                {msg.content}
                {msg.role === "assistant" && streaming && msg.content === "" && (
                  <span className="inline-flex gap-1 ml-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B36050] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B36050] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B36050] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                )}
                {msg.role === "assistant" &&
                  streaming &&
                  msg === messages[messages.length - 1] &&
                  msg.content !== "" && (
                    <span className="inline-block w-1.5 h-4 bg-[#B36050] animate-pulse ml-0.5 rounded-sm" />
                  )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input area — pinned to bottom, above the bottom nav */}
      <form
        onSubmit={handleSubmit}
        className="flex-shrink-0 border-t border-[#E4D6C8] bg-white/95 backdrop-blur-sm px-4 py-2.5 flex items-end gap-2"
        style={{ paddingBottom: "calc(68px + env(safe-area-inset-bottom, 0px))" }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about stitching..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-[#E4D6C8] bg-[#FAF6F0] px-4 py-2.5 font-nunito text-[14px] text-[#3A2418] placeholder:text-[#9A8578] focus:outline-none focus:border-[#B36050] focus:ring-1 focus:ring-[#B36050]/20 transition-colors"
          style={{ height: 44, maxHeight: 112 }}
        />
        <button
          type="submit"
          disabled={!input.trim() || streaming}
          className="w-11 h-11 rounded-full bg-[#B36050] text-white flex items-center justify-center flex-shrink-0 disabled:opacity-30 active:scale-90 transition-transform shadow-sm"
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
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
