import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  confirmVariant?: string;
  onConfirm?: () => void;
  children?: React.ReactNode;
  dismissible?: boolean;
  origin?: { x: number; y: number };
}

export const BaseModal: React.FC<BaseModalProps> = ({ isOpen, onClose, children, title, description, dismissible = true, origin }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, dismissible]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (dismissible && modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const originStyle = origin ? {
    originX: origin.x / window.innerWidth,
    originY: origin.y / window.innerHeight,
  } : { originX: 0.5, originY: 0.5 };

  return (
    <AnimatePresence>
      {isOpen && (
        <div onClick={handleBackdropClick} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <motion.div
            ref={modalRef}
            className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-900"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              transformOrigin: `${originStyle.originX * 100}% ${originStyle.originY * 100}%`
            }}
          >
            {title && <h2 className="mb-2 text-lg font-semibold">{title}</h2>}
            {description && <p className="mb-4 text-sm text-muted-foreground">{description}</p>}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
            >
              &times;
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export interface ConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  dismissible?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  onConfirm,
  onCancel,
  dismissible = true,
}) => {
  if (!isOpen) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onCancel} title={title} dismissible={dismissible}>
      <p className="mb-6 text-sm text-muted-foreground">{description}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-md border">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm rounded-md bg-destructive text-white"
        >
          Confirm
        </button>
      </div>
    </BaseModal>
  );
};

export interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  dismissible?: boolean;
  origin?: { x: number; y: number };
}

export const FullScreenModal: React.FC<FullScreenModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  dismissible = true,
  origin,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, dismissible]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (dismissible && modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const originStyle = origin ? {
    originX: origin.x / window.innerWidth,
    originY: origin.y / window.innerHeight,
  } : { originX: 0.5, originY: 0.5 };

  return (
    <AnimatePresence>
      {isOpen && (
        <div onClick={handleBackdropClick} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm">
          <motion.div
            ref={modalRef}
            className="relative h-full w-full bg-white dark:bg-zinc-900 p-6 overflow-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              transformOrigin: `${originStyle.originX * 100}% ${originStyle.originY * 100}%`
            }}
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
            >
              &times;
            </button>
            {title && <h2 className="mb-6 text-xl font-semibold">{title}</h2>}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  onSubmit: () => void;
  children: React.ReactNode;
  dismissible?: boolean;
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  onSubmit,
  children,
  dismissible = true,
}) => {
  if (!isOpen) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title} dismissible={dismissible}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        {children}
        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 text-sm rounded-md bg-primary text-white">
            Save
          </button>
        </div>
      </form>
    </BaseModal>
  );
};