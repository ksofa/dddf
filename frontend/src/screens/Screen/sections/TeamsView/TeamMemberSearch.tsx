import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from "../../../../api/config";

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

const TeamMemberSearch: React.FC<TeamMemberSearchProps> = ({ teamId, onBack }) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const teamData = await response.json();
        setTeam(teamData);
      }
    } catch (error) {
      console.error('Error loading team:', error);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}/available-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users);
      } else {
        setError('Ошибка загрузки пользователей');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Ошибка загрузки пользователей');
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

  const handleInviteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: userId,
          projectType: 'with_project',
          coverLetter: 'Приглашение в команду'
        })
      });

      if (response.ok) {
        alert('Приглашение отправлено!');
      } else {
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.error || 'Не удалось отправить приглашение'}`);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Ошибка отправки приглашения');
    }
  };

  const handleAddToTeam = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          role: 'developer'
        })
      });

      if (response.ok) {
        alert('Участник добавлен в команду!');
        loadAvailableUsers(); // Обновляем список
      } else {
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.error || 'Не удалось добавить участника'}`);
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Ошибка добавления участника');
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

              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  РП
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  Проекты
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  Команды
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  Чаты
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  Заявки
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded">
                  Выйти
                </button>
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
                            onClick={() => handleInviteUser(user.id)}
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
    </div>
  );
};

export default TeamMemberSearch; 