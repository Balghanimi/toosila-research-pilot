import React, { useState, useEffect } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import Login from './Login';
// DISABLED: Email registration disabled — users register via phone OTP at /login
// TODO: To re-enable email registration, uncomment the import below and restore the mode toggle logic
// import Register from './Register';

export default function AuthModal({ isOpen, onClose, initialMode: _initialMode = 'login' }) {
  // DISABLED: Email registration — mode is always 'login' now
  // TODO: To re-enable, restore: const [mode, setMode] = useState(initialMode);
  const [mode] = useState('login');
  const modalRef = useFocusTrap(isOpen);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // DISABLED: Email registration — switch to register now does nothing in the modal
  // Users are redirected to /login (phone OTP page) from within Login.js
  // const handleSwitchToRegister = () => setMode('register');
  // const handleSwitchToLogin = () => setMode('login');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px 20px 100px 20px',
        backdropFilter: 'blur(4px)',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={mode === 'login' ? 'login-title' : 'register-title'}
        style={{
          width: '100%',
          maxWidth: '440px',
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto',
          animation: 'fadeInScale 0.3s ease-out',
          transformOrigin: 'center',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* DISABLED: Email registration — always show Login, never Register */}
        {/* TODO: To re-enable, restore the mode === 'login' ternary with Register */}
        <Login onClose={onClose} />
        {/* Original code:
        {mode === 'login' ? (
          <Login onSwitchToRegister={handleSwitchToRegister} onClose={onClose} />
        ) : (
          <Register onSwitchToLogin={handleSwitchToLogin} onClose={onClose} />
        )}
        */}
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
