'use client';

import { useState, useEffect } from 'react';
import type { Query, DocumentData, onSnapshot, Unsubscribe } from 'firebase/firestore';

export function useCollection<T>(query: Query<DocumentData> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    // onSnapshot is imported here to avoid being bundled on the server.
    const onSnapshot = require('firebase/firestore').onSnapshot;

    const unsubscribe: Unsubscribe = onSnapshot(query, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        setData(docs);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("useCollection error:", err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, isLoading, error };
}
