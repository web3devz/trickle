"use client"

import { FC, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Props {
  language: string;
  value: string;
}

export const CodeBlock: FC<Props> = ({ language, value }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied'>('idle');

  const handleCopy = async () => {
    try {
      setCopyStatus('copying');
      await navigator.clipboard.writeText(value);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      setCopyStatus('idle');
    }
  };

  return (
    <div className="relative w-full font-mono">
      <div className="absolute left-2 top-2 text-xs text-muted-foreground">
        {language}
      </div>
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 text-xs text-muted-foreground transition-opacity"
        disabled={copyStatus === 'copying'}
      >
        {copyStatus === 'copying' ? 'Copying...' : copyStatus === 'copied' ? 'Copied!' : 'Copy'}
      </button>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "1.5rem 1rem",
          borderRadius: "0.5rem",
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};