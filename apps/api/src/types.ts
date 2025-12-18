import { games, studios, publishers } from '../db/schema';

// Types Drizzle inférés pour le typage strict
export type Game = typeof games.$inferSelect;
export type GameInsert = typeof games.$inferInsert;
export type Studio = typeof studios.$inferSelect;
export type StudioInsert = typeof studios.$inferInsert;
export type Publisher = typeof publishers.$inferSelect;
export type PublisherInsert = typeof publishers.$inferInsert;

// Type pour les jeux avec jointure studio (utilisé dans les réponses API)
export type GameWithStudio = Omit<Game, 'createdAt' | 'updatedAt'> & { 
  studioName?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

// Types utilitaires pour les réponses API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface GamesResponse {
  games: GameWithStudio[];
  error?: string;
  message?: string;
}

export interface StudiosResponse {
  studios: Studio[];
  error?: string;
  message?: string;
}

export interface PublishersResponse {
  publishers: Publisher[];
  error?: string;
  message?: string;
}

// Types pour les réponses avec erreurs (gardés pour compatibilité)
export interface GamesResponseError {
  games?: GameWithStudio[];
  error?: string;
  message?: string;
}

export interface StudiosResponseError {
  studios?: Studio[];
  error?: string;
  message?: string;
}

export interface PublishersResponseError {
  publishers?: Publisher[];
  error?: string;
  message?: string;
}
