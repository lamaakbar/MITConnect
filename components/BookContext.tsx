import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  genreColor: string;
  cover: string;
  description?: string;
};

interface BookContextType {
  books: Book[];
  addBook: (book: Book) => void;
  removeBook: (id: string) => void;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

// Empty books array - no mock data
const DEFAULT_BOOKS: Book[] = [];

export function BookProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>(DEFAULT_BOOKS);

  const addBook = (book: Book) => {
    setBooks(prev => [book, ...prev]);
  };

  const removeBook = (id: string) => {
    setBooks(prev => prev.filter(book => book.id !== id));
  };

  return (
    <BookContext.Provider value={{ books, addBook, removeBook }}>
      {children}
    </BookContext.Provider>
  );
}

export function useBooks() {
  const context = useContext(BookContext);
  if (!context) throw new Error('useBooks must be used within a BookProvider');
  return context;
} 