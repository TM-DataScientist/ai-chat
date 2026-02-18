"use client";

import { SessionSummary } from "@/lib/types/session";

interface SidebarProps {
  sessions: SessionSummary[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

export default function Sidebar({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}: SidebarProps) {
  return (
    <aside className="flex w-64 flex-col border-r border-gray-700 bg-gray-900">
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full rounded-md border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
        >
          + 新しいチャット
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto">
        {sessions.map((session) => (
          <div
            key={session._id}
            className={`group flex items-center gap-1 px-3 py-2 cursor-pointer hover:bg-gray-700 transition-colors ${
              session._id === currentSessionId ? "bg-gray-700" : ""
            }`}
            onClick={() => onSelectSession(session._id)}
          >
            <span className="flex-1 truncate text-sm text-gray-300">
              {session.title}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session._id);
              }}
              className="hidden group-hover:block shrink-0 rounded p-1 text-gray-500 hover:text-red-400 transition-colors"
              aria-label="削除"
            >
              ✕
            </button>
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-gray-500">
            チャット履歴がありません
          </p>
        )}
      </nav>
    </aside>
  );
}
