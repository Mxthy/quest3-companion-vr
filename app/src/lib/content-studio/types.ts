export type ContentStudioChoice = {
  id: string;
  label: string;
  next: string | null;
  affection?: number;
};

export type ContentStudioNode = {
  id: string;
  speaker: string;
  text: string;
  expression: string;
  affection: number;
  comfort?: number;
  next?: string | null;
  choices?: ContentStudioChoice[];
  grant?: string[];
};

export type ContentStudioData = {
  starts: Record<string, string>;
  nodes: Record<string, ContentStudioNode>;
};
