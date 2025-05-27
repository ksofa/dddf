import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { InvitationsScreen } from './InvitationsScreen';
import { AdminApplicationsScreen } from './AdminApplicationsScreen';
import { ClientApplicationScreen } from './ClientApplicationScreen';
import { getProjectTeamInvitations } from '../../api/invitations';
import { apiClient } from '../../api/config';

// Интерфейс для приглашений PM
interface PMInvitation {
  id: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  userEmail: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
}

// Компонент для PM пользователей
const PMInvitationsScreen: React.FC = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<PMInvitation[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Загружаем проекты PM
      const projectsResponse = await apiClient.get('/projects');
      setProjects(projectsResponse.data);

      // Загружаем все приглашения для всех проектов PM
      const allInvitations: PMInvitation[] = [];
      for (const project of projectsResponse.data) {
        try {
          const projectInvitations = await getProjectTeamInvitations(project.id);
          allInvitations.push(...projectInvitations);
        } catch (err) {
          console.warn(`Failed to load invitations for project ${project.id}:`, err);
        }
      }

      setInvitations(allInvitations);
    } catch (err: any) {
      console.error('Error loading PM data:', err);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvitations = selectedProject === 'all' 
    ? invitations 
    : invitations.filter(inv => inv.projectId === selectedProject);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает ответа';
      case 'accepted': return 'Принято';
      case 'rejected': return 'Отклонено';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка приглашений...</div>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Отправленные приглашения</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все проекты</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.title || project.name}
              </option>
            ))}
          </select>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Обновить
          </button>
        </div>
      </div>

      {filteredInvitations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {selectedProject === 'all' 
              ? 'Вы еще не отправляли приглашений' 
              : 'Нет приглашений для выбранного проекта'
            }
          </div>
          <p className="text-sm text-gray-400">
            Приглашения, отправленные участникам команды, будут отображаться здесь
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInvitations.map((invitation) => (
            <div
              key={invitation.id}
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {invitation.projectName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Приглашен: <span className="font-medium">{invitation.userName}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Email: <span className="font-medium">{invitation.userEmail}</span>
                  </p>
                  {invitation.message && (
                    <p className="text-gray-700 mb-4">
                      Сообщение: "{invitation.message}"
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Отправлено: {new Date(invitation.createdAt.toDate()).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <div className="ml-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invitation.status)}`}>
                    {getStatusText(invitation.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Статистика</h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-blue-600 font-medium">Всего:</span>
            <span className="ml-1">{filteredInvitations.length}</span>
          </div>
          <div>
            <span className="text-yellow-600 font-medium">Ожидают:</span>
            <span className="ml-1">{filteredInvitations.filter(i => i.status === 'pending').length}</span>
          </div>
          <div>
            <span className="text-green-600 font-medium">Приняты:</span>
            <span className="ml-1">{filteredInvitations.filter(i => i.status === 'accepted').length}</span>
          </div>
          <div>
            <span className="text-red-600 font-medium">Отклонены:</span>
            <span className="ml-1">{filteredInvitations.filter(i => i.status === 'rejected').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const UniversalInvitationsScreen: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Необходима авторизация</h2>
          <p className="text-gray-600">Войдите в систему для просмотра заявок</p>
        </div>
      </div>
    );
  }

  // Определяем роль пользователя и показываем соответствующий интерфейс
  const userRoles = user.roles || [];

  // Админ видит заявки от заказчиков
  if (userRoles.includes('admin')) {
    return <AdminApplicationsScreen />;
  }

  // PM видит отправленные приглашения
  if (userRoles.includes('pm') || userRoles.includes('pm')) {
    return <PMInvitationsScreen />;
  }

  // Заказчик видит свои заявки на проекты
  if (userRoles.includes('client')) {
    return <ClientApplicationScreen />;
  }

  // Исполнитель видит приглашения в команды
  if (userRoles.includes('executor')) {
    return <InvitationsScreen />;
  }

  // По умолчанию показываем приглашения в команды
  return <InvitationsScreen />;
}; 