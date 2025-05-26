import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../../api/config';
import { useAuth } from '../../../../hooks/useAuth';

interface Project {
  id: string;
  title: string;
  description: string;
  role: 'pm' | 'member';
  teamMembers?: string[];
  manager?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  roles: string[];
  avatar?: string;
  role: 'pm' | 'lead' | 'member';
}

interface ProjectTeam {
  projectId: string;
  projectTitle: string;
  teamMembers: TeamMember[];
  canManage: boolean;
}

interface Executor {
  id: string;
  name: string;
  email: string;
  specialization: string;
  avatar?: string;
}

export const TeamsView: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Модальное окно приглашения
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExecutor, setSelectedExecutor] = useState<Executor | null>(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Загружаем проекты где пользователь участвует
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get('/teams');
        setProjects(response.data);
      } catch (error: any) {
        console.error('Error fetching projects:', error);
        setError('Не удалось загрузить проекты');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProjects();
    }
  }, [user]);

  // Загружаем команду конкретного проекта
  const handleProjectClick = async (projectId: string) => {
    try {
      setTeamLoading(true);
      setError(null);
      
      const response = await apiClient.get(`/projects/${projectId}/team`);
      setSelectedProject(response.data);
    } catch (error: any) {
      console.error('Error fetching team:', error);
      setError('Не удалось загрузить команду проекта');
    } finally {
      setTeamLoading(false);
    }
  };

  // Поиск исполнителей
  const searchExecutors = async (query: string = '') => {
    try {
      const response = await apiClient.get(`/executors/search?q=${encodeURIComponent(query)}`);
      setExecutors(response.data);
    } catch (error: any) {
      console.error('Error searching executors:', error);
    }
  };

  // Открытие модального окна приглашения
  const handleInviteClick = async () => {
    setShowInviteModal(true);
    await searchExecutors();
  };

  // Отправка приглашения
  const handleSendInvitation = async () => {
    if (!selectedExecutor || !selectedProject) return;

    try {
      setInviteLoading(true);
      
      await apiClient.post(`/projects/${selectedProject.projectId}/invite`, {
        executorId: selectedExecutor.id,
        message: inviteMessage
      });

      // Закрываем модальное окно и обновляем команду
      setShowInviteModal(false);
      setSelectedExecutor(null);
      setInviteMessage('');
      
      // Перезагружаем команду
      await handleProjectClick(selectedProject.projectId);
      
      alert('Приглашение отправлено успешно!');
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      alert('Ошибка при отправке приглашения');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  // Поиск исполнителей при изменении запроса
  useEffect(() => {
    if (showInviteModal) {
      const timeoutId = setTimeout(() => {
        searchExecutors(searchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, showInviteModal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка проектов...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // Показываем команду конкретного проекта
  if (selectedProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={handleBackToProjects}
              className="text-blue-600 hover:text-blue-800 mb-2"
            >
              ← Назад к проектам
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              Команда проекта: {selectedProject.projectTitle}
            </h2>
          </div>
          {selectedProject.canManage && (
            <button 
              onClick={handleInviteClick}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Пригласить участника
            </button>
          )}
        </div>

        {teamLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Загрузка команды...</div>
          </div>
        ) : (
          <div className="grid gap-4">
            {selectedProject.teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-medium">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        member.role === 'pm' ? 'bg-purple-100 text-purple-800' :
                        member.role === 'lead' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role === 'pm' ? 'Project Manager' :
                         member.role === 'lead' ? 'Team Lead' : 'Участник'}
                      </span>
                      {member.roles.map((role) => (
                        <span
                          key={role}
                          className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Модальное окно приглашения */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Пригласить исполнителя</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Поиск исполнителей */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Поиск исполнителя
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Введите имя или email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Список исполнителей */}
              <div className="mb-4 max-h-48 overflow-y-auto">
                {executors.map((executor) => (
                  <div
                    key={executor.id}
                    onClick={() => setSelectedExecutor(executor)}
                    className={`p-3 rounded-lg cursor-pointer border mb-2 ${
                      selectedExecutor?.id === executor.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        {executor.avatar ? (
                          <img
                            src={executor.avatar}
                            alt={executor.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium">
                            {executor.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{executor.name}</p>
                        <p className="text-xs text-gray-500">{executor.email}</p>
                        <p className="text-xs text-gray-400">{executor.specialization}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Сообщение приглашения */}
              {selectedExecutor && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Сообщение (необязательно)
                  </label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder={`Приглашаем вас в проект "${selectedProject.projectTitle}"`}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Кнопки */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSendInvitation}
                  disabled={!selectedExecutor || inviteLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviteLoading ? 'Отправка...' : 'Отправить приглашение'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Показываем список проектов
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Мои команды</h2>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">Команды не найдены</div>
          <p className="text-sm text-gray-400">
            Вы не участвуете ни в одном проекте
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleProjectClick(project.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {project.description}
                  </p>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      project.role === 'pm' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {project.role === 'pm' ? 'Project Manager' : 'Участник'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {project.teamMembers?.length || 0} участников
                    </span>
                  </div>
                </div>
                <div className="text-gray-400">
                  →
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};