import React, { useState, useEffect } from 'react';
import { apiClient } from "../../../../api/config";

interface User {
  id: string;
  fullName?: string;
  displayName?: string;
  email: string;
  profession?: string;
  specialization?: string;
  avatar?: string;
  rating?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
}

interface TeamMemberSearchProps {
  teamId: string | null;
  onBack: () => void;
}

interface InvitationFormData {
  projectType: 'with_project' | 'without_project';
  rate: string;
  startDate: string;
  estimatedDuration: string;
  estimatedDurationUnit: 'days' | 'weeks' | 'months';
  coverLetter: string;
  techSpecFile?: File;
}

const TeamMemberSearch: React.FC<TeamMemberSearchProps> = ({ teamId, onBack }) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [invitationForm, setInvitationForm] = useState<InvitationFormData>({
    projectType: 'with_project',
    rate: '',
    startDate: '',
    estimatedDuration: '',
    estimatedDurationUnit: 'months',
    coverLetter: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const professions = [
    'Front-End разработчик',
    'Back-End разработчик', 
    'Full Stack разработчик',
    'VUE.JS',
    'REACT.JS',
    'ANGULAR.JS',
    'Веб-разработчик'
  ];

  useEffect(() => {
    if (teamId) {
      loadTeamData();
      loadAvailableUsers();
    }
  }, [teamId]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, selectedProfession, availableUsers]);

  const loadTeamData = async () => {
    try {
      console.log('📡 Загружаем данные команды:', teamId);
      const response = await apiClient.get(`/teams/${teamId}`);
      setTeam(response.data);
      console.log('✅ Данные команды загружены:', response.data.name);
    } catch (error: any) {
      console.error('❌ Ошибка загрузки команды:', error);
      setError('Ошибка загрузки данных команды');
    }
  };

  const loadAvailableUsers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📡 Загружаем доступных пользователей для команды:', teamId);
      
      let response;
      let usedFallback = false;
      
      try {
        // Пробуем специальный эндпоинт команды
        response = await apiClient.get(`/teams/${teamId}/available-users`);
        console.log('✅ Эндпоинт команды работает, получено пользователей:', response.data.length);
      } catch (teamError: any) {
        console.log('⚠️ Эндпоинт команды недоступен, используем fallback');
        usedFallback = true;
        
        // Используем общий эндпоинт как fallback
        response = await apiClient.get('/users');
        console.log('✅ Загружены все пользователи (fallback):', response.data.length);
      }
      
      setAvailableUsers(response.data);
      if (usedFallback) {
        console.log('ℹ️ Использован fallback на общий эндпоинт пользователей');
      }
    } catch (error: any) {
      console.error('❌ Ошибка загрузки пользователей:', error);
      setError('Ошибка загрузки пользователей. Попробуйте обновить страницу.');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = availableUsers;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        (user.fullName || user.displayName || '').toLowerCase().includes(query) ||
        (user.profession || '').toLowerCase().includes(query) ||
        (user.specialization || '').toLowerCase().includes(query)
      );
    }

    if (selectedProfession) {
      filtered = filtered.filter(user => 
        user.profession === selectedProfession || 
        user.specialization === selectedProfession
      );
    }

    setFilteredUsers(filtered);
  };

  const handleInviteUser = async (user: User) => {
    setSelectedUser(user);
    setInvitationForm({
      projectType: 'with_project',
      rate: '',
      startDate: '',
      estimatedDuration: '',
      estimatedDurationUnit: 'months',
      coverLetter: `Приглашаем вас присоединиться к команде "${team?.name || 'нашей команды'}"! Ваши навыки в области ${user.profession || user.specialization || 'разработки'} будут очень полезны для нашего проекта.`
    });
    setShowInviteModal(true);
  };

  const handleSubmitInvitation = async () => {
    if (!selectedUser || !teamId) return;

    try {
      setSubmitting(true);
      console.log('📤 Отправляем приглашение с полными данными:', {
        receiverId: selectedUser.id,
        ...invitationForm
      });

      const hasFile = !!invitationForm.techSpecFile;
      const endpoint = hasFile ? 'invite' : 'invite-simple';
      
      let response;
      
      if (hasFile) {
        // Отправляем с файлом через FormData
        const formData = new FormData();
        formData.append('receiverId', selectedUser.id);
        formData.append('projectType', invitationForm.projectType);
        formData.append('rate', invitationForm.rate);
        formData.append('startDate', invitationForm.startDate);
        formData.append('estimatedDuration', invitationForm.estimatedDuration);
        formData.append('estimatedDurationUnit', invitationForm.estimatedDurationUnit);
        formData.append('coverLetter', invitationForm.coverLetter);
        formData.append('techSpecFile', invitationForm.techSpecFile);

        response = await fetch(`http://localhost:3000/api/teams/${teamId}/${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: formData
        });
      } else {
        // Отправляем без файла через JSON
        response = await fetch(`http://localhost:3000/api/teams/${teamId}/${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            receiverId: selectedUser.id,
            projectType: invitationForm.projectType,
            rate: invitationForm.rate,
            startDate: invitationForm.startDate,
            estimatedDuration: invitationForm.estimatedDuration,
            estimatedDurationUnit: invitationForm.estimatedDurationUnit,
            coverLetter: invitationForm.coverLetter
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка отправки приглашения');
      }

      const result = await response.json();
      console.log('✅ Приглашение отправлено:', result);
      
      alert(`Приглашение отправлено пользователю ${selectedUser.fullName || selectedUser.displayName}!`);
      setShowInviteModal(false);
      setSelectedUser(null);
      
      // Сбрасываем форму
      setInvitationForm({
        projectType: 'without_project',
        rate: '',
        startDate: '',
        estimatedDuration: '',
        estimatedDurationUnit: 'months',
        coverLetter: '',
        techSpecFile: undefined
      });
    } catch (error: any) {
      console.error('❌ Ошибка отправки приглашения:', error);
      alert(`Ошибка: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvitationForm(prev => ({ ...prev, techSpecFile: file }));
    }
  };

  const handleAddToTeam = async (userId: string) => {
    try {
      console.log('👥 Добавляем пользователя в команду:', userId);
      const response = await apiClient.post(`/teams/${teamId}/members`, {
        userId: userId,
        role: 'developer'
      });

      console.log('✅ Участник добавлен в команду:', response.data);
      alert('Участник добавлен в команду!');
      loadAvailableUsers(); // Обновляем список
    } catch (error: any) {
      console.error('❌ Ошибка добавления участника:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Не удалось добавить участника';
      alert(`Ошибка: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                ← Назад к командам
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Добавить в команду
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Сегодня {new Date().toLocaleDateString('ru-RU', { 
                day: 'numeric', 
                month: 'long' 
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Команда</h2>
              {team && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900">{team.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Счет:</h3>
                <div className="text-2xl font-bold text-green-600">1 000 000₽</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              {/* Search Header */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Кого вы хотите найти?</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Создать заявку
                  </button>
                </div>
                
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Например: «Java-разработчик»"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Profession Filter */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedProfession('')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      !selectedProfession 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Все
                  </button>
                  {professions.map((profession) => (
                    <button
                      key={profession}
                      onClick={() => setSelectedProfession(profession)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedProfession === profession
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {profession}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Загрузка...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600">{error}</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">👥</div>
                    <p className="text-gray-600">Специалисты не найдены</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                            ) : (
                              <span className="text-gray-600 text-sm">
                                {(user.fullName || user.displayName || user.email)[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {user.fullName || user.displayName || user.email}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {user.profession || user.specialization || 'Разработчик'}
                            </p>
                          </div>
                        </div>
                        
                        {user.rating && (
                          <div className="mb-3">
                            <span className="text-sm text-gray-600">Рейтинг: </span>
                            <span className="font-medium">{user.rating}</span>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAddToTeam(user.id)}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                          >
                            Добавить
                          </button>
                          <button
                            onClick={() => handleInviteUser(user)}
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                          >
                            Пригласить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно приглашения */}
      {showInviteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Заголовок */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Предложение</h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Содержимое формы */}
            <div className="p-6 space-y-6">
              {/* Информация о пользователе */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt="" className="w-12 h-12 rounded-full" />
                  ) : (
                    <span className="text-gray-600 font-medium">
                      {(selectedUser.fullName || selectedUser.displayName || selectedUser.email)[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {selectedUser.fullName || selectedUser.displayName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedUser.profession || selectedUser.specialization || 'Разработчик'}
                  </p>
                </div>
              </div>

              {/* Тип предложения */}
              <div>
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setInvitationForm(prev => ({ ...prev, projectType: 'without_project' }))}
                    className={`px-4 py-2 rounded-lg border ${
                      invitationForm.projectType === 'without_project'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Без проекта
                  </button>
                  <button
                    onClick={() => setInvitationForm(prev => ({ ...prev, projectType: 'with_project' }))}
                    className={`px-4 py-2 rounded-lg border ${
                      invitationForm.projectType === 'with_project'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    С проектом
                  </button>
                </div>
              </div>

              {/* Ставка */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ставка
                </label>
                <select
                  value={invitationForm.rate}
                  onChange={(e) => setInvitationForm(prev => ({ ...prev, rate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Выберите ставку</option>
                  <option value="Договорная">Договорная</option>
                  <option value="50000-80000">50 000 - 80 000 ₽</option>
                  <option value="80000-120000">80 000 - 120 000 ₽</option>
                  <option value="120000-200000">120 000 - 200 000 ₽</option>
                  <option value="200000+">200 000+ ₽</option>
                </select>
              </div>

              {/* Дата старта проекта */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата старта проекта
                </label>
                <input
                  type="date"
                  value={invitationForm.startDate}
                  onChange={(e) => setInvitationForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Оценочное время реализации */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Оценочное время реализации
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Количество"
                    value={invitationForm.estimatedDuration}
                    onChange={(e) => setInvitationForm(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={invitationForm.estimatedDurationUnit}
                    onChange={(e) => setInvitationForm(prev => ({ ...prev, estimatedDurationUnit: e.target.value as 'days' | 'weeks' | 'months' }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="days">Дней</option>
                    <option value="weeks">Недель</option>
                    <option value="months">Месяцев</option>
                  </select>
                </div>
              </div>

              {/* Загрузить техническое задание */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Загрузить техническое задание
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    id="tech-spec-file"
                  />
                  <label htmlFor="tech-spec-file" className="cursor-pointer">
                    <div className="text-gray-600">
                      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {invitationForm.techSpecFile ? (
                        <p className="text-sm font-medium">{invitationForm.techSpecFile.name}</p>
                      ) : (
                        <p className="text-sm">Нажмите для выбора файла или перетащите сюда</p>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Сопроводительное письмо */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сопроводительное письмо
                </label>
                <textarea
                  value={invitationForm.coverLetter}
                  onChange={(e) => setInvitationForm(prev => ({ ...prev, coverLetter: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Расскажите о проекте и почему вы хотите пригласить этого специалиста..."
                />
              </div>
            </div>

            {/* Кнопки */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmitInvitation}
                disabled={submitting || !invitationForm.rate || !invitationForm.coverLetter}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMemberSearch; 