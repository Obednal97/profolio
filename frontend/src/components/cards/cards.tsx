"use client";

import React from "react";
import clsx from "clsx";

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function Card({ children, onClick, className }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl shadow-md transition-transform transform hover:scale-[1.02] hover:shadow-lg cursor-pointer p-4",
        className
      )}
    >
      {children}
    </div>
  );
}