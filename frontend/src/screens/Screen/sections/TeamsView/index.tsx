import React, { useState, useEffect } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { apiClient } from '../../../../api/config';
import { CreateTeamModal } from './CreateTeamModal';
import { AddMemberModal } from './AddMemberModal';
import { useAuth } from '../../../../contexts/AuthContext';

interface Team {
  id: string;
  name: string;
  title?: string;
  description: string;
  icon: string;
  color: string;
  members: TeamMember[];
  teamMembers?: TeamMember[];
  projectCount?: number;
  teamLead?: TeamMember;
  pm?: TeamMember;
  role?: string;
}

interface TeamMember {
  id: string;
  name: string;
  displayName?: string;
  fullName?: string;
  email: string;
  avatar?: string;
  role: string;
  roles?: string[];
  rating?: number;
  status?: 'online' | 'offline';
  lastSeen?: string;
  specialization?: string;
}

interface TeamDetails {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  teamLead: TeamMember | null;
  members: TeamMember[];
}

interface TeamsViewProps {
  onTeamMemberSearch?: (teamId: string) => void;
}

export const TeamsView: React.FC<TeamsViewProps> = ({ onTeamMemberSearch }) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/teams');
      const teamsData = response.data;
      
      console.log('Loaded teams:', teamsData);
      
      // Преобразуем данные команд
      const formattedTeams = teamsData.map((team: any, index: number) => ({
        id: team.id,
        name: team.name || 'Команда без названия',
        description: team.description || 'Описание отсутствует',
        icon: getTeamIcon(index),
        color: getTeamColor(index),
        members: team.teamMembers || team.members || [],
        teamLead: team.teamLead || team.pm || (team.members && team.members[0]) || null,
        pm: team.pm || null
      }));
      
      setTeams(formattedTeams);
    } catch (error: any) {
      console.error('Error fetching teams:', error);
      setError('Ошибка загрузки команд: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getTeamIcon = (index: number) => {
    const icons = ['🚀', '💻', '🎨', '📱', '⚡', '🔧', '🌟', '🎯', '💡', '🔥'];
    return icons[index % icons.length];
  };

  const getTeamColor = (index: number) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-purple-600',
      'bg-gradient-to-br from-green-500 to-teal-600',
      'bg-gradient-to-br from-purple-500 to-pink-600',
      'bg-gradient-to-br from-orange-500 to-red-600',
      'bg-gradient-to-br from-indigo-500 to-blue-600',
      'bg-gradient-to-br from-pink-500 to-rose-600',
      'bg-gradient-to-br from-teal-500 to-cyan-600',
      'bg-gradient-to-br from-yellow-500 to-orange-600',
      'bg-gradient-to-br from-red-500 to-pink-600',
      'bg-gradient-to-br from-cyan-500 to-blue-600'
    ];
    return colors[index % colors.length];
  };

  const handleTeamClick = async (teamId: string) => {
    try {
      setTeamLoading(true);
      
      // Получаем детальную информацию о команде
      const response = await apiClient.get(`/teams/${teamId}`);
      const teamData = response.data;
      
      console.log('Team details:', teamData);
      
      const teamDetails: TeamDetails = {
        id: teamData.id,
        name: teamData.name,
        description: teamData.description || 'Описание отсутствует',
        icon: getTeamIcon(0),
        color: getTeamColor(0),
        teamLead: teamData.teamLead || teamData.pm || (teamData.members && teamData.members[0]) || null,
        members: teamData.members || teamData.teamMembers || []
      };
      
      setSelectedTeam(teamDetails);
    } catch (error: any) {
      console.error('Error fetching team details:', error);
      alert('Ошибка загрузки команды: ' + (error.response?.data?.message || error.message));
    } finally {
      setTeamLoading(false);
    }
  };

  const handleBackToTeams = () => {
    setSelectedTeam(null);
  };

  const handleCreateTeam = async (teamData: any) => {
    try {
      await apiClient.post('/teams', teamData);
      await fetchTeams();
      setShowCreateModal(false);
    } catch (error: any) {
      console.error('Error creating team:', error);
      throw error;
    }
  };

  const handleAddMember = async () => {
    // Обновляем данные команды после добавления участника
    if (selectedTeam) {
      await handleTeamClick(selectedTeam.id);
    }
  };

  // Обработчик кнопки приглашения
  const handleInviteClick = (e: React.MouseEvent, team: Team) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 Invite button clicked for team:', team.name);
    
    // Если передан обработчик для поиска участников, используем его
    if (onTeamMemberSearch) {
      onTeamMemberSearch(team.id);
      return;
    }
    
    // Иначе используем старую логику с модальным окном
    const teamDetails: TeamDetails = {
      id: team.id,
      name: team.name,
      description: team.description,
      icon: team.icon,
      color: team.color,
      teamLead: team.teamLead || team.pm || team.members?.[0] || { 
        id: '', 
        name: 'Unknown', 
        email: '', 
        role: '' 
      },
      members: team.members || []
    };
    
    setSelectedTeam(teamDetails);
    setShowAddMemberModal(true);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-green-500';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'pm':
        return 'Руководитель проекта';
      case 'lead':
        return 'Team Leader';
      case 'frontend':
        return 'Front-End';
      case 'backend':
        return 'Back-End';
      case 'qa':
        return 'QA-инженер';
      case 'designer':
        return 'UI/UX дизайнер';
      case 'analyst':
        return 'Консультант-Аналитик';
      case 'developer':
        return 'Разработчик';
      case 'teamlead':
        return 'Тимлид';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Загрузка команд...</span>
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

  // Показываем детали команды
  if (selectedTeam) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleBackToTeams}
                className="text-gray-600 hover:text-gray-800 p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">{selectedTeam.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddMemberModal(true);
                }}
                className="flex items-center gap-2"
              >
                ➕ Пригласить в команду
              </Button>
              <Button variant="ghost" className="text-gray-600">
                🗑️ Удалить участников
              </Button>
            </div>
          </div>

          {teamLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Загрузка команды...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Team Leader */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Leader</h2>
                <Card className="p-6">
                  {selectedTeam.teamLead ? (
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          {selectedTeam.teamLead.avatar ? (
                            <img src={selectedTeam.teamLead.avatar} alt={selectedTeam.teamLead.name} className="w-16 h-16 rounded-full object-cover" />
                          ) : (
                            <span className="text-white font-semibold text-xl">
                              {selectedTeam.teamLead.name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor(selectedTeam.teamLead.status)} rounded-full border-2 border-white`}></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{selectedTeam.teamLead.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-blue-600 font-medium">{selectedTeam.teamLead.rating || '9.8'}</span>
                          <span className="text-gray-600">{getRoleLabel(selectedTeam.teamLead.role || 'pm')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-semibold text-2xl">?</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-500">Руководитель не назначен</h3>
                        <p className="text-gray-400 mt-1">Требуется назначение руководителя команды</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                          Назначить руководителя
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Команда проекта */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Команда проекта</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTeam.members.map((member) => (
                    <Card key={member.id} className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <span className="text-white font-semibold">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(member.status)} rounded-full border-2 border-white`}></div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{member.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-blue-600 font-medium">{member.rating || '9.5'}</span>
                            <span className="text-gray-600">{getRoleLabel(member.role)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Показываем список команд
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Команды</h1>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Создать команду
            </Button>
            <Button variant="ghost">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          </div>
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4 text-6xl">
              👥
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет команд</h3>
            <p className="text-gray-500">Создайте первую команду для начала работы</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teams.map((team) => (
              <Card 
                key={team.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 p-6 relative"
                onClick={() => handleTeamClick(team.id)}
              >
                <div className="space-y-4">
                  {/* Иконка команды */}
                  <div className="flex items-center justify-center">
                    <div className={`w-16 h-16 ${team.color} rounded-2xl flex items-center justify-center text-white text-2xl`}>
                      {team.icon}
                    </div>
                  </div>
                  
                  {/* Название команды */}
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{team.name}</h3>
                  </div>
                  
                  {/* Team Leader */}
                  <div className="flex items-center gap-3">
                    {team.teamLead ? (
                      <>
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          {team.teamLead.avatar ? (
                            <img src={team.teamLead.avatar} alt={team.teamLead.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <span className="text-white font-semibold text-xs">
                              {team.teamLead.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{team.teamLead.name}</p>
                          <p className="text-xs text-blue-600">{team.teamLead.rating || '9.8'}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-semibold text-xs">?</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500 truncate">Руководитель не назначен</p>
                          <p className="text-xs text-gray-400">Требуется назначение</p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Участники */}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {team.members.slice(0, 3).map((member, index) => (
                        <div key={member.id} className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <span className="text-white font-semibold text-xs">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      ))}
                      {team.members.length > 3 && (
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center border-2 border-white">
                          <span className="text-gray-600 font-semibold text-xs">+{team.members.length - 3}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Кнопки действий */}
                  <div className="pt-2 border-t border-gray-100 flex gap-2">
                    <button
                      onClick={(e) => handleInviteClick(e, team)}
                      className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1 flex-1 justify-center font-medium"
                    >
                      ➕ ПРИГЛАСИТЬ
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно создания команды */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateTeam={handleCreateTeam}
      />

      {/* Модальное окно добавления участника */}
      {selectedTeam && (
        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => {
            setShowAddMemberModal(false);
            // Не сбрасываем selectedTeam, чтобы модалка могла работать
          }}
          teamId={selectedTeam.id}
          onMemberAdded={handleAddMember}
        />
      )}
    </div>
  );
};