import React, { useCallback, useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { soumissionsService, type SubmissionCreatedDTO } from '../services/publicationsService';
import SubmissionGuidelines from '../components/SubmissionGuidelines';
import { CheckIcon, SubmissionsIcon } from '../components/dashboard/DashboardIcons';
import './submission.css';

const MAX_FILE_SIZE = 12 * 1024 * 1024;
const DOMAIN_OPTIONS = [
  ['genie-informatique', 'computerScience'],
  ['genie-electrique', 'electricalEngineering'],
  ['genie-mecanique', 'mechanicalEngineering'],
  ['genie-des-mines', 'miningAndGeology'],
  ['genie-metallurgie', 'processEngineering'],
  ['genie-civil', 'civilEngineering'],
] as const;

interface SubmissionFormData {
  title: string;
  authors: string;
  domain: string;
  summary: string;
  keywords: string;
}

const emptyForm: SubmissionFormData = {
  title: '',
  authors: '',
  domain: '',
  summary: '',
  keywords: '',
};

const hasSubmissionReferences = (value: unknown): value is SubmissionCreatedDTO => {
  if (!value || typeof value !== 'object') return false;
  const response = value as Partial<SubmissionCreatedDTO>;
  return Number.isInteger(response.id) && Number(response.id) > 0
    && Number.isInteger(response.publicationId) && Number(response.publicationId) > 0
    && typeof response.status === 'string'
    && typeof response.submittedAt === 'string';
};

const SubmissionPage: React.FC = () => {
  const { translations } = useLanguage();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const copy = translations.submission_page;

  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [acceptedWithoutReference, setAcceptedWithoutReference] = useState(false);
  const [formData, setFormData] = useState<SubmissionFormData>(emptyForm);
  const submissionLock = useRef(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/auth');
  }, [authLoading, isAuthenticated, navigate]);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setFileError(null);
    setSubmissionError(null);

    if (fileRejections.length > 0) {
      const rejectedForSize = fileRejections.some(({ errors }) => errors.some(({ code }) => code === 'file-too-large'));
      setFile(null);
      setFileError(rejectedForSize ? copy.upload.error_file_size : copy.upload.error_file_type);
      return;
    }

    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    try {
      const signature = new Uint8Array(await selectedFile.slice(0, 5).arrayBuffer());
      const isPdf = signature.length === 5
        && signature[0] === 0x25
        && signature[1] === 0x50
        && signature[2] === 0x44
        && signature[3] === 0x46
        && signature[4] === 0x2d;

      if (!isPdf) {
        setFile(null);
        setFileError(copy.upload.error_file_content);
        return;
      }

      setFile(selectedFile);
      setFormData((current) => ({
        ...current,
        title: current.title || selectedFile.name.replace(/\.pdf$/i, ''),
      }));
    } catch {
      setFile(null);
      setFileError(copy.upload.error_file_content);
    }
  }, [copy.upload.error_file_content, copy.upload.error_file_size, copy.upload.error_file_type]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: isSubmitting,
    onDragEnter: () => undefined,
    onDragOver: () => undefined,
    onDragLeave: () => undefined,
  });

  const handleFieldChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setSubmissionError(null);
  };

  const errorMessageFor = (error: unknown) => {
    if (isAxiosError(error)) {
      if (error.response?.status === 403) return copy.workspace.accessDenied;
      const serverMessage = error.response?.data?.message;
      if (typeof serverMessage === 'string' && serverMessage.trim()) return serverMessage;
      if (!error.response) return copy.workspace.errorOffline;
    }
    return copy.workspace.errorFallback;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionLock.current) return;

    const title = formData.title.trim();
    const authors = formData.authors.split(',').map((author) => author.trim()).filter(Boolean);
    const summary = formData.summary.trim();
    if (!file || !title || authors.length === 0 || !formData.domain || summary.length < 250 || summary.length > 500) {
      setSubmissionError(summary.length < 250 || summary.length > 500
        ? copy.workspace.summaryLengthError
        : copy.workspace.requiredFields);
      return;
    }

    submissionLock.current = true;
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const response = await soumissionsService.soumettre({
        titre: title,
        resume: summary,
        auteurPrincipal: authors[0],
        coAuteurs: authors.slice(1),
        motsCles: formData.keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean),
        domaineRecherche: formData.domain,
      }, file);

      if (hasSubmissionReferences(response)) {
        setSubmissionId(response.id);
      } else {
        setAcceptedWithoutReference(true);
      }
      setStep(3);
    } catch (error) {
      setSubmissionError(errorMessageFor(error));
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    if (submissionLock.current) return;
    setStep(1);
    setFile(null);
    setFileError(null);
    setSubmissionError(null);
    setSubmissionId(null);
    setAcceptedWithoutReference(false);
    setFormData(emptyForm);
  };

  const selectedDomain = DOMAIN_OPTIONS.find(([value]) => value === formData.domain);
  const selectedDomainLabel = selectedDomain ? copy.metadata.domains[selectedDomain[1]] : '';
  const summaryLength = formData.summary.trim().length;
  const submissionChecklist = [
    { label: copy.upload.title, complete: Boolean(file) },
    { label: copy.workspace.checklistTitle, complete: Boolean(formData.title.trim() && formData.authors.trim()) },
    { label: copy.workspace.checklistDomain, complete: Boolean(formData.domain) },
    { label: copy.workspace.checklistSummary, complete: summaryLength >= 250 && summaryLength <= 500 },
  ];

  if (authLoading) {
    return (
      <div className="submission-page submission-page--loading" role="status">
        <span className="submission-spinner" aria-hidden="true" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="submission-page">
      <div className="submission-content">
        <header className="submission-heading">
          <p className="submission-eyebrow">
            {step === 1 ? copy.workspace.eyebrow : `${copy.workspace.eyebrow} · ${step === 2 ? copy.steps.metadata : copy.steps.submit}`}
          </p>
          <h1>{step === 1 ? copy.workspace.pageTitle : step === 2 ? copy.metadata.title : copy.success.title}</h1>
          <p>{step === 1 ? copy.workspace.pageDescription : step === 2 ? copy.metadata.subtitle : copy.success.message}</p>
        </header>

        <div className="submission-progress">
          <ol className="submission-steps" aria-label={copy.stepsLabel}>
            {Object.entries(copy.steps).map(([key, label], index) => {
              const stepNumber = index + 1;
              const complete = step > stepNumber;
              const active = step === stepNumber;
              return (
                <li key={key} className={active ? 'is-active' : complete ? 'is-complete' : ''} aria-current={active ? 'step' : undefined}>
                  <span className="submission-step-number" aria-hidden="true">
                    {!complete && !active ? stepNumber.toString().padStart(2, '0') : ''}
                  </span>
                  {complete && <CheckIcon className="submission-step-check" />}
                  <span className="submission-step-label">{label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="submission-layout">
          <section className="submission-main">
            <section className="submission-panel" aria-label={copy.workspace.pageTitle}>
              {step === 1 && (
                <section className="submission-step-content" aria-labelledby="submission-upload-title">
                  <div className="submission-section-heading submission-section-heading--upload">
                    <span className="submission-heading-icon" aria-hidden="true"><SubmissionsIcon className="submission-document-icon" /></span>
                    <h2 id="submission-upload-title">{copy.upload.title}</h2>
                    <p>{copy.workspace.uploadFooter}</p>
                  </div>

                  <div
                    {...getRootProps({
                      className: `submission-dropzone${isDragActive ? ' is-dragging' : ''}${file ? ' has-file' : ''}`,
                      'aria-describedby': fileError ? 'submission-file-error' : file ? undefined : 'submission-file-help',
                      'aria-invalid': Boolean(fileError),
                      'aria-label': copy.upload.prompt,
                    })}
                  >
                    <input {...getInputProps()} />
                    <span className="submission-file-mark" aria-hidden="true"><SubmissionsIcon className="submission-document-icon" /></span>
                    {file ? (
                      <>
                        <span className="submission-dropzone-title">{copy.upload.file_selected}</span>
                        <span className="submission-file-name">{file.name}</span>
                        <span className="submission-file-size">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                        <button
                          type="button"
                          className="submission-text-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setFile(null);
                            setFileError(null);
                            setSubmissionError(null);
                          }}
                        >
                          {copy.upload.change_file}
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="submission-dropzone-title">{copy.upload.prompt}</span>
                        <span className="submission-dropzone-help" id="submission-file-help">{copy.upload.subprompt}</span>
                        <span className="submission-file-size">{copy.workspace.maxSize}</span>
                        <span className="submission-choose-button">{copy.workspace.chooseFile}</span>
                      </>
                    )}
                  </div>

                  {fileError && <p className="submission-alert" id="submission-file-error" role="alert">{fileError}</p>}
                  <div className="submission-actions submission-actions--end">
                    <button type="button" className="submission-button submission-button--primary" disabled={!file} onClick={() => setStep(2)}>
                      {copy.buttons.next}
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </section>
              )}

              {step === 2 && (
                <form className="submission-step-content" onSubmit={handleSubmit} noValidate>
                  <div className="submission-section-heading">
                    <h2>{copy.metadata.title}</h2>
                    <p>{copy.metadata.subtitle}</p>
                  </div>

                  <div className="submission-fields">
                    <div className="submission-field submission-field--wide">
                      <label htmlFor="submission-title">{copy.metadata.article_title}</label>
                      <input id="submission-title" name="title" required value={formData.title} onChange={handleFieldChange} autoComplete="off" />
                    </div>
                    <div className="submission-field">
                      <label htmlFor="submission-authors">{copy.metadata.authors}</label>
                      <input id="submission-authors" name="authors" required value={formData.authors} onChange={handleFieldChange} autoComplete="off" />
                      <span className="submission-field-help">{copy.metadata.authorsHelp}</span>
                    </div>
                    <div className="submission-field">
                      <label htmlFor="submission-domain">{copy.metadata.domain}</label>
                      <select id="submission-domain" name="domain" required value={formData.domain} onChange={handleFieldChange}>
                        <option value="">{copy.metadata.select_domain}</option>
                        {DOMAIN_OPTIONS.map(([value, key]) => (
                          <option key={value} value={value}>{copy.metadata.domains[key]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="submission-field submission-field--wide">
                      <label htmlFor="submission-summary">{copy.metadata.summary}</label>
                      <textarea id="submission-summary" name="summary" required minLength={250} maxLength={500} rows={6} value={formData.summary} onChange={handleFieldChange} />
                      <div className="submission-field-footer">
                        <span>{copy.metadata.summaryHelp}</span>
                        <span aria-live="polite">{formData.summary.trim().length}/500</span>
                      </div>
                    </div>
                    <div className="submission-field submission-field--wide">
                      <label htmlFor="submission-keywords">{copy.metadata.keywords}</label>
                      <input id="submission-keywords" name="keywords" value={formData.keywords} onChange={handleFieldChange} autoComplete="off" />
                    </div>
                  </div>

                  {submissionError && <p className="submission-alert" role="alert">{submissionError}</p>}
                  <div className="submission-actions">
                    <button type="button" className="submission-button submission-button--secondary" disabled={isSubmitting} onClick={() => setStep(1)}>
                      <span aria-hidden="true">←</span>
                      {copy.buttons.previous}
                    </button>
                    <button type="submit" className="submission-button submission-button--primary" disabled={isSubmitting}>
                      {isSubmitting && <span className="submission-button-spinner" aria-hidden="true" />}
                      {isSubmitting ? copy.buttons.submitting : copy.buttons.submit}
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <section className="submission-success submission-step-content" aria-labelledby="submission-success-title" role="status">
                  <span className="submission-success-mark" aria-hidden="true">✓</span>
                  <h2 id="submission-success-title">{copy.success.title}</h2>
                  <p>{copy.success.message}</p>
                  {submissionId !== null ? (
                    <p className="submission-reference">{copy.success.reference}: <strong>#{submissionId}</strong></p>
                  ) : acceptedWithoutReference ? (
                    <p className="submission-reference submission-reference--notice">{copy.workspace.errorResponse}</p>
                  ) : null}
                  <div className="submission-actions submission-actions--center">
                    <NavLink to="/dashboard/student" className="submission-button submission-button--primary">
                      {copy.buttons.dashboard}
                      <span aria-hidden="true">→</span>
                    </NavLink>
                    {!acceptedWithoutReference && (
                      <button type="button" className="submission-button submission-button--secondary" onClick={resetForm}>
                        {copy.buttons.submit_another}
                      </button>
                    )}
                  </div>
                </section>
              )}
            </section>
          </section>

          <aside className="submission-aside">
            <section className="submission-aside-section">
              {step === 1 ? (
                <>
                  <p className="submission-aside-eyebrow">{copy.workspace.beforeSendTitle}</p>
                  <h2>{copy.workspace.prepareTitle}</h2>
                  <p className="submission-aside-description">{copy.workspace.prepareDescription}</p>
                  <ol className="submission-guidance-list">
                    {[
                      [copy.workspace.formatTitle, copy.workspace.formatDescription],
                      [copy.workspace.detailsTitle, copy.workspace.detailsDescription],
                      [copy.workspace.summaryTitle, copy.workspace.summaryDescription],
                    ].map(([title, description], index) => (
                      <li key={title}>
                        <span className="submission-guidance-number">{String(index + 1).padStart(2, '0')}</span>
                        <span><strong>{title}</strong><small>{description}</small></span>
                      </li>
                    ))}
                  </ol>
                </>
              ) : step === 2 ? (
                <>
                  <p className="submission-aside-eyebrow">{copy.workspace.submissionEyebrow}</p>
                  <h2>{copy.workspace.beforeSendTitle}</h2>
                  <p className="submission-aside-description">{copy.workspace.beforeSendDescription}</p>
                  <ul className="submission-checklist">
                    {submissionChecklist.map(({ label, complete }, index) => (
                      <li key={label} className={complete ? 'is-complete' : ''}>
                        <span className="submission-check-mark" aria-hidden="true">
                          {complete ? <CheckIcon className="submission-check-icon" /> : String(index + 1).padStart(2, '0')}
                        </span>
                        <span>{label}</span>
                      </li>
                    ))}
                    <li className="submission-aside-detail">
                      <span>{copy.metadata.article_title}</span>
                      <strong>{formData.title.trim() || '—'}</strong>
                    </li>
                    <li className="submission-aside-detail">
                      <span>{copy.metadata.domain}</span>
                      <strong>{selectedDomainLabel || '—'}</strong>
                    </li>
                  </ul>
                  <p className="submission-aside-note">{copy.workspace.asyncNote}</p>
                </>
              ) : (
                <>
                  <p className="submission-aside-eyebrow">{copy.steps.submit}</p>
                  <h2>{copy.success.title}</h2>
                  <p className="submission-aside-description">{copy.success.message}</p>
                  {submissionId !== null && <p className="submission-aside-note">{copy.success.reference}: #{submissionId}</p>}
                </>
              )}
            </section>
          </aside>
        </div>

        <div className="submission-guidelines">
          <SubmissionGuidelines />
        </div>
      </div>
    </div>
  );
};

export default SubmissionPage;
