"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

type Props = {
  role: "user" | "assistant";
  content: string;
};

export default function MessageBubble({ role, content }: Props) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-100"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <ReactMarkdown
            className="prose-chat"
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              pre: ({ children }) => (
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs">
                  {children}
                </pre>
              ),
              code: ({ className, children, ...props }) => {
                const isBlock = className?.includes("language-");
                return isBlock ? (
                  <code className={className} {...props}>
                    {children}
                  </code>
                ) : (
                  <code
                    className="rounded bg-gray-900 px-1 py-0.5 text-xs font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              a: ({ children, href }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-300"
                >
                  {children}
                </a>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
