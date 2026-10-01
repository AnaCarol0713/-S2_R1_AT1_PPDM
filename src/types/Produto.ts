export interface Produto {
  id: string;
  title: string;
  quantidade: number;
  completed: boolean;
  createdAt: string;
}

export type FilterType= "todos" | "pendentes" |"concluidas";

