import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { apiClient } from '../../../../api/config';

interface User {
  id: string;
  uid?: string;
  name: string;
  displayName?: string;
  fullName?: string;
  email: string;
  avatar?: string;
  role: string;
  roles?: string[];
  specialization?: string;
  profession?: string;
  rating?: number;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onMemberAdded: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  teamId,
  onMemberAdded
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Фильтры специальностей
  const specializations = [
    'Front-End разработчик',
    'Back-End разработчик', 
    'VUE.JS',
    'REACT.JS',
    'ANGULAR.JS',
    'Веб-разработчик',
    'Full Stack разработчик'
  ];

  // Загружаем пользователей
  useEffect(() => {
    if (isOpen && teamId) {
      console.log('🔍 Модальное окно открыто! TeamId:', teamId);
      loadUsers();
    }
  }, [isOpen, teamId]);

  // Фильтруем пользователей при изменении поиска или фильтров
  useEffect(() => {
    filterUsers();
  }, [searchQuery, users, selectedFilters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Загружаем доступных пользователей для команды:', teamId);
      
      // Проверяем токен аутентификации
      const token = localStorage.getItem('authToken');
      console.log('🔑 Токен в localStorage:', token ? 'Присутствует' : 'Отсутствует');
      if (token) {
        console.log('🔑 Токен (первые 50 символов):', token.substring(0, 50) + '...');
      }
      
      // Сначала пробуем специальный эндпоинт для команды
      let response;
      let usedFallback = false;
      
      try {
        console.log('🎯 Пробуем эндпоинт команды:', `/teams/${teamId}/available-users`);
        response = await apiClient.get(`/teams/${teamId}/available-users`);
        console.log('✅ Эндпоинт команды работает, получено пользователей:', response.data.length);
      } catch (teamError: any) {
        console.log('⚠️ Эндпоинт команды недоступен:', teamError.response?.status, teamError.response?.data);
        
        // Если ошибка 401 (Unauthorized), пробуем подождать и повторить
        if (teamError.response?.status === 401) {
          console.log('🔄 Ошибка авторизации, пробуем повторить через 1 секунду...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            response = await apiClient.get(`/teams/${teamId}/available-users`);
            console.log('✅ Повторный запрос успешен, получено пользователей:', response.data.length);
          } catch (retryError: any) {
            console.log('❌ Повторный запрос тоже неудачен, используем fallback');
            usedFallback = true;
          }
        } else {
          usedFallback = true;
        }
        
        // Если все еще не получилось, используем общий эндпоинт
        if (usedFallback) {
          console.log('🔄 Пробуем загрузить всех пользователей...');
          try {
            response = await apiClient.get('/users');
            console.log('✅ Загружены все пользователи:', response.data.length);
          } catch (usersError: any) {
            console.error('❌ Даже общий эндпоинт пользователей недоступен:', usersError);
            throw new Error('Не удалось загрузить пользователей. Проверьте авторизацию.');
          }
        }
      }
      
      const availableUsers = response.data;
      
      console.log('✅ Загружено пользователей:', availableUsers.length);
      if (usedFallback) {
        console.log('ℹ️ Использован fallback на общий эндпоинт пользователей');
      }
      
      setUsers(availableUsers);
    } catch (error: any) {
      console.error('❌ Ошибка загрузки пользователей:', error);
      console.error('❌ Статус ошибки:', error.response?.status);
      console.error('❌ Данные ошибки:', error.response?.data);
      
      let errorMessage = 'Ошибка загрузки пользователей';
      
      if (error.response?.status === 401) {
        errorMessage = 'Ошибка авторизации. Попробуйте перезайти в систему.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Недостаточно прав для просмотра пользователей.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Команда не найдена.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Фильтр по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        (user.name || user.displayName || user.fullName || '').toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.specialization || user.profession || '').toLowerCase().includes(query)
      );
    }

    // Фильтр по специальностям
    if (selectedFilters.size > 0) {
      filtered = filtered.filter(user => {
        const userSpec = user.specialization || user.profession || '';
        return Array.from(selectedFilters).some(filter => 
          userSpec.toLowerCase().includes(filter.toLowerCase()) ||
          filter.toLowerCase().includes(userSpec.toLowerCase())
        );
      });
    }

    setFilteredUsers(filtered);
  };

