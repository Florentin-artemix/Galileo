import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const AccordionItem: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onClick: () => void; }> = ({ title, children, isOpen, onClick }) => {
    return (
        <div className="border-b border-light-border dark:border-dark-border last:border-b-0">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center py-4 text-left font-poppins font-semibold text-lg text-light-text dark:text-off-white"
                aria-expanded={isOpen}
            >
                <span>{title}</span>
                <svg className={`w-6 h-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-light-accent dark:text-teal' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                 <div className="overflow-hidden">
                    <div className="py-4 prose max-w-none text-light-text-secondary dark:text-gray-300 prose-strong:text-light-text dark:prose-strong:text-off-white">
                        {children}
                    </div>
                 </div>
            </div>
        </div>
    );
};

const SubmissionGuidelines: React.FC = () => {
    const { translations } = useLanguage();
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    // FIX: Destructure title from the rest of the guidelines to ensure correct typing.
    const { title, ...guidelineItems } = translations.submission_page.guidelines;
    const guidelines = Object.values(guidelineItems);

    return (
        <div className="mb-12">
            <h2 className="text-3xl font-poppins font-bold text-light-text dark:text-off-white mb-6 text-center">
                {title}
            </h2>
            <div className="bg-light-card dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-lg p-4 md:p-8">
                {guidelines.map((item, index) => (
                    <AccordionItem
                        key={index}
                        title={item.title}
                        isOpen={openIndex === index}
                        onClick={() => handleToggle(index)}
                    >
                        {item.content}
                    </AccordionItem>
                ))}
            </div>
        </div>
    );
};

export default SubmissionGuidelines;