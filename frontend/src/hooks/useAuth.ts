import { useState, useEffect } from 'react';
import { getCurrentUser, isAuthenticated } from '../api/auth';

export interface User {
  uid: string;
  email: string;
  name: string;
  displayName: string;
  role: string;
  roles: string[];
  categories?: string[];
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем авторизацию при загрузке
    if (isAuthenticated()) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    }
    setLoading(false);

    // Слушаем изменения в localStorage
    const handleStorageChange = () => {
      if (isAuthenticated()) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { user, loading };
}; 