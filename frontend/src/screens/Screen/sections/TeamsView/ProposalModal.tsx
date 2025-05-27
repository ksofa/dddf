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
  specialization?: string;
  profession?: string;
  rating?: number;
}

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onProposalSent: () => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  isOpen,
  onClose,
  teamId,
  onProposalSent
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());

  // Форма предложения
  const [formData, setFormData] = useState({
    projectType: 'with_project',
    rate: '',
    startDate: '',
    estimatedDuration: '',
    estimatedDurationUnit: 'months',
    coverLetter: '',
    attachmentUrl: ''
  });

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
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  // Фильтруем пользователей при изменении поиска или фильтров
  useEffect(() => {
    filterUsers();
  }, [searchQuery, users, selectedFilters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Загружаем доступных пользователей для команды
      const response = await apiClient.get(`/teams/${teamId}/available-users`);
      const availableUsers = response.data;
      
      console.log('Loaded available users for proposals:', availableUsers.length);
      setUsers(availableUsers);
    } catch (error: any) {
      console.error('Error loading available users:', error);
      if (error.response?.status === 401) {
        alert('Ошибка авторизации. Пожалуйста, войдите в систему заново.');
      } else if (error.response?.status === 404) {
        alert('Команда не найдена.');
      } else {
        alert('Ошибка загрузки пользователей: ' + (error.response?.data?.message || error.message));
      }
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

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendProposal = async () => {
    if (!selectedUser) {
      alert('Выберите получателя предложения');
      return;
    }

    if (!formData.coverLetter.trim()) {
      alert('Заполните сопроводительное письмо');
      return;
    }

    try {
      setSending(true);
      
      console.log('Sending proposal to user:', selectedUser.id);
      
      const proposalData = {
        receiverId: selectedUser.id,
        projectType: formData.projectType,
        rate: formData.rate || 'Договорная',
        startDate: formData.startDate || null,
        estimatedDuration: formData.estimatedDuration || null,
        estimatedDurationUnit: formData.estimatedDurationUnit,
        coverLetter: formData.coverLetter,
        attachmentUrl: formData.attachmentUrl || null
      };

      await apiClient.post(`/teams/${teamId}/invite`, proposalData);
      
      alert('Предложение отправлено успешно!');
      
      // Сброс состояния
      setSelectedUser(null);
      setFormData({
        projectType: 'with_project',
        rate: '',
        startDate: '',
        estimatedDuration: '',
        estimatedDurationUnit: 'months',
        coverLetter: '',
        attachmentUrl: ''
      });
      setSearchQuery('');
      setSelectedFilters(new Set());
      
      onProposalSent();
      onClose();
    } catch (error: any) {
      console.error('Error sending proposal:', error);
      if (error.response?.status === 401) {
        alert('Ошибка авторизации. Пожалуйста, войдите в систему заново.');
      } else if (error.response?.status === 403) {
        alert('У вас нет прав для отправки предложений от имени этой команды.');
      } else if (error.response?.status === 404) {
        alert('Команда или пользователь не найдены.');
      } else {
        alert('Ошибка при отправке предложения: ' + (error.response?.data?.message || error.message));
      }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex">
        {/* Левая панель - выбор пользователя */}
        <div className="w-1/2 border-r">
          {/* Заголовок */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <h2 className="text-xl font-bold text-gray-900">Отправить предложение</h2>
            </div>
          </div>

          {/* Поиск */}
          <div className="p-6 border-b">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Поиск специалистов..."
              />
            </div>
          </div>

          {/* Фильтры */}
          <div className="p-6 border-b">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Специальности</h3>
            <div className="flex flex-wrap gap-2">
              {specializations.map((spec) => (
                <button
                  key={spec}
                  onClick={() => toggleFilter(spec)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    selectedFilters.has(spec)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Список пользователей */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Загрузка специалистов...</span>
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
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <Card 
                    key={user.id || user.uid} 
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedUser?.id === user.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleUserSelect(user)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
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
                          {selectedUser?.id === user.id && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{getUserName(user)}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-blue-600 font-medium">{getUserRating(user)}</span>
                            <span className="text-gray-600 text-sm truncate">{getUserSpecialization(user)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Правая панель - форма предложения */}
        <div className="w-1/2 flex flex-col">
          {/* Заголовок */}
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Детали предложения</h3>
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {/* Форма */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {selectedUser && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Получатель</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    {selectedUser.avatar ? (
                      <img src={selectedUser.avatar} alt={getUserName(selectedUser)} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {getUserName(selectedUser).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{getUserName(selectedUser)}</p>
                    <p className="text-sm text-gray-600">{getUserSpecialization(selectedUser)}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип проекта
              </label>
              <select
                value={formData.projectType}
                onChange={(e) => handleFormChange('projectType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="with_project">С проектом</option>
                <option value="without_project">Без проекта</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ставка
              </label>
              <input
                type="text"
                value={formData.rate}
                onChange={(e) => handleFormChange('rate', e.target.value)}
                placeholder="100000 руб/мес или Договорная"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата начала
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleFormChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Предполагаемая длительность
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => handleFormChange('estimatedDuration', e.target.value)}
                  placeholder="6"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={formData.estimatedDurationUnit}
                  onChange={(e) => handleFormChange('estimatedDurationUnit', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="days">дней</option>
                  <option value="weeks">недель</option>
                  <option value="months">месяцев</option>
                  <option value="years">лет</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Сопроводительное письмо *
              </label>
              <textarea
                value={formData.coverLetter}
                onChange={(e) => handleFormChange('coverLetter', e.target.value)}
                placeholder="Опишите детали предложения, требования к кандидату и условия сотрудничества..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Техническое задание (URL)
              </label>
              <input
                type="url"
                value={formData.attachmentUrl}
                onChange={(e) => handleFormChange('attachmentUrl', e.target.value)}
                placeholder="https://example.com/technical-specification.pdf"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedUser ? `Получатель: ${getUserName(selectedUser)}` : 'Выберите получателя'}
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
                  onClick={handleSendProposal}
                  disabled={!selectedUser || !formData.coverLetter.trim() || sending}
                  className="flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Отправка...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Отправить предложение
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 