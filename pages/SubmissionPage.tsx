import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublications } from '../contexts/PublicationsContext';
import { useAuth } from '../contexts/AuthContext';
import type { ArticleFormData, Publication } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";
import { NavLink } from 'react-router-dom';
import SubmissionGuidelines from '../components/SubmissionGuidelines';
import { soumissionsService } from '../src/services/publicationsService';

const MAX_SIZE = 12 * 1024 * 1024; // 12MB

const SubmissionPage: React.FC = () => {
    const { translations } = useLanguage();
    const { refreshPublications } = usePublications();
    const { isAuthenticated, loading: authLoading, user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<ArticleFormData>({
        submitterName: '', contactEmail: '', title: '', authors: '',
        affiliations: '', domain: '', category: 'Nos travaux',
        summary: '', keywords: '',
    });
    const [generatedImageUrl, setGeneratedImageUrl] = useState('');
    const [publishedArticle, setPublishedArticle] = useState<Publication | null>(null);

    // 🔗 POINT D'INTÉGRATION 5: Protection de la page - Redirection si non connecté
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/auth');
        }
    }, [isAuthenticated, authLoading, navigate]);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
        setFileError(null);
        if (fileRejections.length > 0) {
            if (fileRejections[0].errors[0].code === 'file-too-large') {
                setFileError(translations.submission_page.upload.error_file_size);
            } else {
                setFileError(translations.submission_page.upload.error_file_type);
            }
            return;
        }
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, [translations]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxSize: MAX_SIZE,
        multiple: false,
    });

    // Afficher un loader pendant la vérification de l'authentification
    // IMPORTANT: Ce return doit être APRÈS tous les hooks
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 mx-auto text-light-accent dark:text-teal" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-light-text dark:text-off-white">{translations.submission_page.checking_auth || 'Vérification de l\'authentification...'}</p>
                </div>
            </div>
        );
    }

    const handleNext = async () => {
        if (step === 1 && file) {
            setIsLoading(true);
            try {
                // Simulate some processing time
                await new Promise(res => setTimeout(res, 1000));
                
                // Prefill title from filename
                setFormData(prev => ({ ...prev, title: file.name.replace(/\.pdf$/i, '') }));
                
                // Vérifier si la clé API Gemini est disponible
                const geminiApiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
                
                if (geminiApiKey && geminiApiKey !== 'undefined' && geminiApiKey.length > 10) {
                    // Generate image with AI si la clé est disponible
                    try {
                        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
                        const response = await ai.models.generateContent({
                          model: 'gemini-2.5-flash-image',
                          contents: { parts: [{ text: `Génère une illustration éditoriale (style photoréaliste + touche scientifique) pour un article de recherche en ingénierie intitulé: "${file.name.replace('.pdf', '')}". Palette dominante: #0B1E38, #F5F6FA, accent #00BFA6. Format 1200x800, fond propre.` }] },
                          config: { responseModalities: [Modality.IMAGE] },
                        });
                        for (const part of response.candidates[0].content.parts) {
                            if (part.inlineData) {
                                setGeneratedImageUrl(`data:image/png;base64,${part.inlineData.data}`);
                            }
                        }
                    } catch (aiError) {
                        console.warn("AI image generation failed, using fallback:", aiError);
                        setGeneratedImageUrl(`https://picsum.photos/seed/${encodeURIComponent(file.name)}/600/400`);
                    }
                } else {
                    // Utiliser une image de placeholder si pas de clé API
                    setGeneratedImageUrl(`https://picsum.photos/seed/${encodeURIComponent(file.name)}/600/400`);
                }
                setStep(2);
            } catch(e) {
                console.error("Error during analysis/generation:", e);
                // Use a fallback image if AI generation fails
                setGeneratedImageUrl('https://picsum.photos/seed/fallback/600/400');
                setStep(2);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Préparer les données pour le backend
            const soumissionData = {
                titre: formData.title,
                resume: formData.summary,
                auteurPrincipal: formData.authors.split(',')[0]?.trim() || formData.submitterName,
                emailAuteur: formData.contactEmail,
                coAuteurs: formData.authors.split(',').slice(1).map(a => a.trim()).filter(a => a),
                motsCles: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
                domaineRecherche: formData.domain,
                notes: formData.affiliations || undefined
            };

            // Envoyer au backend avec le fichier PDF
            const response = await soumissionsService.soumettre(soumissionData, file!);
            
            console.log('Soumission réussie:', response);

            // Créer l'objet publication pour l'affichage local
            const newPublication: Publication = {
                id: response.id,
                title: { fr: formData.title, en: formData.title },
                authors: formData.authors.split(',').map(a => a.trim()),
                date: new Date().toISOString(),
                domain: { fr: formData.domain, en: formData.domain },
                summary: { fr: formData.summary, en: formData.summary },
                pdfUrl: response.urlPdf || '',
                imageUrl: generatedImageUrl || 'https://picsum.photos/seed/default/600/400',
                tags: formData.keywords.split(',').map(k => k.trim()),
            };

            setPublishedArticle(newPublication);
            
            // Rafraîchir la liste des publications
            refreshPublications();
            
            setIsLoading(false);
            setStep(3);
            
        } catch (error: any) {
            console.error('Erreur lors de la soumission:', error);
            setIsLoading(false);
            alert(`Erreur lors de la soumission: ${error.response?.data?.message || error.message}`);
        }
    };

    const resetForm = () => {
        setStep(1);
        setFile(null);
        setFileError(null);
        setFormData({
            submitterName: '', contactEmail: '', title: '', authors: '',
            affiliations: '', domain: '', category: 'Nos travaux',
            summary: '', keywords: '',
        });
        setGeneratedImageUrl('');
        setPublishedArticle(null);
    }
    
    const inputClasses = "w-full bg-light-card dark:bg-navy/70 border border-light-border dark:border-dark-border rounded-md shadow-sm py-2 px-3 text-light-text dark:text-off-white focus:outline-none focus:ring-light-accent dark:focus:ring-teal focus:border-light-accent dark:focus:border-teal";

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 animate-slide-in-up">
            <div className="max-w-4xl w-full mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-poppins font-bold text-light-text dark:text-off-white">{translations.submission_page.title}</h1>
                    <p className="text-lg text-light-text-secondary dark:text-gray-300 mt-2">{translations.submission_page.subtitle}</p>
                </div>

                <SubmissionGuidelines />

                <div className="bg-light-bg dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-lg p-8 backdrop-blur-sm shadow-lg dark:shadow-teal/10">
                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between mb-8 border-b border-light-border dark:border-dark-border pb-4">
                        {Object.entries(translations.submission_page.steps).map(([key, value], index) => (
                             <div key={key} className={`flex items-center gap-2 min-w-[180px] sm:min-w-0 ${step > index + 1 ? 'text-light-accent dark:text-teal' : step === index + 1 ? 'text-light-text dark:text-off-white' : 'text-gray-500'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step > index + 1 ? 'bg-light-accent dark:bg-teal text-white dark:text-navy border-light-accent dark:border-teal' : step === index + 1 ? 'border-light-accent dark:border-teal' : 'border-gray-500'}`}>
                                    {step > index + 1 ? '\u2713' : index + 1}
                                </div>
                                <span className="font-semibold text-sm sm:text-base text-center sm:text-left">{value}</span>
                            </div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div>
                            <h2 className="text-2xl font-poppins font-bold text-light-text dark:text-off-white mb-4">{translations.submission_page.upload.title}</h2>
                            <div {...getRootProps()} className={`p-6 sm:p-10 lg:p-12 border-2 border-dashed rounded-lg cursor-pointer text-center transition-colors ${isDragActive ? 'border-light-accent dark:border-teal bg-light-accent/10 dark:bg-teal/10' : 'border-light-border dark:border-teal/30 hover:border-light-accent dark:hover:border-teal'}`}>
                                <input {...getInputProps()} />
                                {isLoading ? (
                                    <div>
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-light-accent dark:border-teal mx-auto"></div>
                                        <p className="mt-4 text-light-text-secondary dark:text-gray-300">{translations.submission_page.upload.analysing}</p>
                                    </div>
                                ) : file ? (
                                    <div>
                                        <p className="text-light-text-secondary dark:text-gray-300">{translations.submission_page.upload.file_selected}</p>
                                        <p className="font-bold text-light-accent dark:text-teal mt-2">{file.name}</p>
                                        <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-sm mt-2 text-gray-500 hover:underline">{translations.submission_page.upload.change_file}</button>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-light-text-secondary dark:text-gray-300">{translations.submission_page.upload.prompt}</p>
                                        <p className="text-sm text-gray-500 mt-2">{translations.submission_page.upload.subprompt}</p>
                                    </>
                                )}
                            </div>
                            {fileError && <p className="text-red-500 text-sm mt-2">{fileError}</p>}
                            <div className="mt-8 flex flex-col sm:flex-row sm:justify-end gap-3 text-right sm:text-left">
                                <button onClick={handleNext} disabled={!file || isLoading} className="bg-light-accent dark:bg-teal text-white dark:text-navy font-bold py-2 px-6 rounded-full hover:bg-light-accent-hover dark:hover:bg-opacity-80 transition-all disabled:bg-gray-500 disabled:cursor-not-allowed">
                                    {translations.submission_page.buttons.next}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {step === 2 && (
                         <form onSubmit={handleSubmit}>
                            <h2 className="text-2xl font-poppins font-bold text-light-text dark:text-off-white mb-2">{translations.submission_page.metadata.title}</h2>
                            <p className="text-sm text-light-text-secondary dark:text-gray-400 mb-6">{translations.submission_page.metadata.subtitle}</p>
                            <div className="space-y-4">
                               <input type="text" name="submitterName" placeholder={translations.submission_page.metadata.submitter_name} required value={formData.submitterName} onChange={handleFormChange} className={inputClasses}/>
                               <input type="email" name="contactEmail" placeholder={translations.submission_page.metadata.contact_email} required value={formData.contactEmail} onChange={handleFormChange} className={inputClasses}/>
                               <hr className="border-light-border dark:border-dark-border"/>
                               <input type="text" name="title" placeholder={translations.submission_page.metadata.article_title} required value={formData.title} onChange={handleFormChange} className={inputClasses}/>
                               <input type="text" name="authors" placeholder={translations.submission_page.metadata.authors} required value={formData.authors} onChange={handleFormChange} className={inputClasses}/>
                               <select name="domain" required value={formData.domain} onChange={handleFormChange} className={inputClasses}>
                                   <option value="">{translations.submission_page.metadata.select_domain}</option>
                                   {Object.entries(translations.submission_page.metadata.domains).map(([key, value]) => <option key={key} value={value}>{value}</option>)}
                               </select>
                                <textarea name="summary" placeholder={translations.submission_page.metadata.summary} required minLength={250} maxLength={500} value={formData.summary} onChange={handleFormChange} rows={4} className={inputClasses}></textarea>
                                <input type="text" name="keywords" placeholder={translations.submission_page.metadata.keywords} value={formData.keywords} onChange={handleFormChange} className={inputClasses}/>
                                {generatedImageUrl && (
                                    <div>
                                        <label className="text-sm font-medium text-light-text-secondary dark:text-gray-300">{translations.submission_page.metadata.thumbnail_preview}</label>
                                        <img src={generatedImageUrl} alt="Generated thumbnail" className="mt-2 rounded-lg w-full max-w-xs object-cover"/>
                                    </div>
                                )}
                            </div>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
                                <button type="button" onClick={() => setStep(1)} className="border border-light-accent dark:border-teal text-light-accent dark:text-teal font-bold py-2 px-6 rounded-full hover:bg-light-accent dark:hover:bg-teal hover:text-white dark:hover:text-navy transition-colors">
                                    {translations.submission_page.buttons.previous}
                                </button>
                                <button type="submit" disabled={isLoading} className="bg-light-accent dark:bg-teal text-white dark:text-navy font-bold py-2 px-6 rounded-full hover:bg-light-accent-hover dark:hover:bg-opacity-80 transition-all disabled:bg-gray-500">
                                    {isLoading ? translations.submission_page.buttons.submitting : translations.submission_page.buttons.submit}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 3 && publishedArticle && (
                        <div className="text-center py-8">
                             <h2 className="text-2xl font-poppins font-bold text-light-accent dark:text-teal mb-4">{translations.submission_page.success.title}</h2>
                             <p className="text-light-text-secondary dark:text-gray-300 mb-4">{translations.submission_page.success.message}</p>
                             <p className="text-sm text-light-text-secondary dark:text-gray-400 mb-6">{translations.submission_page.success.reference}: <span className="font-mono bg-light-card dark:bg-navy-dark px-2 py-1 rounded">GAL-{new Date().getFullYear()}-{publishedArticle.id}</span></p>
                             <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <NavLink to={`/publication/${publishedArticle.id}`} className="bg-light-accent dark:bg-teal text-white dark:text-navy font-bold py-2 px-6 rounded-full hover:bg-light-accent-hover dark:hover:bg-opacity-80 transition-all">
                                    {translations.submission_page.success.view_article}
                                </NavLink>
                                 <button onClick={resetForm} className="border border-light-accent dark:border-teal text-light-accent dark:text-teal font-bold py-2 px-6 rounded-full hover:bg-light-accent dark:hover:bg-teal hover:text-white dark:hover:text-navy transition-colors">
                                    {translations.submission_page.success.submit_another}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubmissionPage;
