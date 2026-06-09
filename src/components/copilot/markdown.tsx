import ReactMarkdown from "react-markdown";

// Assistant message body (FR-CP-09): markdown on the panel background,
// styled with brand typography. No raw HTML — model output is untrusted
// (react-markdown skips HTML by default).
export function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p className="my-1 text-sm leading-relaxed">{children}</p>
        ),
        h1: ({ children }) => (
          <h3 className="font-heading mt-3 mb-1 text-base font-semibold">
            {children}
          </h3>
        ),
        h2: ({ children }) => (
          <h4 className="font-heading mt-3 mb-1 text-sm font-semibold">
            {children}
          </h4>
        ),
        h3: ({ children }) => (
          <h5 className="font-heading mt-2 mb-1 text-sm font-semibold">
            {children}
          </h5>
        ),
        ul: ({ children }) => (
          <ul className="my-1 list-disc pl-5 text-sm">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-1 list-decimal pl-5 text-sm">{children}</ol>
        ),
        li: ({ children }) => <li className="my-0.5">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-medium">{children}</strong>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="bg-muted border-border border px-1 font-mono text-[0.8rem]">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="bg-muted border-border my-2 overflow-x-auto border p-2 text-xs [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0">
            {children}
          </pre>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
