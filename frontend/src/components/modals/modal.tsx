import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EnhancedGlassModal, EnhancedGlassModalContent } from "@/components/ui/enhanced-glass/EnhancedGlassModal";

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
  const [headerHeight, setHeaderHeight] = useState(80); // Default header height

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, dismissible]);

  // Prevent body scroll when modal is open and get header height
  useLayoutEffect(() => {
    if (isOpen) {
      // Immediately prevent scrolling before any render
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      // Prevent layout shift from scrollbar removal
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      // Get the actual header height including any banner
      const header = document.querySelector('.pwa-header');
      if (header) {
        const rect = header.getBoundingClientRect();
        setHeaderHeight(rect.bottom);
      }
    } else {
      // Re-enable scrolling
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    
    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

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
    <div 
      onClick={handleBackdropClick} 
      className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-xl flex items-center justify-center px-4 pb-4 sm:px-6 sm:pb-6"
      style={{ 
        paddingTop: `${headerHeight + 20}px`,
        display: isOpen ? 'flex' : 'none'
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl max-h-[calc(100vh-8rem)] overflow-y-auto"
      >
        {title && <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>}
        {description && <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{description}</p>}
        {children}
      </div>
    </div>
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onCancel}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="text-gray-700 dark:text-gray-300">{description}</div>
        <div className="flex justify-end gap-2 mt-6">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
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
        <div onClick={handleBackdropClick} className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm pt-20">
          <motion.div
            ref={modalRef}
            className="relative h-full w-full bg-white dark:bg-[#101828] p-6 overflow-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              transformOrigin: `${originStyle.originX * 100}% ${originStyle.originY * 100}%`
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
              <button
                onClick={onClose}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="text-gray-700 dark:text-gray-300">{children}</div>
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          <div className="text-gray-700 dark:text-gray-300">{children}</div>
          <div className="flex justify-end gap-2 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
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