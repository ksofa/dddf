import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUsers } from "../../api/auth";
import { sendInvitation } from "../../api/invitations";
import { useAuth } from "../../hooks/useAuth";

interface User {
  uid: string;
  email: string;
  displayName: string;
  roles: string[];
  specialization?: string;
}

export const AddTeamMemberScreen: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [invitationMessage, setInvitationMessage] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);

  console.log('AddTeamMemberScreen rendered', { projectId, user });

  useEffect(() => {
    console.log('useEffect triggered, loading users...');
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log('Starting to load users...');
      setLoading(true);
      setError(null);
      const usersData = await getUsers();
      console.log('Users loaded:', usersData);
      
      // Фильтруем только исполнителей (не админов и не PM)
      const executors = usersData.filter(u => 
        u.roles && (
          u.roles.includes('developer') || 
          u.roles.includes('designer') || 
          u.roles.includes('qa') || 
          u.roles.includes('team_lead') ||
          u.roles.includes('executor')
        )
      );
      console.log('Filtered executors:', executors);
      setUsers(executors);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Ошибка при загрузке пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = (user: User) => {
    setSelectedUser(user);
    setInvitationMessage(`Приглашаем вас присоединиться к нашему проекту! Ваши навыки в области ${user.specialization || 'разработки'} будут очень полезны для команды.`);
    setShowInviteModal(true);
  };

  const handleSendInvitation = async () => {
    if (!selectedUser) return;

    try {
      setSending(selectedUser.uid);
      await sendInvitation(projectId!, selectedUser.uid, invitationMessage);
      
      // Показываем успешное сообщение
      alert(`Заявка отправлена пользователю ${selectedUser.displayName}!`);
      
      // Закрываем модальное окно
      setShowInviteModal(false);
      setSelectedUser(null);
      setInvitationMessage("");
      
      // Возвращаемся к команде
      navigate(`/projects/${projectId}/team`);
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert(`Ошибка при отправке заявки: ${error.message}`);
    } finally {
      setSending(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.specialization && u.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isPM = user?.roles?.includes('pm') || user?.roles?.includes('project_manager') || user?.role === 'pm';

  console.log('Render state:', { loading, error, isPM, usersCount: users.length });

  // Показываем ошибку если есть
  if (error) {
    return (
      <div className="min-h-screen bg-[#F3F5F8] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Ошибка</h2>
          <p className="text-[#A5A5A7] mb-4">{error}</p>
          <button
            onClick={() => navigate(`/projects/${projectId}/team`)}
            className="px-4 py-2 bg-[#2982FD] text-white rounded-lg hover:bg-[#3771C8]"
          >
            Вернуться к команде
          </button>
        </div>
      </div>
    );
  }

  if (!isPM) {
    return (
      <div className="min-h-screen bg-[#F3F5F8] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Доступ запрещен</h2>
          <p className="text-[#A5A5A7] mb-4">Только проект-менеджеры могут приглашать участников</p>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-[#2982FD] text-white rounded-lg hover:bg-[#3771C8]"
          >
            Вернуться к проектам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F5F8]">
      {/* Хедер */}
      <header className="bg-white border-b border-[#E6EAF2] px-4 sm:px-6 md:px-8 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/projects/${projectId}/team`)}
            className="text-[#A5A5A7] hover:text-[#222] transition-colors"
          >
            ← Назад к команде
          </button>
          <h1 className="text-xl sm:text-2xl font-semibold">Пригласить участника</h1>
        </div>
      </header>

      {/* Контент */}
      <main className="p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Поиск */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#ECECEC] mb-6">
            <input
              type="text"
              placeholder="Поиск по имени, email или специализации..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-[#ECECEC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2982FD] focus:border-transparent"
            />
          </div>

          {/* Список пользователей */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#ECECEC]">
            <h2 className="text-lg font-semibold mb-4">Доступные исполнители</h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2982FD]"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#A5A5A7]">
                  {searchTerm ? 'Пользователи не найдены' : 'Нет доступных исполнителей'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => (
                  <div key={user.uid} className="border border-[#ECECEC] rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-[#F3F7FE] rounded-full flex items-center justify-center">
                        <span className="text-[#2982FD] font-semibold">
                          {user.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{user.displayName}</p>
                        <p className="text-sm text-[#A5A5A7]">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-[#A5A5A7]">Специализация:</p>
                      <p className="text-sm font-medium">
                        {user.specialization || 'Не указана'}
                      </p>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-[#A5A5A7]">Роли:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className="px-2 py-1 bg-[#F3F7FE] text-[#2982FD] text-xs rounded"
                          >
                            {role === 'developer' ? 'Разработчик' :
                             role === 'designer' ? 'Дизайнер' :
                             role === 'qa' ? 'QA' :
                             role === 'team_lead' ? 'Тимлид' :
                             role === 'executor' ? 'Исполнитель' :
                             role}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleInviteUser(user)}
                      disabled={sending === user.uid}
                      className="w-full px-4 py-2 bg-[#2982FD] text-white rounded-lg hover:bg-[#3771C8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {sending === user.uid ? 'Отправка...' : 'Отправить заявку'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Модальное окно для отправки заявки */}
      {showInviteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Отправить заявку пользователю {selectedUser.displayName}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Сообщение:
              </label>
              <textarea
                value={invitationMessage}
                onChange={(e) => setInvitationMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-[#ECECEC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2982FD] focus:border-transparent"
                placeholder="Введите сообщение для приглашения..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedUser(null);
                  setInvitationMessage("");
                }}
                className="flex-1 px-4 py-2 border border-[#ECECEC] text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleSendInvitation}
                disabled={sending === selectedUser.uid}
                className="flex-1 px-4 py-2 bg-[#2982FD] text-white rounded-lg hover:bg-[#3771C8] disabled:opacity-50"
              >
                {sending === selectedUser.uid ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 