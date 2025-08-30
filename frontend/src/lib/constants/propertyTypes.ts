export const propertyTypeConfig = {
  residential: {
    icon: "fa-home",
    color: "#3b82f6",
    gradient: "from-blue-500 to-blue-600",
  },
  commercial: {
    icon: "fa-building",
    color: "#10b981",
    gradient: "from-green-500 to-green-600",
  },
  industrial: {
    icon: "fa-industry",
    color: "#f59e0b",
    gradient: "from-orange-500 to-orange-600",
  },
  land: {
    icon: "fa-mountain",
    color: "#8b5cf6",
    gradient: "from-purple-500 to-purple-600",
  },
  // Additional property types for more granularity
  single_family: { 
    icon: "fa-home", 
    color: "#3b82f6", 
    gradient: "from-blue-500 to-blue-600" 
  },
  condo: { 
    icon: "fa-building", 
    color: "#10b981", 
    gradient: "from-green-500 to-green-600" 
  },
  townhouse: { 
    icon: "fa-city", 
    color: "#8b5cf6", 
    gradient: "from-purple-500 to-purple-600" 
  },
  multi_family: { 
    icon: "fa-building", 
    color: "#f59e0b", 
    gradient: "from-orange-500 to-orange-600" 
  },
};

export const propertyStatusConfig = {
  owned: { 
    icon: "fa-key", 
    color: "#3b82f6",
    label: "Owned"
  },
  rented: { 
    icon: "fa-handshake", 
    color: "#10b981",
    label: "Rented"
  },
  listed: { 
    icon: "fa-tag", 
    color: "#f59e0b",
    label: "Listed"
  },
  under_contract: {
    icon: "fa-file-signature",
    color: "#8b5cf6",
    label: "Under Contract"
  },
  pending: {
    icon: "fa-clock",
    color: "#64748b",
    label: "Pending"
  },
};

export type PropertyType = keyof typeof propertyTypeConfig;
export type PropertyStatus = keyof typeof propertyStatusConfig;