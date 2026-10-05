export interface FavoritePublication {
    id: string;
    publicationTitle: string;
    addedAt: string;
}

export interface ReadingHistoryItem {
    id: string;
    publicationTitle: string;
    lastReadAt: string;
    progress: number;
}

export const lectureService = {
    getUserFavorites: async (uid: string): Promise<FavoritePublication[]> => {
        return [];
    },
    getUserReadingHistory: async (uid: string): Promise<ReadingHistoryItem[]> => {
        return [];
    }
};
