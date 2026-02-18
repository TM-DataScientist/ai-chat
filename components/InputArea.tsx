"use client";

import { type FormEvent, type KeyboardEvent, useRef } from "react";

type Props = {
  input: string;
  isLoading: boolean;
  imagePreview: string | null;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onImageSelect: (dataUrl: string | null) => void;
};

export default function InputArea({
  input,
  isLoading,
  imagePreview,
  onInputChange,
  onSubmit,
  onImageSelect,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = textareaRef.current?.closest("form");
      form?.requestSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onImageSelect(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    onImageSelect(null);
  };

  return (
    <div className="border-t border-gray-700 px-4 py-4">
      {imagePreview && (
        <div className="mb-2 flex items-start gap-2">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="添付画像プレビュー"
              className="max-h-32 max-w-xs rounded-lg border border-gray-600 object-contain"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-xs text-gray-200 hover:bg-gray-500"
              aria-label="画像を削除"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-shrink-0 rounded-xl bg-gray-700 px-3 py-3 text-gray-300 transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="画像を添付"
          title="画像を添付 (PNG / JPEG / WebP / GIF)"
        >
          📎
        </button>
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
          disabled={isLoading || (!input.trim() && !imagePreview)}
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
