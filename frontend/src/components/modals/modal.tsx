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
        <div onClick={handleBackdropClick} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            ref={modalRef}
            className="relative w-full max-w-md mx-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              transformOrigin: `${originStyle.originX * 100}% ${originStyle.originY * 100}%`
            }}
          >
            {title && <h2 className="mb-2 text-lg font-semibold text-white">{title}</h2>}
            {description && <p className="mb-4 text-sm text-gray-400">{description}</p>}
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
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10 shadow-2xl">
        <p className="mb-6 text-sm text-gray-400">{description}</p>
        <div className="flex justify-end gap-2">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-sm rounded-lg border border-white/10 text-gray-300 hover:bg-white/10 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
          >
            Confirm
          </button>
        </div>
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
        <div onClick={handleBackdropClick} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <motion.div
            ref={modalRef}
            className="relative h-full w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 overflow-auto"
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
              className="absolute right-6 top-6 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            {title && <h2 className="mb-6 text-xl font-semibold text-white">{title}</h2>}
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
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10 shadow-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          {children}
          <div className="flex justify-end gap-2 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-sm rounded-lg border border-white/10 text-gray-300 hover:bg-white/10 transition-all duration-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transition-all duration-200"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </BaseModal>
  );
};