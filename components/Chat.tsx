"use client";

import { useState, useEffect, useCallback } from "react";
import MessageList from "./MessageList";
import InputArea from "./InputArea";
import Sidebar from "./Sidebar";
import { SessionSummary, ChatMessage } from "@/lib/types/session";

export type Message = ChatMessage;

export default function Chat() {
  const model = "gpt-5-nano";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  // セッション一覧を取得
  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/sessions");
    if (res.ok) {
      const data = await res.json();
      setSessions(data);
    }
  }, []);

  // 初期化: セッション一覧を取得し、最新セッションを選択
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/sessions");
      if (!res.ok) return;
      const data: SessionSummary[] = await res.json();
      setSessions(data);
      if (data.length > 0) {
        const latest = data[0];
        setCurrentSessionId(latest._id);
        const detailRes = await fetch(`/api/sessions/${latest._id}`);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          setMessages(detail.messages ?? []);
        }
      }
    })();
  }, []);

  // セッション選択
  const handleSelectSession = async (id: string) => {
    setCurrentSessionId(id);
    const res = await fetch(`/api/sessions/${id}`);
    if (res.ok) {
      const detail = await res.json();
      setMessages(detail.messages ?? []);
    }
  };

  // 新規チャット
  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setPendingImage(null);
  };

  // セッション削除
  const handleDeleteSession = async (id: string) => {
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s._id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
      setMessages([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!input.trim() && !pendingImage) || isLoading) return;

    const imageUrl = pendingImage;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      imageUrl: imageUrl ?? undefined,
    };

    // セッションがなければ作成
    let sessionId = currentSessionId;
    if (!sessionId) {
      const sessionTitle = userMessage.content.slice(0, 50) || "画像付きメッセージ";
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sessionTitle,
          model,
        }),
      });
      if (res.ok) {
        const session = await res.json();
        sessionId = session._id;
        setCurrentSessionId(session._id);
        await fetchSessions();
      }
    }

    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setPendingImage(null);
    setIsLoading(true);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    let assistantContent = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({
            role: m.role,
            content: m.content,
            imageUrl: m.imageUrl,
          })),
          model,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content + chunk }
              : m
          )
        );
      }
    } catch (err) {
      console.error("Chat error:", err);
      assistantContent = "エラーが発生しました。もう一度お試しください。";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: assistantContent } : m
        )
      );
    } finally {
      setIsLoading(false);
    }

    // ストリーミング完了後にメッセージを DB 保存
    if (sessionId) {
      const finalMessages = [
        ...history,
        { id: assistantId, role: "assistant" as const, content: assistantContent },
      ];
      await fetch(`/api/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: finalMessages }),
      });
      // セッション一覧の updatedAt を更新
      await fetchSessions();
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-700 px-6 py-3">
          <h1 className="text-lg font-semibold text-gray-100">AI Chat</h1>
          <span className="text-sm text-gray-400">GPT-5 nano</span>
        </header>
        <MessageList messages={messages} isLoading={isLoading} />
        <InputArea
          input={input}
          isLoading={isLoading}
          imagePreview={pendingImage}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          onImageSelect={setPendingImage}
        />
      </div>
    </div>
  );
}
