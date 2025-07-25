import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Text } from 'react-native';
import { supabase } from '../services/supabase';

export type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  genreColor: string;
  cover: string;
  description?: string;
  category?: string;
};

interface BookContextType {
  books: Book[];
  addBook: (book: Book) => Promise<void>;
  removeBook: (id: string) => Promise<void>;
  updateBookCategory: (bookId: number, category: string) => Promise<void>;
  refreshBooks: () => Promise<void>;
}

const BookContext = createContext<BookContextType | null>(null);

export function BookProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching books:', error);
        setBooks([]);
      } else {
        // Transform the data to match our Book type
        const transformedBooks: Book[] = (data || []).map(book => ({
          id: book.id.toString(),
          title: book.title,
          author: book.author,
          genre: book.genre || '',
          genreColor: book.genre_color || '#A3C9A8',
          cover: book.cover_image_url || book.cover || '',
          description: book.description,
          category: book.category || 'library',
        }));
        setBooks(transformedBooks);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshBooks = async () => {
    await fetchBooks();
  };

  // Fetch books on component mount
  useEffect(() => {
    fetchBooks();
  }, []);

  const addBook = async (book: Book) => {
    try {
      // If the new book is being set as "Book of the Month", reset all existing books first
      if (book.category === 'book_of_the_month') {
        const { error: resetError } = await supabase
          .from('books')
          .update({ category: 'library' })
          .eq('category', 'book_of_the_month');
        
        if (resetError) throw resetError;
        
        // Update local state to reset all existing books to 'library'
        setBooks(prev => prev.map(existingBook => ({
          ...existingBook,
          category: 'library'
        })));
      }

      // Insert book into Supabase
      const { data: insertedBook, error: bookError } = await supabase
        .from('books')
        .insert([
          {
            title: book.title,
            author: book.author,
            description: book.description,
            genre: book.genre,
            genre_color: book.genreColor,
            cover_image_url: book.cover,
            category: book.category || 'library',
          },
        ])
        .select()
        .single();
      
      if (bookError) throw bookError;
      
      // Get all employees and trainees
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .in('role', ['employee', 'trainee']);
      
      if (usersError) throw usersError;
      
      // Link book to all employees and trainees
      const userBooks = users.map((user: { id: string }) => ({
        user_id: user.id,
        book_id: insertedBook.id,
        status: 'assigned',
        assigned_at: new Date().toISOString(),
      }));
      
      const { error: userBooksError } = await supabase
        .from('user_books')
        .insert(userBooks);
      
      if (userBooksError) throw userBooksError;
      
      // Refresh the books list from Supabase to get the latest data
      await fetchBooks();
    } catch (error) {
      console.error('Error adding book:', error);
      throw error;
    }
  };

  const updateBookCategory = async (bookId: number, category: string) => {
    try {
      if (category === 'book_of_the_month') {
        // First, reset all books to 'library' category
        const { error: resetError } = await supabase
          .from('books')
          .update({ category: 'library' })
          .eq('category', 'book_of_the_month');
        
        if (resetError) throw resetError;
      }
      
      // Then update the selected book
      const { error } = await supabase
        .from('books')
        .update({ category })
        .eq('id', bookId);
      
      if (error) throw error;
      
      // Refresh the books list from Supabase to get the latest data
      await fetchBooks();
    } catch (error) {
      console.error('Error updating book category:', error);
      throw error;
    }
  };

  const removeBook = async (id: string) => {
    try {
      // Delete from user_books first (due to foreign key constraint)
      const { error: userBooksError } = await supabase
        .from('user_books')
        .delete()
        .eq('book_id', parseInt(id));
      
      if (userBooksError) {
        console.error('Error deleting user_books:', userBooksError);
        throw userBooksError;
      }
      
      // Then delete the book from books table
      const { error: bookError } = await supabase
        .from('books')
        .delete()
        .eq('id', parseInt(id));
      
      if (bookError) {
        console.error('Error deleting book:', bookError);
        throw bookError;
      }
      
      // Refresh the books list from Supabase to get the latest data
      await fetchBooks();
    } catch (error) {
      console.error('Error removing book:', error);
      throw error;
    }
  };

  return (
    <BookContext.Provider value={{ books, addBook, removeBook, updateBookCategory, refreshBooks }}>
      {children}
    </BookContext.Provider>
  );
}

export function useBooks() {
  const context = useContext(BookContext);
  if (!context) throw new Error('useBooks must be used within a BookProvider');
  return context;
} 