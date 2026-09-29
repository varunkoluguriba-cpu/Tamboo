import React, { createContext, useContext, useMemo, useState } from 'react';

export type EventDetails = {
  name: string;
  type: string;
  date: string;
  guests: string;
  setup: string;
  pickup: string;
  start: string;
  end: string;
  venueType: string;
  address: string;
  budget: string;
  notes: string;
};

const DEFAULT_EVENT: EventDetails = {
  name: 'My event',
  type: 'Wedding',
  date: '',
  guests: '100',
  setup: '',
  pickup: '',
  start: '',
  end: '',
  venueType: 'Banquet hall',
  address: '',
  budget: '',
  notes: '',
};

interface EventContextValue {
  event: EventDetails;
  setEvent: (next: EventDetails) => void;
}

const EventContext = createContext<EventContextValue | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [event, setEvent] = useState<EventDetails>(DEFAULT_EVENT);
  const value = useMemo(() => ({ event, setEvent }), [event]);
  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvent() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvent must be used within EventProvider');
  return ctx;
}
