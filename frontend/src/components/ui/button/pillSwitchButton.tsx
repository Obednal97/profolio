

"use client";

import React from "react";
import clsx from "clsx";

interface PillSwitchButtonProps<T extends string> {
    options: T[];
    value: T;
    onChange: (newValue: T) => void;
    className?: string;
  }

export default function PillSwitchButton<T extends string>({
    options,
    value,
    onChange,
    className,
  }: PillSwitchButtonProps<T>) {
    return (
      <div className={clsx("inline-flex bg-white/5 border border-white/10 rounded-full p-1", className)}>
        {options.map((option) => {
          const isActive = option === value;
          return (
            <button
              key={option}
              onClick={() => onChange(option)}
              className={clsx(
                "px-4 py-1 text-sm rounded-full transition-all font-medium",
                isActive
                  ? "bg-green-500 text-black shadow-[0_0_6px_#00ff88]"
                  : "text-white/60 hover:text-white"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }