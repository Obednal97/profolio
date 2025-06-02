import React from 'react';

// Define our own MDXComponents type for compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MDXComponents = {
  [key: string]: React.ComponentType<any>;
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Default HTML elements
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">{children}</h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="text-3xl font-semibold mb-4 text-gray-800 dark:text-gray-100">{children}</h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">{children}</h3>
    ),
    h4: ({ children }: { children: React.ReactNode }) => (
      <h4 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">{children}</h4>
    ),
    h5: ({ children }: { children: React.ReactNode }) => (
      <h5 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">{children}</h5>
    ),
    h6: ({ children }: { children: React.ReactNode }) => (
      <h6 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-100">{children}</h6>
    ),
    p: ({ children }: { children: React.ReactNode }) => (
      <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">{children}</p>
    ),
    ul: ({ children }: { children: React.ReactNode }) => (
      <ul className="mb-4 pl-6 list-disc text-gray-700 dark:text-gray-300">{children}</ul>
    ),
    ol: ({ children }: { children: React.ReactNode }) => (
      <ol className="mb-4 pl-6 list-decimal text-gray-700 dark:text-gray-300">{children}</ol>
    ),
    li: ({ children }: { children: React.ReactNode }) => <li className="mb-2">{children}</li>,
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 italic">
        {children}
      </blockquote>
    ),
    code: ({ children }: { children: React.ReactNode }) => (
      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
        {children}
      </code>
    ),
    pre: ({ children }: { children: React.ReactNode }) => (
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4 text-sm">
        {children}
      </pre>
    ),
    a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
      <a 
        href={href} 
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    strong: ({ children }: { children: React.ReactNode }) => (
      <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
    ),
    em: ({ children }: { children: React.ReactNode }) => <em className="italic">{children}</em>,
    table: ({ children }: { children: React.ReactNode }) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border border-gray-300 dark:border-gray-600">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: { children: React.ReactNode }) => (
      <thead className="bg-gray-50 dark:bg-gray-700">{children}</thead>
    ),
    tbody: ({ children }: { children: React.ReactNode }) => (
      <tbody className="bg-white dark:bg-gray-800">{children}</tbody>
    ),
    tr: ({ children }: { children: React.ReactNode }) => (
      <tr className="border-b border-gray-200 dark:border-gray-600">{children}</tr>
    ),
    th: ({ children }: { children: React.ReactNode }) => (
      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600">
        {children}
      </th>
    ),
    td: ({ children }: { children: React.ReactNode }) => (
      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">
        {children}
      </td>
    ),
    hr: () => <hr className="border-gray-300 dark:border-gray-600 my-8" />,
    
    // Override any components you want to customize
    ...components,
  };
} 