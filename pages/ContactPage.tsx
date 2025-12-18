import React, { useState, FC, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Floating Label Input Component
interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const FloatingLabelInput: FC<FloatingLabelInputProps> = ({ label, id, ...props }) => {
  return (
    <div className="relative">
      <input
        id={id}
        className="block px-3 py-4 w-full text-base text-light-text dark:text-off-white bg-transparent rounded-lg border-2 border-light-border dark:border-dark-border appearance-none focus:outline-none focus:ring-0 focus:border-light-accent dark:focus:border-teal peer"
        placeholder=" "
        {...props}
      />
      <label
        htmlFor={id}
        className="absolute text-base text-light-text-secondary dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-2.5 peer-focus:text-light-accent dark:peer-focus:text-teal peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4"
      >
        {label}
      </label>
    </div>
  );
};

interface FloatingLabelTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
}

const FloatingLabelTextarea: FC<FloatingLabelTextareaProps> = ({ label, id, ...props }) => {
    return (
      <div className="relative">
        <textarea
          id={id}
          className="block px-3 py-4 w-full text-base text-light-text dark:text-off-white bg-transparent rounded-lg border-2 border-light-border dark:border-dark-border appearance-none focus:outline-none focus:ring-0 focus:border-light-accent dark:focus:border-teal peer"
          placeholder=" "
          rows={5}
          {...props}
        />
        <label
          htmlFor={id}
          className="absolute text-base text-light-text-secondary dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-2.5 peer-focus:text-light-accent dark:peer-focus:text-teal peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4"
        >
          {label}
        </label>
      </div>
    );
};


const AnimatedBackground = () => (
    <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-light-accent/10 dark:bg-teal/10 rounded-full animate-glow"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-light-accent/10 dark:bg-teal/10 rounded-full animate-glow" style={{ animationDelay: '2s' }}></div>
    </div>
);

const SuccessMessage: FC<{title: string, message: string}> = ({title, message}) => (
    <div className="text-center p-8 animate-slide-in-up">
         <div className="w-16 h-16 bg-light-accent/10 dark:bg-teal/20 text-light-accent dark:text-teal rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
         </div>
         <h3 className="text-2xl font-poppins font-bold text-light-text dark:text-off-white">{title}</h3>
         <p className="text-light-text-secondary dark:text-gray-300 mt-2">{message}</p>
    </div>
);


const ContactPage: React.FC = () => {
    const { translations } = useLanguage();
    const t = translations.contact_page;

    const [contactSubmitted, setContactSubmitted] = useState(false);

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setContactSubmitted(true);
    };
    
    return (
        <div className="relative min-h-screen overflow-hidden">
            <AnimatedBackground />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <header className="text-center max-w-3xl mx-auto mb-16">
                    <h1 
                        className="text-4xl md:text-6xl font-poppins font-bold text-light-text dark:text-off-white mb-4 animate-slide-in-up"
                        style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
                    >
                        {t.title}
                    </h1>
                    <p 
                        className="text-lg text-light-text-secondary dark:text-gray-300 animate-slide-in-up"
                        style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
                    >
                        {t.subtitle}
                    </p>
                </header>
                
                <div className="max-w-2xl mx-auto">
                    {/* Contact Form */}
                    <div 
                        className="bg-light-bg/60 dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-2xl p-8 backdrop-blur-xl shadow-2xl dark:shadow-teal/10 animate-slide-in-up"
                        style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
                    >
                        {contactSubmitted ? (
                            <SuccessMessage title={t.contact_success_title} message={t.contact_success} />
                        ) : (
                            <form onSubmit={handleContactSubmit} className="space-y-6">
                                <h2 className="text-2xl font-poppins font-bold text-center text-light-text dark:text-off-white">{t.contact_us}</h2>
                                <FloatingLabelInput id="contact_name" label={t.your_name} name="name" type="text" required />
                                <FloatingLabelInput id="contact_email" label={t.your_email} name="email" type="email" required />
                                <FloatingLabelInput id="subject" label={t.subject} name="subject" type="text" required />
                                <FloatingLabelTextarea id="contact_message" label={t.message} name="message" required />
                                <button type="submit" className="w-full bg-light-accent dark:bg-teal text-white dark:text-navy font-bold py-3 px-6 rounded-full text-lg hover:bg-light-accent-hover dark:hover:bg-opacity-80 transition-all duration-300 transform hover:scale-105 shadow-lg">
                                    {t.send_message}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Info supplémentaire - lien vers inscription */}
                    <div 
                        className="mt-8 text-center animate-slide-in-up"
                        style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}
                    >
                        <p className="text-light-text-secondary dark:text-gray-400">
                            {t.join_subtitle}{' '}
                            <a href="/auth" className="text-light-accent dark:text-teal hover:underline font-semibold">
                                {t.join_us}
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;