  const toggleFilter = (filter: string) => {
    const newFilters = new Set(selectedFilters);
    if (newFilters.has(filter)) {
      newFilters.delete(filter);
    } else {
      newFilters.add(filter);
    }
    setSelectedFilters(newFilters);
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSendInvitations = async () => {
    if (selectedUsers.size === 0) {
      alert('Выберите хотя бы одного участника');
      return;
    }

    try {
      setSending(true);
      setError(null);
      
      console.log('📤 Отправляем приглашения для команды:', teamId);
      console.log('👥 Выбранные пользователи:', Array.from(selectedUsers));
      
      // Отправляем приглашения участникам
      const promises = Array.from(selectedUsers).map(async (userId) => {
        try {
          const response = await apiClient.post(`/teams/${teamId}/invite`, {
            receiverId: userId,
            role: 'developer',
            projectType: 'without_project',
            coverLetter: 'Приглашение в команду'
          });
          console.log(`✅ Приглашение отправлено пользователю ${userId}:`, response.data);
          return { userId, success: true, data: response.data };
        } catch (error: any) {
          console.error(`❌ Ошибка отправки приглашения пользователю ${userId}:`, error);
          return { userId, success: false, error: error.response?.data?.message || error.message };
        }
      });

      const results = await Promise.all(promises);
      
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      if (successful.length > 0) {
        alert(`✅ Приглашения отправлены ${successful.length} участникам!`);
      }
      
      if (failed.length > 0) {
        console.error('Ошибки при отправке приглашений:', failed);
        alert(`⚠️ Не удалось отправить приглашения ${failed.length} участникам`);
      }
      
      // Сброс состояния
      setSelectedUsers(new Set());
      setSearchQuery('');
      setSelectedFilters(new Set());
      
      onMemberAdded();
      
      if (successful.length > 0) {
        onClose();
      }
    } catch (error: any) {
      console.error('❌ Общая ошибка при отправке приглашений:', error);
      setError('Ошибка при отправке приглашений: ' + (error.response?.data?.message || error.message));
    } finally {
      setSending(false);
    }
  };

  const getUserName = (user: User) => {
    return user.displayName || user.fullName || user.name || user.email;
  };

  const getUserSpecialization = (user: User) => {
    return user.specialization || user.profession || 'Разработчик';
  };

  const getUserRating = (user: User) => {
    return user.rating || (Math.random() * 2 + 8).toFixed(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Пригласить в команду</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Поиск и фильтры */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          {/* Поиск */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Поиск по имени, email или специальности..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Фильтры специальностей */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Специальности:</p>
            <div className="flex flex-wrap gap-2">
              {specializations.map((spec) => (
                <Badge
                  key={spec}
                  variant={selectedFilters.has(spec) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    selectedFilters.has(spec) 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => toggleFilter(spec)}
                >
                  {spec}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Ошибки */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Список пользователей */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Загрузка пользователей...</span>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4 text-6xl">
                🔍
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Специалисты не найдены</h3>
              <p className="text-gray-500">Попробуйте изменить критерии поиска</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUsers.map((user) => (
                <Card
                  key={user.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedUsers.has(user.id)
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => toggleUserSelection(user.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Аватар */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt={getUserName(user)} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <span className="text-white font-semibold">
                              {getUserName(user).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {selectedUsers.has(user.id) && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Информация о пользователе */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{getUserName(user)}</h3>
                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-blue-600 font-medium text-sm">⭐ {getUserRating(user)}</span>
                          <span className="text-gray-500 text-sm">{getUserSpecialization(user)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Футер с кнопками */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Выбрано: {selectedUsers.size} участников
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={sending}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSendInvitations}
              disabled={selectedUsers.size === 0 || sending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Отправка...
                </div>
              ) : (
                `Отправить приглашения (${selectedUsers.size})`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 