import React, { createContext, useContext, useState, ReactNode } from 'react';

// Copy Idea type from ideas-management for now
export type Poll = {
  question: string;
  options: string[];
};
export type Idea = {
  id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  votes: number | { [key: string]: number };
  voteType?: 'yesno' | 'likedislike';
  comments?: number;
  hasPoll?: boolean;
  poll?: Poll;
};

interface IdeasContextType {
  ideas: Idea[];
  setIdeas: React.Dispatch<React.SetStateAction<Idea[]>>;
}

const IdeasContext = createContext<IdeasContextType | null>(null);

export const IdeasProvider = ({ children }: { children: ReactNode }) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);

  return (
    <IdeasContext.Provider value={{ ideas, setIdeas }}>
      {children}
    </IdeasContext.Provider>
  );
};

export const useIdeasContext = () => {
  const ctx = useContext(IdeasContext);
  if (!ctx) throw new Error('useIdeasContext must be used within IdeasProvider');
  return ctx;
}; 