import { useCallback, useState } from "react";

interface Origin {
  x: number;
  y: number;
}

export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [origin, setOrigin] = useState<Origin | undefined>();

  const open = useCallback((e?: React.MouseEvent) => {
    if (e) {
      setOrigin({ x: e.clientX, y: e.clientY });
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    origin,
    open,
    close,
  };
};