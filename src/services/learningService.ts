import apiClient from './apiService';

export interface QuizQuestionDTO {
  id: number;
  question: string;
  options: string[];
  answer?: string | null;
  explanation?: string | null;
  position?: number;
}

export interface QuizDTO {
  id: number;
  publicationId?: number | null;
  publicationTitle?: string | null;
  topic: string;
  type: string;
  passingScore: number;
  questions: QuizQuestionDTO[];
}

export interface QuizCorrectionDTO {
  questionId: number;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
  explanation: string;
}

export interface QuizAttemptDTO {
  attemptId: number;
  quizId: number;
  score: number;
  passingScore: number;
  totalQuestions: number;
  correctCount: number;
  passed: boolean;
  corrections: QuizCorrectionDTO[];
}

export interface LearningStepDTO {
  stepIndex?: number;
  title?: string;
  description?: string;
  estimatedMinutes?: number;
  keyConcepts?: string[];
}

export interface LearningPathDTO {
  id: number;
  userId: number;
  title: string;
  topic: string;
  steps: LearningStepDTO[];
  isActive: boolean | null;
  completedSteps: number;
  completedStepIndexes?: number[];
  totalSteps: number;
  progressPercentage: number;
  createdAt: string;
}

export interface LearningProfileDTO {
  id: number;
  userId: number;
  studiedTopics: string[];
  estimatedLevel: string;
  interests: string[];
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
   * Génère un nouveau quiz académique via IA Claude
   */
  async generateQuiz(request: { publicationId: number; questionCount: number; type: string }): Promise<QuizDTO> {
    const response = await apiClient.post('/learning/quizzes/generate', request);
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
  async submitQuizAttempt(quizId: number, answers: Record<number, string>): Promise<QuizAttemptDTO> {
    const response = await apiClient.post(`/learning/quizzes/${quizId}/attempt`, { answers });
    return response.data;
  },

  /** Liste les parcours de l'utilisateur connecté. */
  async getLearningPaths(): Promise<LearningPathDTO[]> {
    const response = await apiClient.get('/learning/paths');
    return response.data;
  },

  /** Génère et enregistre un parcours pour le sujet demandé. */
  async generateLearningPath(topic: string): Promise<LearningPathDTO> {
    const response = await apiClient.post('/learning/paths/generate', { topic });
    return response.data;
  },

  /** Récupère le parcours et sa progression globale. */
  async getLearningPath(id: number): Promise<LearningPathDTO> {
    const response = await apiClient.get(`/learning/paths/${id}`);
    return response.data;
  },

  /** Enregistre l'état d'une étape et renvoie la progression mise à jour. */
  async updateStepProgress(pathId: number, stepIndex: number, completed: boolean): Promise<LearningPathDTO> {
    const response = await apiClient.post(`/learning/paths/${pathId}/step`, { stepIndex, completed });
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
