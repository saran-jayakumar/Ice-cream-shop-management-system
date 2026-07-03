import React from 'react';

const Spinner = ({ show }) => {
  if (!show) return null;
  return (
    <div className="spinner-overlay" id="loading-spinner">
      <div className="spinner"></div>
    </div>
  );
};

export default Spinner;
