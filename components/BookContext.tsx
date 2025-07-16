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

const DEFAULT_BOOKS: Book[] = [
  {
    id: '1',
    title: 'White Nights',
    author: 'Fyodor Dostoevsky',
    genre: 'Philosophical Fiction',
    genreColor: '#A3C9A8',
    cover: 'https://covers.openlibrary.org/b/id/11153223-L.jpg',
  },
  {
    id: '2',
    title: 'The Richest Man in Babylon',
    author: 'George S. Clason',
    genre: 'Finance',
    genreColor: '#B5D6F6',
    cover: 'https://covers.openlibrary.org/b/id/11153224-L.jpg',
  },
  {
    id: '3',
    title: 'Atomic Habits',
    author: 'James Clear',
    genre: 'Personal Development',
    genreColor: '#F6E7B5',
    cover: 'https://covers.openlibrary.org/b/id/11153225-L.jpg',
  },
];

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