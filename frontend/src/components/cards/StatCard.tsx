"use client";

import React from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  colorScheme: "green" | "blue" | "purple" | "orange" | "red" | "cyan" | "emerald" | "pink";
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  progressBar?: {
    value: number;
    max: number;
    label?: string;
  };
  dots?: boolean[];
  className?: string;
}

const colorConfig = {
  green: {
    gradient: "from-green-500/20 to-green-600/20",
    border: "border-green-500/30",
    text: "text-green-400",
    iconBg: "bg-green-500/20",
    iconText: "text-green-400",
    progressBg: "bg-gray-700",
    progressFill: "bg-green-400",
    dotActive: "bg-green-400",
    dotInactive: "bg-gray-600",
  },
  blue: {
    gradient: "from-blue-500/20 to-blue-600/20",
    border: "border-blue-500/30",
    text: "text-blue-400",
    iconBg: "bg-blue-500/20",
    iconText: "text-blue-400",
    progressBg: "bg-gray-700",
    progressFill: "bg-blue-400",
    dotActive: "bg-blue-400",
    dotInactive: "bg-gray-600",
  },
  purple: {
    gradient: "from-purple-500/20 to-purple-600/20",
    border: "border-purple-500/30",
    text: "text-purple-400",
    iconBg: "bg-purple-500/20",
    iconText: "text-purple-400",
    progressBg: "bg-gray-700",
    progressFill: "bg-purple-400",
    dotActive: "bg-purple-400",
    dotInactive: "bg-gray-600",
  },
  orange: {
    gradient: "from-orange-500/20 to-orange-600/20",
    border: "border-orange-500/30",
    text: "text-orange-400",
    iconBg: "bg-orange-500/20",
    iconText: "text-orange-400",
    progressBg: "bg-gray-700",
    progressFill: "bg-orange-400",
    dotActive: "bg-orange-400",
    dotInactive: "bg-gray-600",
  },
  red: {
    gradient: "from-red-500/20 to-red-600/20",
    border: "border-red-500/30",
    text: "text-red-400",
    iconBg: "bg-red-500/20",
    iconText: "text-red-400",
    progressBg: "bg-gray-700",
    progressFill: "bg-red-400",
    dotActive: "bg-red-400",
    dotInactive: "bg-gray-600",
  },
  cyan: {
    gradient: "from-cyan-500/20 to-cyan-600/20",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    iconBg: "bg-cyan-500/20",
    iconText: "text-cyan-400",
    progressBg: "bg-gray-700",
    progressFill: "bg-cyan-400",
    dotActive: "bg-cyan-400",
    dotInactive: "bg-gray-600",
  },
  emerald: {
    gradient: "from-emerald-500/20 to-emerald-600/20",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    iconBg: "bg-emerald-500/20",
    iconText: "text-emerald-400",
    progressBg: "bg-gray-700",
    progressFill: "bg-emerald-400",
    dotActive: "bg-emerald-400",
    dotInactive: "bg-gray-600",
  },
  pink: {
    gradient: "from-pink-500/20 to-pink-600/20",
    border: "border-pink-500/30",
    text: "text-pink-400",
    iconBg: "bg-pink-500/20",
    iconText: "text-pink-400",
    progressBg: "bg-gray-700",
    progressFill: "bg-pink-400",
    dotActive: "bg-pink-400",
    dotInactive: "bg-gray-600",
  },
};

export function StatCard({
  title,
  value,
  icon,
  colorScheme,
  trend,
  subtitle,
  progressBar,
  dots,
  className = "",
}: StatCardProps) {
  const config = colorConfig[colorScheme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-br ${config.gradient} backdrop-blur-sm rounded-xl p-6 border ${config.border} ${className}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-3xl font-bold ${config.text} mt-1`}>
            {value}
          </p>

          {/* Optional subtitle */}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}

          {/* Optional dots indicator (for spending intensity etc) */}
          {dots && dots.length > 0 && (
            <div className="flex items-center mt-2">
              <div className="flex space-x-1">
                {dots.map((active, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      active ? config.dotActive : config.dotInactive
                    }`}
                  />
                ))}
              </div>
              {subtitle && (
                <span className="text-xs text-gray-500 ml-2">{subtitle}</span>
              )}
            </div>
          )}

          {/* Optional progress bar */}
          {progressBar && (
            <div className="mt-2">
              <div className="flex items-center">
                <div className={`w-full ${config.progressBg} rounded-full h-1.5`}>
                  <div
                    className={`${config.progressFill} h-1.5 rounded-full transition-all duration-500`}
                    style={{
                      width: `${Math.min(
                        (progressBar.value / progressBar.max) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                {progressBar.label && (
                  <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                    {progressBar.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {progressBar.value} of {progressBar.max}
              </p>
            </div>
          )}

          {/* Optional trend indicator */}
          {trend && (
            <div className="mt-2 flex items-center space-x-2">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  trend.isPositive
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                <i
                  className={`fas fa-arrow-${
                    trend.isPositive ? "up" : "down"
                  } mr-1`}
                ></i>
                {trend.value}
              </span>
            </div>
          )}
        </div>

        {/* Icon */}
        <div className={`p-3 ${config.iconBg} rounded-lg`}>
          <i className={`fas ${icon} ${config.iconText} text-xl`}></i>
        </div>
      </div>
    </motion.div>
  );
}