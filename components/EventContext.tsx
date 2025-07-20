import React, { createContext, useContext, useState, ReactNode } from 'react';

// Mock event data
const mockEvents = [
  {
    id: '1',
    title: 'Technology Table Tennis',
    desc: 'Innovation meets friendly competition. Connect with fellow tech enthusiasts, enjoy some fast-paced fun, and take a well-deserved break while rallying around the spirit of technology and teamwork.',
    date: 'July 22, 2025',
    time: '12:00 PM - 1:00 PM',
    location: 'MITC, Jeddah',
    image: require('../assets/images/react-logo.png'),
    category: 'Activity',
    registeredCount: 47,
    featured: true,
  },
  {
    id: '2',
    title: 'Future of Tech',
    desc: 'A look into the future of technology and innovation.',
    date: 'Nov 15, 2025',
    time: '10:00 AM - 12:00 PM',
    location: 'Online',
    image: require('../assets/images/partial-react-logo.png'),
    category: 'Seminar',
    registeredCount: 120,
    featured: false,
  },
  {
    id: '3',
    title: 'Startup Strategies',
    desc: 'Learn how to launch and grow your startup.',
    date: 'Dec 5, 2025',
    time: '2:00 PM - 4:00 PM',
    location: 'MITC, Jeddah',
    image: require('../assets/images/icon.png'),
    category: 'Workshop',
    registeredCount: 80,
    featured: false,
  },
];

interface Event {
  id: string;
  title: string;
  desc: string;
  date: string;
  time: string;
  location: string;
  image: any;
  category: string;
  registeredCount: number;
  featured: boolean;
}

interface EventContextType {
  events: Event[];
  bookmarks: string[];
  registered: string[];
  bookmarkEvent: (id: string) => void;
  unbookmarkEvent: (id: string) => void;
  registerEvent: (id: string) => void;
  unregisterEvent: (id: string) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider = ({ children }: { children: ReactNode }) => {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [registered, setRegistered] = useState<string[]>([]);

  const bookmarkEvent = (id: string) => {
    setBookmarks((prev) => prev.includes(id) ? prev : [...prev, id]);
  };
  const unbookmarkEvent = (id: string) => {
    setBookmarks((prev) => prev.filter((eid) => eid !== id));
  };
  const registerEvent = (id: string) => {
    console.log('registerEvent called with id:', id);
    console.log('Current registered state:', registered);
    setRegistered((prev) => {
      const newState = prev.includes(id) ? prev : [...prev, id];
      console.log('New registered state:', newState);
      return newState;
    });
  };
  const unregisterEvent = (id: string) => {
    setRegistered((prev) => prev.filter((eid) => eid !== id));
  };

  return (
    <EventContext.Provider
      value={{
        events: mockEvents,
        bookmarks,
        registered,
        bookmarkEvent,
        unbookmarkEvent,
        registerEvent,
        unregisterEvent,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEventContext = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEventContext must be used within EventProvider');
  return ctx;
}; 