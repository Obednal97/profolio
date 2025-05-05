"use client";

import React, { useState } from "react";
// import clsx from "clsx";

interface DropDownOption<T extends string> {
  label: string;
  value: T;
  icon?: string;
}

interface DropDownButtonProps<T extends string> {
  label: string;
  options: DropDownOption<T>[];
  onSelect: (value: T) => void;
  icon?: string;
}

export default function DropDownButton<T extends string>({
  label,
  options,
  onSelect,
  icon,
}: DropDownButtonProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex justify-center items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white text-sm rounded-md hover:bg-white/10 transition-colors"
      >
        {icon && <i className={`fas ${icon}`} />}
        {label}
        <i
          className={`fas fa-chevron-${isOpen ? "up" : "down"} text-xs`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right bg-[#2a2a2a] border border-white/10 rounded-md shadow-lg z-50">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
              >
                {option.icon && (
                  <i className={`fas ${option.icon} mr-2 w-4 text-center`} />
                )}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}