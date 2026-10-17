import apiClient from './apiService';

export interface QuizQuestionDTO {
  id: number;
  questionText: string;
  options: string[];
  explanation?: string;
  points: number;
}

export interface QuizDTO {
  id: number;
  publicationId: number;
  publicationTitle?: string;
  title: string;
  description?: string;
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  passingScore: number;
  questions: QuizQuestionDTO[];
}

export interface QuizAttemptDTO {
  id: number;
  quizId: number;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
}

export interface LearningModuleDTO {
  id: number;
  title: string;
  description?: string;
  orderIndex: number;
  estimatedMinutes?: number;
  publicationId?: number;
  publicationTitle?: string;
  isCompleted?: boolean;
}

export interface LearningPathDTO {
  id: number;
  title: string;
  slug: string;
  description?: string;
  domainId?: number;
  domainName?: string;
  level: string;
  estimatedHours: number;
  modules: LearningModuleDTO[];
}

export interface LearningProfileDTO {
  id: number;
  userId: number;
  preferredLanguage?: string;
  totalQuizAttempts: number;
  averageQuizScore: number;
  completedPathsCount: number;
}

export const learningService = {
  /**
   * Récupère les quiz associés à une publication
   */
  async getQuizzesByPublication(publicationId: number): Promise<QuizDTO[]> {
    const response = await apiClient.get(`/learning/quizzes/publication/${publicationId}`);
    return response.data;
  },

  /**
   * Génère un nouveau quiz académique via IA DeepSeek
   */
  async generateQuiz(publicationId: number, count: number = 5, difficulty: string = 'INTERMEDIATE'): Promise<QuizDTO> {
    const response = await apiClient.post('/learning/quizzes/generate', null, {
      params: { publicationId, count, difficulty }
    });
    return response.data;
  },

  /**
   * Récupère un quiz par son identifiant
   */
  async getQuiz(id: number): Promise<QuizDTO> {
    const response = await apiClient.get(`/learning/quizzes/${id}`);
    return response.data;
  },

  /**
   * Soumet une tentative de quiz avec correction automatique
   */
  async submitQuizAttempt(quizId: number, answers: Record<number, number>): Promise<QuizAttemptDTO> {
    const response = await apiClient.post(`/learning/quizzes/${quizId}/attempt`, { answers });
    return response.data;
  },

  /**
   * Liste l'ensemble des parcours d'apprentissage
   */
  async getLearningPaths(): Promise<LearningPathDTO[]> {
    const response = await apiClient.get('/learning/paths');
    return response.data;
  },

  /**
   * Récupère un parcours d'apprentissage avec tous ses modules
   */
  async getLearningPath(id: number): Promise<LearningPathDTO> {
    const response = await apiClient.get(`/learning/paths/${id}`);
    return response.data;
  },

  /**
   * Récupère le profil d'apprentissage de l'utilisateur connecté
   */
  async getLearningProfile(): Promise<LearningProfileDTO> {
    const response = await apiClient.get('/learning/profile');
    return response.data;
  }
};
