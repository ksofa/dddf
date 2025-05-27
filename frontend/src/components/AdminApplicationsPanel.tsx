import React, { useState, useEffect } from 'react';
import { getApplications } from '../api/applications';
import { getUsers } from '../api/auth';
import { apiClient } from '../api/config';

interface BackendApplication {
  id: string;
  type?: string;
  status: 'pending' | 'approved' | 'rejected';
  senderId?: string;
  receiverId?: string;
  projectTitle?: string;
  projectDescription?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  techSpec?: string;
  rate?: string;
  startDate?: string;
  estimatedDuration?: string;
  coverLetter?: string;
  createdAt: string;
  assignedTeamLead?: string;
  teamMembers?: string[];
  // Legacy fields for backward compatibility
  title?: string;
  description?: string;
  budget?: number;
  deadline?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

export const AdminApplicationsPanel: React.FC = () => {
  const [applications, setApplications] = useState<BackendApplication[]>([]);
  const [projectManagers, setProjectManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загружаем заявки через основной API с отключением кэша
      const response = await apiClient.get('/applications', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      setApplications(response.data);
      
      // Загружаем пользователей с ролью pm
      const usersResponse = await apiClient.get('/users', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const pms = usersResponse.data.filter((user: User) => 
        user.roles.includes('pm')
      );
      setProjectManagers(pms);
      
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const assignPM = async (applicationId: string, pmId: string) => {
    try {
      await apiClient.post(`/applications/${applicationId}/assign-pm`, {
        pmId: pmId
      });
      
      // Обновляем локальное состояние
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { 
              ...app, 
              assignedTeamLead: pmId
            }
          : app
      ));
      
    } catch (err: any) {
      setError(err.message || 'Ошибка назначения PM');
    }
  };

  const approveApplication = async (applicationId: string, pmId: string) => {
    try {
      await apiClient.post(`/applications/${applicationId}/approve`, {
        pmId: pmId
      });
      
      // Обновляем локальное состояние
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { 
              ...app, 
              status: 'approved' as const,
              assignedTeamLead: pmId
            }
          : app
      ));
      
    } catch (err: any) {
      setError(err.message || 'Ошибка одобрения заявки');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Загрузка заявок...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-600">{error}</div>
        <button 
          onClick={loadData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  // Фильтруем только заявки от клиентов
  const clientApplications = applications.filter(app => 
    !app.type || app.type === 'client_request' || app.projectTitle
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Управление заявками</h2>
      
      {clientApplications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Заявок от клиентов пока нет
        </div>
      ) : (
        <div className="space-y-4">
          {clientApplications.map((app) => (
            <div key={app.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{app.projectTitle || app.title || 'Без названия'}</h3>
                  <p className="text-gray-600 mb-2">{app.projectDescription || app.description || 'Без описания'}</p>
                  <div className="text-sm text-gray-500">
                    <div>Заказчик: {app.fullName || app.userName || 'Не указан'}</div>
                    <div>Email: {app.email || app.userEmail || 'Не указан'}</div>
                    <div>Телефон: {app.phone || 'Не указан'}</div>
                    <div>Ставка: {app.rate || 'Договорная'}</div>
                    <div>Создано: {new Date(app.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    app.status === 'approved' ? 'bg-green-100 text-green-800' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {app.status === 'pending' ? 'Ожидает' :
                     app.status === 'approved' ? 'Одобрена' :
                     app.status === 'rejected' ? 'Отклонена' :
                     app.status}
                  </span>
                  
                  {app.assignedTeamLead && (
                    <div className="text-sm text-gray-600">
                      PM: {projectManagers.find(pm => pm.id === app.assignedTeamLead)?.fullName || 'Назначен'}
                    </div>
                  )}
                </div>
              </div>
              
              {app.status === 'pending' && !app.assignedTeamLead && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Назначить проект-менеджера и одобрить заявку:
                  </label>
                  <div className="flex space-x-2">
                    <select 
                      id={`pm-select-${app.id}`}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                      defaultValue=""
                    >
                      <option value="">Выберите PM...</option>
                      {projectManagers.map((pm) => (
                        <option key={pm.id} value={pm.id}>
                          {pm.fullName} ({pm.email})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const selectElement = document.getElementById(`pm-select-${app.id}`) as HTMLSelectElement;
                        const pmId = selectElement.value;
                        if (pmId) {
                          approveApplication(app.id, pmId);
                        } else {
                          setError('Выберите проект-менеджера');
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Одобрить
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 