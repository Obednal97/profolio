import React from "react";

interface TileProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
}

export const Tile: React.FC<TileProps> = ({ children, className = "", href }) => {
  const classes = `rounded-xl bg-white/10 backdrop-blur p-4 shadow-md hover:shadow-lg hover:scale-[1.01] transition duration-200 ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return <div className={classes}>{children}</div>;
};
