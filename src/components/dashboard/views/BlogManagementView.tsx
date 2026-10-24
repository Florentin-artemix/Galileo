import React, { useState, useMemo } from 'react';
import { ArticleBlogDTO, ArticleBlogCreateDTO } from '../../../services/blogService';
import Modal from '../../Modal';
import { SearchIcon, PlusIcon, EditIcon, TrashIcon } from '../DashboardIcons';

interface BlogManagementViewProps {
  articles: ArticleBlogDTO[];
  onCreate: (data: ArticleBlogCreateDTO, file?: File | null) => Promise<void>;
  onUpdate: (id: number, data: ArticleBlogCreateDTO, file?: File | null) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  loading?: boolean;
}

export const BlogManagementView: React.FC<BlogManagementViewProps> = ({
  articles,
  onCreate,
  onUpdate,
  onDelete,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleBlogDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<ArticleBlogCreateDTO>({
    titre: '',
    contenu: '',
    resume: '',
    auteur: '',
    categorie: '',
    motsCles: '',
    urlImagePrincipale: '',
    tempsLecture: 5,
    publie: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const filteredArticles = useMemo(() => {
    if (!searchTerm.trim()) return articles;
    const term = searchTerm.toLowerCase();
    return articles.filter((a) => {
      const title = (a.titre || '').toLowerCase();
      const author = (a.auteur || '').toLowerCase();
      const cat = (a.categorie || '').toLowerCase();
      return title.includes(term) || author.includes(term) || cat.includes(term);
    });
  }, [articles, searchTerm]);

  const openCreateModal = () => {
    setEditingArticle(null);
    setFormData({
      titre: '',
      contenu: '',
      resume: '',
      auteur: '',
      categorie: '',
      motsCles: '',
      urlImagePrincipale: '',
      tempsLecture: 5,
      publie: true,
    });
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (article: ArticleBlogDTO) => {
    setEditingArticle(article);
    setFormData({
      titre: article.titre,
      contenu: article.contenu,
      resume: article.resume,
      auteur: article.auteur,
      categorie: article.categorie || '',
      motsCles: article.motsCles || '',
      urlImagePrincipale: article.urlImagePrincipale || '',
      tempsLecture: article.tempsLecture || 5,
      publie: article.publie ?? true,
    });
    setImageFile(null);
    setImagePreview(article.urlImagePrincipale || null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titre || !formData.contenu || !formData.resume || !formData.auteur) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingArticle) {
        await onUpdate(editingArticle.id, formData, imageFile);
      } else {
        await onCreate(formData, imageFile);
      }
      setIsModalOpen(false);
      setEditingArticle(null);
      setImageFile(null);
      setImagePreview(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cet article de blog ?')) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm">
        <div className="flex-1 max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par titre, auteur, catégorie..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-teal"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-teal hover:bg-teal-dark text-white shadow-xs transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Rédiger un article</span>
        </button>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="py-16 text-center text-gray-500 dark:text-gray-400">
          <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Chargement des articles...</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="py-16 px-4 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm">
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            Aucun article de blog publié
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Partagez des réflexions ou vulgarisations scientifiques avec la communauté.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => {
            const isDeleting = deletingId === article.id;
            return (
              <div
                key={article.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {article.urlImagePrincipale && (
                    <div className="h-36 w-full mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img
                        src={article.urlImagePrincipale}
                        alt={article.titre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
                      {article.titre}
                    </h3>
                  </div>

                  {article.resume && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                      {article.resume}
                    </p>
                  )}

                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <p className="flex items-center gap-2">
                      <span className="text-gray-400">Auteur :</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{article.auteur}</span>
                    </p>
                    {article.categorie && (
                      <p className="flex items-center gap-2">
                        <span className="text-gray-400">Catégorie :</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                          {article.categorie}
                        </span>
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <span className="text-gray-400">Lecture :</span>
                      <span>~{article.tempsLecture || 5} min</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-700/70 flex items-center justify-between">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      article.publie !== false
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {article.publie !== false ? 'Publié' : 'Brouillon'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(article)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-teal hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Modifier l'article"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(article.id)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                      title="Supprimer l'article"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Blog Creation / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingArticle ? "Modification d'un article de blog" : "Rédaction d'un nouvel article"}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="blogArticleTitleInput" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Titre de l'article *
            </label>
            <input
              id="blogArticleTitleInput"
              type="text"
              required
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Ex : Les avancées récentes en informatique quantique"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal"
            />
          </div>

          <div>
            <label htmlFor="blogArticleResumeInput" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Résumé / Chapô *
            </label>
            <textarea
              id="blogArticleResumeInput"
              rows={2}
              required
              value={formData.resume}
              onChange={(e) => setFormData({ ...formData, resume: e.target.value })}
              placeholder="Bref aperçu du contenu..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal"
            />
          </div>

          <div>
            <label htmlFor="blogArticleContenuInput" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Corps de l'article *
            </label>
            <textarea
              id="blogArticleContenuInput"
              rows={8}
              required
              value={formData.contenu}
              onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
              placeholder="Contenu complet de votre article..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal font-sans"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="blogArticleAuteurInput" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Auteur *
              </label>
              <input
                id="blogArticleAuteurInput"
                type="text"
                required
                value={formData.auteur}
                onChange={(e) => setFormData({ ...formData, auteur: e.target.value })}
                placeholder="Dr. Nom Prénom"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label htmlFor="blogArticleCategorieInput" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Catégorie
              </label>
              <input
                id="blogArticleCategorieInput"
                type="text"
                value={formData.categorie || ''}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                placeholder="Recherche, Méthodologie..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label htmlFor="blogArticleTempsLectureInput" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Temps de lecture (minutes)
              </label>
              <input
                id="blogArticleTempsLectureInput"
                type="number"
                min={1}
                value={formData.tempsLecture || 5}
                onChange={(e) => setFormData({ ...formData, tempsLecture: parseInt(e.target.value) || 5 })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal"
              />
            </div>
          </div>

          <div>
            <label htmlFor="blogArticleMotsClesInput" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Mots-clés (séparés par des virgules)
            </label>
            <input
              id="blogArticleMotsClesInput"
              type="text"
              value={formData.motsCles || ''}
              onChange={(e) => setFormData({ ...formData, motsCles: e.target.value })}
              placeholder="IA, algorithmes, physique"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal"
            />
          </div>

          {/* Image Upload & Preview */}
          <div>
            <label htmlFor="blogArticleImageFileInput" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Image principale (Cloudflare R2)
            </label>
            {imagePreview && (
              <div className="relative w-full h-40 mb-2 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    setFormData({ ...formData, urlImagePrincipale: '' });
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
                  title="Supprimer l'image"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            <input
              id="blogArticleImageFileInput"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal/10 file:text-teal hover:file:bg-teal/20 cursor-pointer"
            />
          </div>

          {/* Publié checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="publieCheck"
              checked={formData.publie ?? true}
              onChange={(e) => setFormData({ ...formData, publie: e.target.checked })}
              className="w-4 h-4 text-teal rounded border-gray-300 focus:ring-teal"
            />
            <label htmlFor="publieCheck" className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Rendre immédiatement visible pour le public
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal hover:bg-teal-dark text-white transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? 'Enregistrement en cours...'
                : editingArticle
                ? 'Mettre à jour'
                : "Publier l'article"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BlogManagementView;

