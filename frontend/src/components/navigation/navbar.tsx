import Link from 'next/link';

interface NavigationProps {
  user?: {
    name?: string;
    email?: string;
  };
  unreadNotifications?: number;
  currentPath?: string;
}

export default function Navbar({
  user,
  currentPath = "/",
}: NavigationProps) {
  const navigationLinks = user
    ? [
        { path: "/dashboard", label: "Dashboard", icon: "fa-chart-pie" },
        { path: "/assetManager", label: "Assets", icon: "fa-wallet" },
        { path: "/propertyManager", label: "Properties", icon: "fa-home" },
        { path: "/expenseManager", label: "Expenses", icon: "fa-receipt" },
      ]
    : [
        { path: "/about", label: "About", icon: "fa-info-circle" },
        { path: "/how-it-works", label: "How it works", icon: "fa-lightbulb" },
        { path: "/pricing", label: "Pricing", icon: "fa-tags" },
      ];

  return (
    <nav className="flex items-center space-x-6">
      {navigationLinks.map((link) => (
        <Link
          key={link.path}
          href={link.path}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
            currentPath === link.path
              ? "bg-white/10 text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <i className={`fas ${link.icon}`}></i>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}