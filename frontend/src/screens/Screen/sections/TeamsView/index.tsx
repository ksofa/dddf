import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { apiClient } from '../../../../api/config';
import { useAuth } from '../../../../hooks/useAuth';

interface Project {
  id: string;
  title: string;
  description: string;
  role: 'pm' | 'member';
  teamMembers?: string[];
  manager?: string;
  status?: string[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  roles: string[];
  avatar?: string;
  role: 'pm' | 'lead' | 'member';
  specialization?: string;
  joinedAt?: string;
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
  skills?: string[];
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'pm':
      case 'lead':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'pm':
        return 'Project Manager';
      case 'lead':
        return 'Team Lead';
      case 'member':
        return 'Участник';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Загрузка проектов...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Показываем команду конкретного проекта
  if (selectedProject) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <Button
                variant="ghost"
                onClick={handleBackToProjects}
                className="mb-3 text-blue-600 hover:text-blue-800 p-0"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Назад к проектам
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">
                Команда проекта
              </h1>
              <p className="text-gray-600 mt-1">{selectedProject.projectTitle}</p>
            </div>
            {selectedProject.canManage && (
              <Button 
                onClick={handleInviteClick}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Пригласить участника
              </Button>
            )}
          </div>

          {teamLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Загрузка команды...</span>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {/* Статистика команды */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{selectedProject.teamMembers.length}</p>
                        <p className="text-gray-600">Участников</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedProject.teamMembers.filter(m => m.role === 'pm' || m.role === 'lead').length}
                        </p>
                        <p className="text-gray-600">Руководителей</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedProject.teamMembers.filter(m => m.role === 'member').length}
                        </p>
                        <p className="text-gray-600">Исполнителей</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Список участников команды */}
              <div className="grid gap-4">
                {selectedProject.teamMembers.map((member) => (
                  <Card key={member.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <span className="text-white font-semibold text-lg">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{member.name}</h3>
                            <p className="text-gray-600">{member.email}</p>
                            {member.specialization && (
                              <p className="text-sm text-gray-500 mt-1">{member.specialization}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getRoleColor(member.role)}>
                            {getRoleLabel(member.role)}
                          </Badge>
                          {member.roles && member.roles.length > 0 && (
                            <div className="flex gap-1">
                              {member.roles.map((role, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Модальное окно приглашения */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Пригласить участника</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInviteModal(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Поиск исполнителя
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Введите имя или email..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {executors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {executors.map((executor) => (
                      <div
                        key={executor.id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 ${
                          selectedExecutor?.id === executor.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => setSelectedExecutor(executor)}
                      >
                        <div className="font-medium">{executor.name}</div>
                        <div className="text-sm text-gray-600">{executor.email}</div>
                        {executor.specialization && (
                          <div className="text-xs text-gray-500">{executor.specialization}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Сообщение (необязательно)
                  </label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Добавьте сообщение к приглашению..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleSendInvitation}
                    disabled={!selectedExecutor || inviteLoading}
                    className="flex-1"
                  >
                    {inviteLoading ? 'Отправка...' : 'Отправить приглашение'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Показываем список проектов
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Команды проектов</h1>
          <p className="text-gray-600 mt-1">Управляйте командами ваших проектов</p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет доступных проектов</h3>
            <p className="text-gray-500">Проекты с командами будут отображаться здесь</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => handleProjectClick(project.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                      <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
                    </div>
                    <Badge className={project.role === 'pm' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                      {project.role === 'pm' ? 'Менеджер' : 'Участник'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{project.teamMembers?.length || 0} участников</span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};