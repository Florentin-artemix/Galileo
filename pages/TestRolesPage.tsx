import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { authService, UserRole } from '../src/services/authService';
import { ROLE_LABELS, ROLE_COLORS, ROLE_DESCRIPTIONS } from '../src/constants/roles';

/**
 * Page de test pour créer des comptes avec différents rôles.
 * ⚠️ UNIQUEMENT POUR LE DÉVELOPPEMENT/TEST
 * Cette page ne doit PAS être accessible en production !
 */
const TestRolesPage: React.FC = () => {
  const { translations } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('VIEWER');

  const roles: UserRole[] = ['ADMIN', 'STAFF', 'STUDENT', 'VIEWER'];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !name) {
      setError('Tous les champs sont requis');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Créer le compte avec Firebase
      await authService.signup(email, password, name);
      
      // Note: En production, l'admin doit changer le rôle via le dashboard
      // Ici, on affiche juste un message de succès avec le rôle souhaité
      setSuccess(`✅ Compte créé avec succès !
        
Email: ${email}
Rôle demandé: ${ROLE_LABELS[selectedRole]}

⚠️ Note: Le compte a été créé avec le rôle VIEWER par défaut.
Pour tester avec le rôle "${ROLE_LABELS[selectedRole]}", un admin doit changer le rôle depuis le dashboard admin.

Vous allez être redirigé vers la page d'accueil...`);
      
      // Redirect après 3 secondes
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (err: any) {
      console.error('Error creating test account:', err);
      
      if (err.code === 'auth/email-already-in-use') {
        setError('Cet email est déjà utilisé');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email invalide');
      } else if (err.code === 'auth/weak-password') {
        setError('Mot de passe trop faible');
      } else {
        setError(err.message || 'Erreur lors de la création du compte');
      }
    } finally {
      setLoading(false);
    }
  };

  const quickCreate = async (role: UserRole) => {
    const timestamp = Date.now();
    const testEmail = `test-${role.toLowerCase()}-${timestamp}@galileo-test.com`;
    const testPassword = 'Test123!';
    const testName = `Test ${ROLE_LABELS[role]}`;

    setEmail(testEmail);
    setPassword(testPassword);
    setName(testName);
    setSelectedRole(role);

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authService.signup(testEmail, testPassword, testName);
      
      setSuccess(`✅ Compte test créé !
        
Email: ${testEmail}
Mot de passe: ${testPassword}
Rôle demandé: ${ROLE_LABELS[role]}

⚠️ Note: Connectez-vous en tant qu'admin pour attribuer le rôle "${ROLE_LABELS[role]}" à ce compte.`);
      
    } catch (err: any) {
      console.error('Error creating test account:', err);
      setError(err.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-navy py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Warning Banner */}
          <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-400 dark:border-amber-600 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-amber-800 dark:text-amber-300">Page de Test</h3>
                <p className="text-amber-700 dark:text-amber-400 text-sm">
                  Cette page est réservée au développement et aux tests. 
                  Ne pas utiliser en production !
                </p>
              </div>
            </div>
          </div>

          <header className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-poppins font-bold text-light-text dark:text-off-white mb-4">
              🧪 Test des Rôles
            </h1>
            <p className="text-lg text-light-text-secondary dark:text-gray-300">
              Créez des comptes de test avec différents rôles pour tester les fonctionnalités
            </p>
          </header>

          {/* Quick Create Buttons */}
          <div className="bg-light-bg/60 dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-light-text dark:text-off-white mb-4">
              ⚡ Création Rapide
            </h2>
            <p className="text-sm text-light-text-secondary dark:text-gray-400 mb-4">
              Cliquez sur un rôle pour créer automatiquement un compte de test
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => quickCreate(role)}
                  disabled={loading}
                  className={`${ROLE_COLORS[role]} px-4 py-3 rounded-lg font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="text-lg mb-1">{ROLE_LABELS[role]}</div>
                  <div className="text-xs opacity-75">{ROLE_DESCRIPTIONS[role]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Form */}
          <div className="bg-light-bg/60 dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-2xl p-6">
            <h2 className="text-xl font-bold text-light-text dark:text-off-white mb-4">
              📝 Création Manuelle
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-light-text dark:text-off-white mb-2">
                  Nom complet
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-navy border border-light-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-teal text-light-text dark:text-off-white"
                  placeholder="Jean Dupont"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-light-text dark:text-off-white mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-navy border border-light-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-teal text-light-text dark:text-off-white"
                  placeholder="test@galileo.com"
                  required
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-light-text dark:text-off-white mb-2">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-navy border border-light-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-teal text-light-text dark:text-off-white"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Sélection du rôle */}
              <div>
                <label className="block text-sm font-medium text-light-text dark:text-off-white mb-2">
                  Rôle souhaité (pour référence)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedRole === role
                          ? 'border-light-accent dark:border-teal bg-light-accent/10 dark:bg-teal/10'
                          : 'border-light-border dark:border-dark-border'
                      }`}
                    >
                      <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${ROLE_COLORS[role]}`}>
                        {ROLE_LABELS[role]}
                      </div>
                      <p className="text-xs text-light-text-secondary dark:text-gray-400 mt-1">
                        {ROLE_DESCRIPTIONS[role]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg whitespace-pre-line">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg whitespace-pre-line">
                  {success}
                </div>
              )}

              {/* Bouton de soumission */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-light-accent dark:bg-teal text-white dark:text-navy font-bold py-3 px-6 rounded-full text-lg hover:bg-light-accent-hover dark:hover:bg-opacity-80 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Création en cours...
                  </span>
                ) : (
                  '🚀 Créer le compte de test'
                )}
              </button>
            </form>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-600 rounded-lg p-6">
            <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-3">📋 Instructions de test</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-700 dark:text-blue-400 text-sm">
              <li>Créez un compte admin en premier (utilisez le bouton "Admin")</li>
              <li>Connectez-vous avec ce compte</li>
              <li>Allez dans le Dashboard Admin → onglet "Utilisateurs"</li>
              <li>Changez le rôle du compte de VIEWER à ADMIN</li>
              <li>Déconnectez-vous et reconnectez-vous pour que le nouveau rôle prenne effet</li>
              <li>Créez d'autres comptes de test (Student, Staff, Viewer)</li>
              <li>Utilisez le dashboard admin pour leur attribuer les rôles souhaités</li>
              <li>Testez les différentes fonctionnalités avec chaque rôle</li>
            </ol>
          </div>

          {/* Role capabilities */}
          <div className="mt-8 bg-light-bg/60 dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-2xl p-6">
            <h3 className="font-bold text-light-text dark:text-off-white mb-4">🔐 Permissions par rôle</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-light-border dark:border-dark-border">
                    <th className="text-left py-2 text-light-text dark:text-off-white">Fonctionnalité</th>
                    <th className="text-center py-2"><span className={`px-2 py-1 rounded text-xs ${ROLE_COLORS.ADMIN}`}>Admin</span></th>
                    <th className="text-center py-2"><span className={`px-2 py-1 rounded text-xs ${ROLE_COLORS.STAFF}`}>Staff</span></th>
                    <th className="text-center py-2"><span className={`px-2 py-1 rounded text-xs ${ROLE_COLORS.STUDENT}`}>Student</span></th>
                    <th className="text-center py-2"><span className={`px-2 py-1 rounded text-xs ${ROLE_COLORS.VIEWER}`}>Viewer</span></th>
                  </tr>
                </thead>
                <tbody className="text-light-text-secondary dark:text-gray-400">
                  <tr className="border-b border-light-border/50 dark:border-dark-border/50">
                    <td className="py-2">Voir les publications</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                  </tr>
                  <tr className="border-b border-light-border/50 dark:border-dark-border/50">
                    <td className="py-2">Soumettre des publications</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">❌</td>
                  </tr>
                  <tr className="border-b border-light-border/50 dark:border-dark-border/50">
                    <td className="py-2">Dashboard personnel</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">❌</td>
                  </tr>
                  <tr className="border-b border-light-border/50 dark:border-dark-border/50">
                    <td className="py-2">Modérer les soumissions</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">❌</td>
                    <td className="text-center">❌</td>
                  </tr>
                  <tr>
                    <td className="py-2">Gérer les utilisateurs</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">❌</td>
                    <td className="text-center">❌</td>
                    <td className="text-center">❌</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRolesPage;
