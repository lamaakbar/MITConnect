export const BOOK_GENRES = [
  { name: 'Personal Development', color: '#F6E7B5' },
  { name: 'Philosophical Fiction', color: '#A3C9A8' },
  { name: 'Finance', color: '#B5D6F6' },
  { name: 'Technology', color: '#E8F4FD' },
  { name: 'Science', color: '#F0F8FF' },
  { name: 'Biography', color: '#FFF8DC' },
  { name: 'Self-help', color: '#F0FFF0' },
  { name: 'Business', color: '#F5F5DC' },
  { name: 'Psychology', color: '#FDF5E6' },
  { name: 'Productivity', color: '#E6E6FA' },
  { name: 'Education', color: '#F0F8FF' },
  { name: 'Spirituality', color: '#FFFACD' },
  { name: 'Health & Wellness', color: '#F0FFF0' },
  { name: 'History', color: '#F5F5F5' },
  { name: 'Sociology', color: '#F8F8FF' },
  { name: 'Politics', color: '#FFF5EE' },
  { name: 'Fiction', color: '#F0F8FF' },
  { name: 'Non-Fiction', color: '#F5F5F5' },
  { name: 'Motivation', color: '#FFF8DC' },
  { name: 'Creativity', color: '#E6E6FA' },
];

export const getGenreColor = (genreName: string): string => {
  const genre = BOOK_GENRES.find(g => g.name === genreName);
  return genre ? genre.color : '#A3C9A8'; // Default color if genre not found
};

export const getGenreNames = (): string[] => {
  return BOOK_GENRES.map(g => g.name);
}; 