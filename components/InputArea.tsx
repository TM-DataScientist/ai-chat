"use client";

import { type FormEvent, type KeyboardEvent, useRef } from "react";

type Props = {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export default function InputArea({
  input,
  isLoading,
  onInputChange,
  onSubmit,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = textareaRef.current?.closest("form");
      form?.requestSubmit();
    }
  };

  return (
    <div className="border-t border-gray-700 px-4 py-4">
      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="メッセージを入力… (Shift+Enter で改行)"
          rows={1}
          className="flex-1 resize-none rounded-xl bg-gray-700 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          style={{ maxHeight: "160px", overflowY: "auto" }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          送信
        </button>
      </form>
      <p className="mt-1.5 text-center text-xs text-gray-600">
        Enter で送信 / Shift+Enter で改行
      </p>
    </div>
  );
}
