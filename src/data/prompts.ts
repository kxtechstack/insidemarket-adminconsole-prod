export interface CollectionPrompt {
  id: string;
  moduleId: string;
  categoryId?: string;
  name: string;
  content: string;
  lastEdited: string;
}

export const COLLECTION_PROMPTS: CollectionPrompt[] = [];
