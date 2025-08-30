import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionIcon = "fa-plus",
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`text-center py-12 sm:py-16 px-4 ${className}`}
    >
      <div className="text-gray-500 dark:text-gray-400 text-4xl sm:text-6xl mb-4">
        <i className={`fas ${icon}`}></i>
      </div>
      <h3 className="text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="gradient"
          size="lg"
          icon={actionIcon}
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}