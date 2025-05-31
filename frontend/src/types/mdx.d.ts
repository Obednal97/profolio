import { ComponentType } from 'react';

declare module '*.mdx' {
  const MDXComponent: ComponentType<Record<string, unknown>>;
  export default MDXComponent;
} 