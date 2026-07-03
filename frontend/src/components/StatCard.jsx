import React from 'react';

const StatCard = ({ title, value, icon, colorClass }) => {
  return (
    <div className="card stat-card">
      <div>
        <span className="stat-label">{title}</span>
        <div className="stat-value">{value}</div>
      </div>
      <div className={`stat-icon ${colorClass || 'icon-pink'}`}>
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
