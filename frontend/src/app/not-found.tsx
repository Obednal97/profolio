"use client";

import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";
import ProfolioLogo from "@/components/ui/logo/ProfolioLogo";

// Beautiful animated 404 page that integrates with the layout system
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* 
        ✅ BACKGROUND FIX: Add compatible background for header blur effects
        Uses same pattern as other public pages (pricing, how-it-works)
        Transparent at top to work with header, gradient below
      */}

      {/* Main background - transparent at top for header compatibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent from-20% via-blue-50/30 to-purple-50/50 dark:from-transparent dark:from-20% dark:via-gray-800/20 dark:to-gray-900/40"></div>

      {/* Animated background orbs for visual interest */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-300 rounded-full opacity-25 dark:opacity-15 filter blur-3xl"
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -20, 40, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 22,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
        <motion.div
          className="absolute bottom-20 -left-40 w-96 h-96 bg-gradient-to-tr from-pink-400 to-purple-300 rounded-full opacity-25 dark:opacity-15 filter blur-3xl"
          animate={{
            x: [0, -30, 40, 0],
            y: [0, 40, -30, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 26,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 3,
          }}
        />
      </div>

      {/* Background decoration - lighter accent elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200 dark:bg-blue-800 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-32 h-32 bg-purple-200 dark:bg-purple-800 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-pink-200 dark:bg-pink-800 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 flex justify-center"
        >
          <ProfolioLogo size="xl" showHover={false} />
        </motion.div>

        {/* Animated 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative">
            <h1 className="text-9xl md:text-[12rem] font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-2xl">
              404
            </h1>
            {/* Floating icons */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute -top-8 -left-8 text-4xl opacity-20"
            >
              💼
            </motion.div>
            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 text-3xl opacity-20"
            >
              📊
            </motion.div>
            <motion.div
              animate={{ y: [-5, 15, -5] }}
              transition={{
                repeat: Infinity,
                duration: 3.5,
                ease: "easeInOut",
              }}
              className="absolute -bottom-4 left-1/4 text-2xl opacity-20"
            >
              💰
            </motion.div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="space-y-6"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Oops! Page not found
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            Looks like your portfolio wandered off! The page you&apos;re looking
            for doesn&apos;t exist or has been moved.
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/app/dashboard"
            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <i className="fas fa-home"></i>
              Go to Dashboard
            </span>
          </Link>
          <Link
            href="/"
            className="group px-8 py-4 bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-xl font-semibold border border-gray-200/50 dark:border-gray-600/50 hover:border-blue-300 dark:hover:border-blue-400 transition-all duration-300 hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <i className="fas fa-arrow-left"></i>
              Back to Home
            </span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
