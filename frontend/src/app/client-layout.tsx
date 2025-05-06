import LayoutWrapper from '@/components/layout/layoutWrapper';
import { DevTools } from '@/components/DevTools';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LayoutWrapper>{children}</LayoutWrapper>
      <DevTools />
    </>
  );
}
