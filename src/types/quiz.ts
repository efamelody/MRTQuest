export interface Quiz {
  id: string;
  question: string;
  correctAnswer: string;
  options: string[];
  points: number | null;
  sortOrder?: number;
}
