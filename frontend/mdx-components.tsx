import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Default HTML elements
    h1: ({ children }) => <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl font-semibold mb-4 text-gray-800 dark:text-gray-100">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">{children}</h3>,
    h4: ({ children }) => <h4 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">{children}</h4>,
    h5: ({ children }) => <h5 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">{children}</h5>,
    h6: ({ children }) => <h6 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-100">{children}</h6>,
    p: ({ children }) => <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="mb-4 pl-6 list-disc text-gray-700 dark:text-gray-300">{children}</ul>,
    ol: ({ children }) => <ol className="mb-4 pl-6 list-decimal text-gray-700 dark:text-gray-300">{children}</ol>,
    li: ({ children }) => <li className="mb-2">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 italic">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4 text-sm">
        {children}
      </pre>
    ),
    a: ({ href, children }) => (
      <a 
        href={href} 
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border border-gray-300 dark:border-gray-600">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-gray-50 dark:bg-gray-700">{children}</thead>,
    tbody: ({ children }) => <tbody className="bg-white dark:bg-gray-800">{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-gray-200 dark:border-gray-600">{children}</tr>,
    th: ({ children }) => (
      <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">
        {children}
      </td>
    ),
    hr: () => <hr className="border-gray-300 dark:border-gray-600 my-8" />,
    
    // Override any components you want to customize
    ...components,
  };
} 