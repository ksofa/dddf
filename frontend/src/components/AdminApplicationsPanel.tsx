import React, { useState, useEffect } from 'react';
import { getApplications } from '../api/applications';
import { getUsers } from '../api/auth';
import { apiClient } from '../api/config';

interface Application {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: string;
  createdAt: string;
  userId: string;
  userEmail: string;
  userName: string;
  assignedPM?: string;
  assignedPMName?: string;
}

interface User {
  uid: string;
  email: string;
  displayName: string;
  roles: string[];
}

export const AdminApplicationsPanel: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [projectManagers, setProjectManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загружаем заявки
      const appsResponse = await getApplications();
      setApplications(appsResponse);
      
      // Загружаем пользователей с ролью pm
      const usersResponse = await apiClient.get('/users');
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
        projectManagerId: pmId
      });
      
      // Обновляем локальное состояние
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { 
              ...app, 
              assignedPM: pmId,
              assignedPMName: projectManagers.find(pm => pm.uid === pmId)?.displayName
            }
          : app
      ));
      
    } catch (err: any) {
      setError(err.message || 'Ошибка назначения PM');
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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Управление заявками</h2>
      
      {applications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Заявок пока нет
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{app.title}</h3>
                  <p className="text-gray-600 mb-2">{app.description}</p>
                  <div className="text-sm text-gray-500">
                    <div>Заказчик: {app.userName} ({app.userEmail})</div>
                    <div>Бюджет: {app.budget.toLocaleString()} ₽</div>
                    <div>Дедлайн: {new Date(app.deadline).toLocaleDateString()}</div>
                    <div>Создано: {new Date(app.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    app.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    app.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {app.status === 'pending' ? 'Ожидает' :
                     app.status === 'assigned' ? 'Назначен PM' :
                     app.status === 'in_progress' ? 'В работе' :
                     app.status}
                  </span>
                  
                  {app.assignedPM && (
                    <div className="text-sm text-gray-600">
                      PM: {app.assignedPMName}
                    </div>
                  )}
                </div>
              </div>
              
              {!app.assignedPM && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Назначить проект-менеджера:
                  </label>
                  <div className="flex space-x-2">
                    <select 
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                      onChange={(e) => {
                        if (e.target.value) {
                          assignPM(app.id, e.target.value);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">Выберите PM...</option>
                      {projectManagers.map((pm) => (
                        <option key={pm.uid} value={pm.uid}>
                          {pm.displayName} ({pm.email})
                        </option>
                      ))}
                    </select>
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