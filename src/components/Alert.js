// components/Alert.js
import React from 'react';
import './Alert.css';

function Alert({ message, type = 'success', onClose }) {
  return (
    <div className={`alert-box ${type}`}>
      <span>{message}</span>
      <button className="close-btn" onClick={onClose}>×</button>
    </div>
  );
}

export default Alert;
