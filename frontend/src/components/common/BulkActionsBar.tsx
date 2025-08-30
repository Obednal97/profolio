import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface BulkAction {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'secondary';
}

interface BulkActionsBarProps {
  isVisible: boolean;
  selectedCount: number;
  actions: BulkAction[];
  onCancel: () => void;
  children?: React.ReactNode; // For custom controls like category select
}

export function BulkActionsBar({
  isVisible,
  selectedCount,
  actions,
  onCancel,
  children,
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 px-6 py-3"
        >
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedCount} selected
            </span>

            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>

            {children}

            {actions.map((action, index) => (
              <React.Fragment key={index}>
                {index > 0 && children && (
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                )}
                <Button
                  onClick={action.onClick}
                  variant={action.variant === 'danger' ? 'danger' : action.variant === 'secondary' ? 'secondary' : 'primary'}
                  size="sm"
                  icon={action.icon}
                >
                  {action.label}
                </Button>
              </React.Fragment>
            ))}

            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>

            <Button
              onClick={onCancel}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}