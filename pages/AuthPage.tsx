import React, { useState, FC, FormEvent, TextareaHTMLAttributes } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { authService } from '../src/services/authService';

// Floating Label Input Component
interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

const FloatingLabelInput: FC<FloatingLabelInputProps> = ({ label, id, error, ...props }) => {
  return (
    <div className="relative">
      <input
        id={id}
        className={`block px-3 py-4 w-full text-base text-light-text dark:text-off-white bg-transparent rounded-lg border-2 ${
          error ? 'border-red-500' : 'border-light-border dark:border-dark-border'
        } appearance-none focus:outline-none focus:ring-0 focus:border-light-accent dark:focus:border-teal peer`}
        placeholder=" "
        {...props}
      />
      <label
        htmlFor={id}
        className={`absolute text-base ${
          error ? 'text-red-500' : 'text-light-text-secondary dark:text-gray-400'
        } duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-2.5 peer-focus:text-light-accent dark:peer-focus:text-teal peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4`}
      >
        {label}
      </label>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// Floating Label Textarea Component
interface FloatingLabelTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
  error?: string;
}

const FloatingLabelTextarea: FC<FloatingLabelTextareaProps> = ({ label, id, error, ...props }) => {
  return (
    <div className="relative">
      <textarea
        id={id}
        className={`block px-3 py-4 w-full text-base text-light-text dark:text-off-white bg-transparent rounded-lg border-2 ${
          error ? 'border-red-500' : 'border-light-border dark:border-dark-border'
        } appearance-none focus:outline-none focus:ring-0 focus:border-light-accent dark:focus:border-teal peer`}
        placeholder=" "
        rows={4}
        {...props}
      />
      <label
        htmlFor={id}
        className={`absolute text-base ${
          error ? 'text-red-500' : 'text-light-text-secondary dark:text-gray-400'
        } duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-2.5 peer-focus:text-light-accent dark:peer-focus:text-teal peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4`}
      >
        {label}
      </label>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

const AnimatedBackground = () => (
  <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
    <div className="absolute -top-40 -left-40 w-96 h-96 bg-light-accent/10 dark:bg-teal/10 rounded-full animate-glow"></div>
    <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-light-accent/10 dark:bg-teal/10 rounded-full animate-glow" style={{ animationDelay: '2s' }}></div>
  </div>
);

const AuthPage: React.FC = () => {
  const { translations } = useLanguage();
  const t = translations.auth_page;
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [program, setProgram] = useState('');
  const [motivation, setMotivation] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'STAFF' | 'ADMIN' | 'VIEWER'>('STUDENT');

  const validateForm = (): boolean => {
    setError('');
    
    if (!email || !password) {
      setError(t.error_fields_required);
      return false;
    }

    if (!isLogin) {
      if (!name) {
        setError(t.error_name_required);
        return false;
      }
      if (!program) {
        setError(t.error_program_required);
        return false;
      }
      if (!motivation) {
        setError(t.error_motivation_required);
        return false;
      }
      if (password !== confirmPassword) {
        setError(t.error_password_mismatch);
        return false;
      }
      if (password.length < 6) {
        setError(t.error_password_length);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // 🔗 POINT D'INTÉGRATION 1: Login avec Firebase
        await authService.login(email, password);
        
        // Rediriger vers le dashboard approprié selon le rôle
        const userRole = await authService.getCurrentUserRole();
        
        // Forcer un rechargement complet pour que AuthContext récupère le rôle
        const dashboardUrl = (userRole === 'ADMIN' || userRole === 'STAFF') ? '/#/dashboard/admin' :
                            userRole === 'STUDENT' ? '/#/dashboard/student' :
                            '/#/dashboard/viewer';
        
        window.location.href = dashboardUrl;
      } else {
        // 🔗 POINT D'INTÉGRATION 2: Inscription avec Firebase + rôle
        // Le rôle est passé à signup() et stocké dans localStorage
        await authService.signup(email, password, role, {
          displayName: name,
          program,
          motivation
        });
        
        console.log('Inscription réussie avec rôle:', role);
        
        // Rediriger vers le dashboard approprié selon le rôle choisi
        const dashboardUrl = role === 'ADMIN' ? '/#/dashboard/admin' :
                            role === 'STAFF' ? '/#/dashboard/staff' :
                            role === 'STUDENT' ? '/#/dashboard/student' :
                            '/#/dashboard/viewer';
        
        // Forcer un rechargement complet pour que AuthContext récupère le rôle
        window.location.href = dashboardUrl;
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      
      // Gestion des erreurs Firebase
      if (err.code === 'auth/email-already-in-use') {
        setError(t.error_email_exists);
      } else if (err.code === 'auth/invalid-email') {
        setError(t.error_invalid_email);
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError(t.error_invalid_credentials);
      } else if (err.code === 'auth/weak-password') {
        setError(t.error_weak_password);
      } else {
        setError(t.error_generic);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setShowResetPassword(false);
    setResetEmailSent(false);
    setError('');
    setSuccessMessage('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setProgram('');
    setMotivation('');
    setRole('STUDENT');
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError(t.error_email_required || 'Veuillez entrer votre adresse email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.sendPasswordReset(email);
      setResetEmailSent(true);
      setSuccessMessage(t.reset_email_sent || 'Un email de réinitialisation a été envoyé à votre adresse.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setError(t.error_user_not_found || 'Aucun compte trouvé avec cette adresse email.');
      } else if (err.code === 'auth/invalid-email') {
        setError(t.error_invalid_email || 'Adresse email invalide.');
      } else {
        setError(t.error_generic || 'Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const showResetForm = () => {
    setShowResetPassword(true);
    setResetEmailSent(false);
    setError('');
    setSuccessMessage('');
  };

  const backToLogin = () => {
    setShowResetPassword(false);
    setResetEmailSent(false);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-md mx-auto">
          <header className="text-center mb-8">
            <h1 
              className="text-4xl md:text-5xl font-poppins font-bold text-light-text dark:text-off-white mb-4 animate-slide-in-up"
              style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
            >
              {showResetPassword 
                ? (t.reset_password_title || 'Réinitialiser le mot de passe')
                : (isLogin ? t.login_title : t.signup_title)}
            </h1>
            <p 
              className="text-lg text-light-text-secondary dark:text-gray-300 animate-slide-in-up"
              style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
            >
              {showResetPassword 
                ? (t.reset_password_subtitle || 'Entrez votre email pour recevoir un lien de réinitialisation')
                : (isLogin ? t.login_subtitle : t.signup_subtitle)}
            </p>
            {!isLogin && (
              <p 
                className="mt-2 text-sm text-amber-600 dark:text-amber-400 animate-slide-in-up"
                style={{ animationDelay: '250ms', animationFillMode: 'backwards' }}
              >
                {t.pending_approval}
              </p>
            )}
          </header>

          <div 
            className="bg-light-bg/60 dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-2xl p-8 backdrop-blur-xl shadow-2xl dark:shadow-teal/10 animate-slide-in-up"
            style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
          >
            {/* Formulaire de réinitialisation du mot de passe */}
            {showResetPassword ? (
              <div className="space-y-6">
                {resetEmailSent ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      {successMessage}
                    </p>
                    <p className="text-sm text-light-text-secondary dark:text-gray-400">
                      {t.check_email_instructions || 'Vérifiez votre boîte de réception et suivez les instructions pour créer un nouveau mot de passe.'}
                    </p>
                    <button
                      type="button"
                      onClick={backToLogin}
                      className="mt-4 text-light-accent dark:text-teal hover:underline font-medium"
                    >
                      {t.back_to_login || '← Retour à la connexion'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <FloatingLabelInput
                      id="reset-email"
                      label={t.email_label}
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />

                    {error && (
                      <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-light-accent dark:bg-teal text-white dark:text-navy font-bold py-3 px-6 rounded-full text-lg hover:bg-light-accent-hover dark:hover:bg-opacity-80 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t.loading}
                        </span>
                      ) : (
                        t.send_reset_link || 'Envoyer le lien de réinitialisation'
                      )}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={backToLogin}
                        className="text-light-accent dark:text-teal hover:underline"
                      >
                        {t.back_to_login || '← Retour à la connexion'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom complet (seulement pour inscription) */}
              {!isLogin && (
                <FloatingLabelInput
                  id="name"
                  label={t.name_label}
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}

              {/* Email */}
              <FloatingLabelInput
                id="email"
                label={t.email_label}
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {/* Mot de passe */}
              <FloatingLabelInput
                id="password"
                label={t.password_label}
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {/* Lien mot de passe oublié (uniquement pour connexion) */}
              {isLogin && (
                <div className="text-right -mt-2">
                  <button
                    type="button"
                    onClick={showResetForm}
                    className="text-sm text-light-accent dark:text-teal hover:underline"
                  >
                    {t.forgot_password || 'Mot de passe oublié ?'}
                  </button>
                </div>
              )}

              {/* Confirmation mot de passe (seulement pour inscription) */}
              {!isLogin && (
                <FloatingLabelInput
                  id="confirmPassword"
                  label={t.confirm_password_label}
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              )}

              {/* Programme d'études (seulement pour inscription) */}
              {!isLogin && (
                <FloatingLabelInput
                  id="program"
                  label={t.program_label}
                  name="program"
                  type="text"
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  required
                />
              )}

              {/* Motivation (seulement pour inscription) */}
              {!isLogin && (
                <FloatingLabelTextarea
                  id="motivation"
                  label={t.motivation_label}
                  name="motivation"
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  required
                />
              )}

              {/* Sélecteur de rôle (seulement pour inscription) */}
              {!isLogin && (
                <div className="relative">
                  <label 
                    htmlFor="role" 
                    className="block text-sm font-medium text-light-text-secondary dark:text-gray-400 mb-2"
                  >
                    {t.role_label || "Type de compte"}
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'STUDENT' | 'STAFF' | 'ADMIN' | 'VIEWER')}
                    className="block px-3 py-4 w-full text-base text-light-text dark:text-off-white bg-light-bg dark:bg-navy rounded-lg border-2 border-light-border dark:border-dark-border focus:outline-none focus:ring-0 focus:border-light-accent dark:focus:border-teal"
                  >
                    <option value="VIEWER">Visiteur - Consultation uniquement</option>
                    <option value="STUDENT">Étudiant - Soumission et suivi de publications</option>
                    <option value="STAFF">Personnel - Modération et gestion du contenu</option>
                    <option value="ADMIN">Administrateur - Gestion complète du système</option>
                  </select>
                  <p className="text-xs text-light-text-secondary dark:text-gray-500 mt-1">
                    Le rôle sélectionné sera attribué directement à votre compte.
                  </p>
                </div>
              )}

              {/* Message d'erreur */}
              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Bouton de soumission */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-light-accent dark:bg-teal text-white dark:text-navy font-bold py-3 px-6 rounded-full text-lg hover:bg-light-accent-hover dark:hover:bg-opacity-80 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.loading}
                  </span>
                ) : (
                  isLogin ? t.login_button : t.signup_button
                )}
              </button>

              {/* Toggle entre connexion et inscription */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-light-accent dark:text-teal hover:underline"
                >
                  {isLogin ? t.switch_to_signup : t.switch_to_login}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
