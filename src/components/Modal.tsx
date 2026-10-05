
import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-light-bg dark:bg-navy border border-light-border dark:border-dark-border rounded-lg shadow-2xl dark:shadow-teal/10 w-full max-w-md max-h-[85vh] p-6 relative animate-slide-in-up overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-poppins font-bold text-light-text dark:text-off-white break-words pr-8">{title}</h3>
          <button onClick={onClose} className="absolute top-4 right-4 text-light-text-secondary dark:text-gray-400 hover:text-light-accent dark:hover:text-teal transition-colors flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto overflow-x-hidden max-h-[calc(85vh-80px)]">{children}</div>
      </div>
    </div>
  );
};

export default Modal;