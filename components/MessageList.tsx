"use client";

import { useEffect, useRef } from "react";
import { type Message } from "./Chat";
import MessageBubble from "./MessageBubble";

type Props = {
  messages: Message[];
  isLoading: boolean;
};

export default function MessageList({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-500">
        <p>メッセージを入力して会話を始めましょう</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          role={message.role as "user" | "assistant"}
          content={message.content}
          imageUrl={message.imageUrl}
        />
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="rounded-2xl bg-gray-700 px-4 py-3">
            <span className="flex gap-1">
              <span className="animate-bounce text-gray-400 [animation-delay:0ms]">●</span>
              <span className="animate-bounce text-gray-400 [animation-delay:150ms]">●</span>
              <span className="animate-bounce text-gray-400 [animation-delay:300ms]">●</span>
            </span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
