import { useEffect } from 'react';
import './Toast.css';

const TYPE_CLASS = {
  success: 'alert-success',
  error:   'alert-danger',
  info:    'alert-info',
};

function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="toast-container">
      <div className={`alert ${TYPE_CLASS[type] ?? 'alert-info'} d-flex justify-content-between align-items-start mb-0`} role="alert">
        <span>{message}</span>
        <button
          type="button"
          className="btn-close ms-3 mt-1"
          aria-label="Close"
          onClick={onClose}
        />
      </div>
    </div>
  );
}

export default Toast;
