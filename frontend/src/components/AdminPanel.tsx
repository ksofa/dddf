import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/config';

interface User {
  id: string;
  uid: string;
  email: string;
  name: string;
  displayName: string;
  role: string;
  roles: string[];
  categories: string[];
  createdAt: any;
}

interface Application {
  id: string;
  fullName: string;
  phone: string;
  projectTitle: string;
  projectDescription: string;
  email?: string;
  techSpec?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'applications'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRoles, setNewRoles] = useState<string[]>([]);

  const roles = [
    { value: 'admin', label: 'Администратор' },
    { value: 'customer', label: 'Заказчик' },
    { value: 'pm', label: 'Проект-менеджер' },
    { value: 'executor', label: 'Исполнитель' }
  ];

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else {
      loadApplications();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
    setLoading(false);
  };

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/applications', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      setApplications(response.data);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
    setLoading(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewRoles([...user.roles]);
  };

  const handleSaveUserRoles = async () => {
    if (!editingUser) return;

    try {
      await apiClient.put(`/users/${editingUser.id}/roles`, {
        roles: newRoles,
        role: newRoles[0]
      });
      
      // Обновляем локальный список
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, roles: newRoles, role: newRoles[0] }
          : user
      ));
      
      setEditingUser(null);
      setNewRoles([]);
    } catch (error) {
      console.error('Error updating user roles:', error);
    }
  };

  const handleApproveApplication = async (applicationId: string) => {
    try {
      await apiClient.post(`/applications/${applicationId}/approve`);
      loadApplications(); // Перезагружаем список
    } catch (error) {
      console.error('Error approving application:', error);
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    try {
      await apiClient.post(`/applications/${applicationId}/reject`);
      loadApplications(); // Перезагружаем список
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  };

  const toggleRole = (roleValue: string) => {
    if (newRoles.includes(roleValue)) {
      setNewRoles(newRoles.filter(r => r !== roleValue));
    } else {
      setNewRoles([...newRoles, roleValue]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5F8] p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Панель администратора</h1>
        
        {/* Табы */}
        <div className="flex gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'users'
                ? 'bg-[#5B7FC7] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('users')}
          >
            Пользователи
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'applications'
                ? 'bg-[#5B7FC7] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('applications')}
          >
            Заявки
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5B7FC7]"></div>
          </div>
        ) : (
          <>
            {/* Управление пользователями */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Пользователь
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Роли
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дата регистрации
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map((role) => (
                                <span
                                  key={role}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {roles.find(r => r.value === role)?.label || role}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-[#5B7FC7] hover:text-[#4070C4] mr-4"
                            >
                              Редактировать
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Управление заявками */}
            {activeTab === 'applications' && (
              <div className="grid gap-6">
                {applications.map((application) => (
                  <div key={application.id} className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{application.projectTitle}</h3>
                        <p className="text-gray-600">{application.fullName} • {application.phone}</p>
                        {application.email && (
                          <p className="text-gray-600">{application.email}</p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          application.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : application.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {application.status === 'pending' ? 'Ожидает' : 
                         application.status === 'approved' ? 'Одобрено' : 'Отклонено'}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{application.projectDescription}</p>
                    
                    {application.techSpec && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Техническое задание:</h4>
                        <p className="text-gray-600 text-sm">{application.techSpec}</p>
                      </div>
                    )}
                    
                    {application.status === 'pending' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApproveApplication(application.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          Одобрить
                        </button>
                        <button
                          onClick={() => handleRejectApplication(application.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          Отклонить
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Модальное окно редактирования ролей */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Редактировать роли: {editingUser.name}
              </h3>
              
              <div className="space-y-3 mb-6">
                {roles.map((role) => (
                  <label key={role.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newRoles.includes(role.value)}
                      onChange={() => toggleRole(role.value)}
                      className="mr-3 h-4 w-4 text-[#5B7FC7] focus:ring-[#5B7FC7] border-gray-300 rounded"
                    />
                    <span className="text-sm">{role.label}</span>
                  </label>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleSaveUserRoles}
                  disabled={newRoles.length === 0}
                  className="flex-1 px-4 py-2 bg-[#5B7FC7] text-white rounded-lg hover:bg-[#4070C4] transition disabled:opacity-50"
                >
                  Сохранить
                </button>
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setNewRoles([]);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 