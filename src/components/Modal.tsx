
import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={`bg-light-bg dark:bg-navy border border-light-border dark:border-dark-border rounded-xl shadow-2xl dark:shadow-teal/10 w-full ${maxWidth} max-h-[90vh] p-6 relative animate-slide-in-up overflow-hidden`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-poppins font-bold text-light-text dark:text-off-white break-words pr-8">{title}</h3>
          <button onClick={onClose} className="absolute top-4 right-4 text-light-text-secondary dark:text-gray-400 hover:text-light-accent dark:hover:text-teal transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Fermer la boîte de dialogue">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto overflow-x-hidden max-h-[calc(90vh-90px)]">{children}</div>
      </div>
    </div>
  );
};

export default Modal;