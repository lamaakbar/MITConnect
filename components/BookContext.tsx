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

  // Function to fetch real book cover from OpenLibrary
  const fetchBookCover = async (title: string, author: string): Promise<string | null> => {
    try {
      // Try multiple search strategies
      const searchStrategies = [
        // Strategy 1: Title + Author
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author || '')}&limit=5`,
        // Strategy 2: Title only
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=5`,
        // Strategy 3: Simplified title (remove special characters)
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title.replace(/[^\w\s]/g, ' ').trim())}&limit=5`
      ];
      
      for (let i = 0; i < searchStrategies.length; i++) {
        const searchUrl = searchStrategies[i];
        console.log(`🔍 BookContext search strategy ${i + 1} for:`, title, 'URL:', searchUrl);
        
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.docs && data.docs.length > 0) {
          // Find the best match
          const bestMatch = data.docs.find((book: any) => book.cover_i) || data.docs[0];
          
          if (bestMatch.cover_i) {
            const coverUrl = `https://covers.openlibrary.org/b/id/${bestMatch.cover_i}-L.jpg`;
            console.log('✅ BookContext found cover for:', title, 'URL:', coverUrl);
            return coverUrl;
          }
        }
      }
      
      console.log('❌ BookContext no cover found for:', title);
      return null;
    } catch (error) {
      console.log('❌ BookContext error fetching cover for:', title, error);
      return null;
    }
  };

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
        console.log('📚 BookContext raw books data:', data);
        
        // Process books to handle local file URIs and fetch real covers
        const processedBooks = await Promise.all((data || []).map(async (book) => {
          console.log('📚 BookContext processing book:', book.title, 'Cover URL:', book.cover_image_url);
          
          // Check if the book has a local file URI (which won't work)
          const hasLocalFileUri = book.cover_image_url && 
            (book.cover_image_url.startsWith('file://') || 
             book.cover_image_url.match(/^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}\.(jpg|png|jpeg)$/i));
          
          let processedCover = book.cover_image_url || book.cover || '';
          
          if (hasLocalFileUri) {
            console.log('🔍 BookContext fetching real cover for book:', book.title);
            
            // Fetch the actual book cover from OpenLibrary API
            const realCoverUrl = await fetchBookCover(book.title, book.author || '');
            
            // If OpenLibrary doesn't have the cover, try to use a generic book cover
            // based on the book's genre or type
            if (!realCoverUrl) {
              console.log('⚠️ BookContext OpenLibrary failed, using genre-based cover for:', book.title);
              
              // Use different cover IDs based on book genre or title keywords
              const genreCovers = {
                'self-help': 'https://covers.openlibrary.org/b/id/7222246-L.jpg',
                'philosophy': 'https://covers.openlibrary.org/b/id/7222247-L.jpg',
                'fiction': 'https://covers.openlibrary.org/b/id/7222248-L.jpg',
                'business': 'https://covers.openlibrary.org/b/id/7222249-L.jpg',
                'default': 'https://covers.openlibrary.org/b/id/7222250-L.jpg'
              };
              
              // Determine genre based on title keywords
              const titleLower = book.title.toLowerCase();
              let selectedCover = genreCovers.default;
              
              if (titleLower.includes('think') || titleLower.includes('believe') || titleLower.includes('mind')) {
                selectedCover = genreCovers['self-help'];
              } else if (titleLower.includes('philosophy') || titleLower.includes('wisdom')) {
                selectedCover = genreCovers.philosophy;
              } else if (titleLower.includes('business') || titleLower.includes('success')) {
                selectedCover = genreCovers.business;
              }
              
              processedCover = selectedCover;
            } else {
              processedCover = realCoverUrl;
            }
          }
          
          // Transform the data to match our Book type
          return {
            id: book.id.toString(),
            title: book.title,
            author: book.author,
            genre: book.genre || '',
            genreColor: book.genre_color || '#A3C9A8',
            cover: processedCover,
            description: book.description,
            category: book.category || 'library',
          };
        }));
        
        console.log('📚 BookContext final processed books:', processedBooks.map(b => ({ title: b.title, cover: b.cover })));
        setBooks(processedBooks);
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
      // Upload image to Supabase storage if it's a local file URI
      let imageUrl = book.cover;
      if (book.cover && book.cover.startsWith('file://')) {
        try {
          const ext = book.cover.split('.').pop() || 'jpg';
          const fileName = `book-${Date.now()}.${ext}`;
          
          // Read file as base64
          const response = await fetch(book.cover);
          const blob = await response.blob();
          
          // Upload to Supabase storage with RLS bypass
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('book-covers')
            .upload(fileName, blob, {
              contentType: `image/${ext}`,
              upsert: true,
              cacheControl: '3600',
            });
          
          if (uploadError) {
            console.error('❌ Image upload error:', uploadError);
            // If upload fails due to RLS, try using a placeholder URL
            imageUrl = 'https://via.placeholder.com/300x400/cccccc/666666?text=Book+Cover';
            console.log('⚠️ Using placeholder image due to upload failure');
          } else {
            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
              .from('book-covers')
              .getPublicUrl(uploadData.path);
            
            imageUrl = publicUrl;
            console.log('✅ Book image uploaded successfully:', publicUrl);
          }
        } catch (uploadErr) {
          console.error('❌ Image upload failed:', uploadErr);
          // Use placeholder image if upload fails
          imageUrl = 'https://via.placeholder.com/300x400/cccccc/666666?text=Book+Cover';
          console.log('⚠️ Using placeholder image due to upload failure');
        }
      }

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
            cover_image_url: imageUrl,
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