

import React from 'react';

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  icon: string;
  colorClass: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, colorClass }) => (
  <div className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-blue-500/40 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-lg font-semibold text-white/80">{title}</h3>
      <i className={`fas ${icon} text-gray-500`}></i>
    </div>
    <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

export default MetricCard;