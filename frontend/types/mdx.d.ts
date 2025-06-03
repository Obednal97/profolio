declare module '*.mdx' {
  import { ComponentType } from 'react';
  const MDXComponent: ComponentType<Record<string, unknown>>;
  export default MDXComponent;
} 