import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProjectTeam, getAvailableExecutors, sendInvitationToExecutor, removeExecutorFromTeam } from "../../api/projects";
import { useAuth } from "../../hooks/useAuth";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface Team {
  projectId: string;
  projectTitle: string;
  teamMembers: TeamMember[];
  canManage: boolean;
  teamLead?: {
    id: string;
    displayName: string;
    email: string;
  };
  customerInfo?: {
    fullName: string;
    phone: string;
    email: string;
  };
}

interface Executor {
  id: string;
  name: string;
  displayName: string;
  email: string;
  specialization: string;
  roles: string[];
}

interface ProjectTeamScreenProps {
  projectId: string;
}

const ProjectTeamScreen: React.FC<ProjectTeamScreenProps> = ({ projectId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [availableExecutors, setAvailableExecutors] = useState<Executor[]>([]);
  const [selectedExecutor, setSelectedExecutor] = useState<Executor | null>(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [loadingExecutors, setLoadingExecutors] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    loadTeam();
  }, [projectId]);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const teamData = await getProjectTeam(projectId);
      setTeam(teamData);
      
      console.log('🔍 Team data loaded:', {
        projectId,
        userId: user?.uid,
        userRoles: user?.roles,
        teamManager: teamData?.teamLead?.displayName,
        teamData
      });
    } catch (error) {
      console.error('Error loading team:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableExecutors = async () => {
    try {
      setLoadingExecutors(true);
      const executors = await getAvailableExecutors();
      
      // Фильтруем исполнителей, которые уже в команде
      const teamMemberIds = team?.teamMembers?.map(member => member.id) || [];
      const filteredExecutors = executors.filter((executor: Executor) => 
        !teamMemberIds.includes(executor.id)
      );
      
      setAvailableExecutors(filteredExecutors);
    } catch (error) {
      console.error('Error loading executors:', error);
      alert('Ошибка при загрузке списка исполнителей');
    } finally {
      setLoadingExecutors(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!selectedExecutor) return;

    try {
      setSendingInvite(true);
      await sendInvitationToExecutor(
        projectId, 
        selectedExecutor.id, 
        inviteMessage || `Приглашаем вас присоединиться к проекту!`
      );
      
      alert('Приглашение отправлено исполнителю!');
      setShowInviteModal(false);
      setSelectedExecutor(null);
      setInviteMessage('');
      
      // Обновляем список доступных исполнителей
      loadAvailableExecutors();
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Ошибка при отправке приглашения');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRemoveExecutor = async (executorId: string) => {
    if (!confirm('Вы уверены, что хотите удалить исполнителя из команды?')) {
      return;
    }

    try {
      await removeExecutorFromTeam(projectId, executorId);
      await loadTeam(); // Перезагружаем команду
    } catch (error) {
      console.error('Error removing executor:', error);
      alert('Ошибка при удалении исполнителя');
    }
  };

  const openInviteModal = () => {
    setShowInviteModal(true);
    loadAvailableExecutors();
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setSelectedExecutor(null);
    setInviteMessage('');
  };

  const isPM = user?.roles?.includes('pm') || user?.roles?.includes('project_manager') || user?.role === 'pm';
  
  // Дополнительная проверка - является ли пользователь менеджером этого проекта
  // team содержит данные из API: { projectId, projectTitle, teamMembers, canManage }
  const isProjectManager = team && user && (
    team.canManage || // API возвращает canManage: project.manager === userId
    user.roles?.includes('admin')
  );
  
  const canInvite = isPM && isProjectManager;
  
  console.log('🔍 Permission check for team invitations:', {
    userId: user?.uid,
    userRoles: user?.roles,
    isPM,
    isProjectManager,
    canInvite,
    canManageFromAPI: team?.canManage,
    teamData: team
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F5F8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2982FD]"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-[#F3F5F8] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Команда не найдена</h2>
          <p className="text-gray-600">Не удалось загрузить информацию о команде</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F5F8]">
      <div className="max-w-6xl mx-auto p-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">Команда проекта</h1>
              <p className="text-[#A5A5A7]">Управление участниками команды</p>
            </div>
          </div>
        </div>

        {/* Информация о заказчике */}
        {team.customerInfo && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#ECECEC] mb-6">
            <h2 className="text-lg font-semibold mb-4">Заказчик</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#F3F7FE] rounded-full flex items-center justify-center">
                <span className="text-[#2982FD] font-semibold">
                  {(team.customerInfo.fullName || 'З').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{team.customerInfo.fullName}</p>
                <p className="text-sm text-[#A5A5A7]">{team.customerInfo.email}</p>
                <p className="text-sm text-[#A5A5A7]">{team.customerInfo.phone}</p>
              </div>
            </div>
          </div>
        )}

        {/* Тимлид */}
        {team.teamLead && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#ECECEC] mb-6">
            <h2 className="text-lg font-semibold mb-4">Руководитель проекта</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#F3F7FE] rounded-full flex items-center justify-center">
                <span className="text-[#2982FD] font-semibold">
                  {(team.teamLead.displayName || 'У').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{team.teamLead.displayName || 'Неизвестный пользователь'}</p>
                <p className="text-sm text-[#A5A5A7]">{team.teamLead.email || ''}</p>
              </div>
            </div>
          </div>
        )}

        {/* Участники команды */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#ECECEC]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Участники команды</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#A5A5A7]">
                {team.teamMembers.length} участник{team.teamMembers.length !== 1 ? 'ов' : ''}
              </span>
              {canInvite && (
                <button
                  onClick={openInviteModal}
                  className="px-4 py-2 bg-[#2982FD] text-white rounded-lg text-sm font-medium hover:bg-[#1c5aa8] transition-colors"
                >
                  + Пригласить исполнителя
                </button>
              )}
            </div>
          </div>

          {team.teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#A5A5A7] mb-4">В команде пока нет участников</p>
              {canInvite && (
                <button
                  onClick={openInviteModal}
                  className="px-4 py-2 bg-[#2982FD] text-white rounded-lg text-sm font-medium hover:bg-[#1c5aa8] transition-colors"
                >
                  Пригласить первого исполнителя
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 border border-[#ECECEC] rounded-lg">
                  <div className="w-10 h-10 bg-[#F3F7FE] rounded-full flex items-center justify-center">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name || 'Участник'} className="w-10 h-10 rounded-full" />
                    ) : (
                      <span className="text-[#2982FD] font-semibold">
                        {(member.name || 'У').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{member.name || 'Неизвестный участник'}</p>
                    <p className="text-xs text-[#A5A5A7]">{member.role || 'Участник команды'}</p>
                  </div>
                  {canInvite && (
                    <button
                      onClick={() => handleRemoveExecutor(member.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      title="Удалить из команды"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно приглашения */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Заголовок модального окна */}
            <div className="p-6 border-b border-[#ECECEC]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Пригласить исполнителя</h2>
                <button
                  onClick={closeInviteModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-[#A5A5A7] mt-2">Выберите исполнителя для отправки приглашения в проект</p>
            </div>

            {/* Список исполнителей */}
            <div className="p-6">
              {loadingExecutors ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2982FD]"></div>
                </div>
              ) : availableExecutors.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#A5A5A7]">Нет доступных исполнителей для приглашения</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {availableExecutors.map((executor) => (
                    <div 
                      key={executor.id} 
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedExecutor?.id === executor.id 
                          ? 'border-[#2982FD] bg-[#F3F7FE]' 
                          : 'border-[#ECECEC] hover:border-[#2982FD]'
                      }`}
                      onClick={() => setSelectedExecutor(executor)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#F3F7FE] rounded-full flex items-center justify-center">
                          <span className="text-[#2982FD] font-semibold text-sm">
                            {(executor.displayName || executor.name || 'И').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{executor.displayName || executor.name || 'Неизвестный исполнитель'}</p>
                          <p className="text-xs text-[#A5A5A7]">{executor.specialization || 'Специализация не указана'}</p>
                          <p className="text-xs text-[#A5A5A7]">{executor.email}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedExecutor?.id === executor.id 
                          ? 'border-[#2982FD] bg-[#2982FD]' 
                          : 'border-[#ECECEC]'
                      }`}>
                        {selectedExecutor?.id === executor.id && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Сообщение приглашения */}
              {selectedExecutor && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Сообщение приглашения</label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Добавьте персональное сообщение к приглашению..."
                    className="w-full p-3 border border-[#ECECEC] rounded-lg resize-none focus:outline-none focus:border-[#2982FD]"
                    rows={3}
                  />
                </div>
              )}

              {/* Кнопки действий */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={closeInviteModal}
                  className="px-4 py-2 text-[#A5A5A7] hover:text-gray-700 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSendInvitation}
                  disabled={!selectedExecutor || sendingInvite}
                  className="px-6 py-2 bg-[#2982FD] text-white rounded-lg font-medium hover:bg-[#1c5aa8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sendingInvite && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Отправить приглашение
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { ProjectTeamScreen }; 