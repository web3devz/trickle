import React from "react";
import ReactMarkdown, { Options } from "react-markdown";
import { CodeBlock } from "./code-block";

export const MemoizedReactMarkdown: React.FC<Options> = React.memo(
  ({ ...props }) => (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        {...props}
        components={{
          p: ({ children }) => (
            <p className="mb-4 leading-7 text-gray-700 dark:text-gray-300">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-100">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-gray-200">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 text-xl font-medium text-gray-800 dark:text-gray-200">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 ml-6 list-disc space-y-2 text-gray-700 dark:text-gray-300">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-6 list-decimal space-y-2 text-gray-700 dark:text-gray-300">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-6">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-200 pl-4 italic text-gray-600 dark:text-gray-400">{children}</blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-blue-600 hover:underline dark:text-blue-400">{children}</a>
          ),
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";

            return language ? (
              <div className="my-4">
                <CodeBlock language={language} value={String(children).replace(/\n$/, "")} />
              </div>
            ) : (
              <code className="rounded-md bg-gray-100 px-2 py-1 text-sm font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-200" {...props}>
                {children}
              </code>
            );
          },
          hr: () => <hr className="my-6 border-t border-gray-200 dark:border-gray-700" />,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{children}</td>
          ),
        }}
      />
    </div>
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);