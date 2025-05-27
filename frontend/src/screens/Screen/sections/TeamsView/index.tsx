import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { apiClient } from '../../../../api/config';
import { useAuth } from '../../../../hooks/useAuth';
import { CreateTeamModal } from './CreateTeamModal';

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
  teamLead: TeamMember;
  members: TeamMember[];
}

export const TeamsView: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Загружаем команды
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get('/teams');
        
        // Преобразуем данные в нужный формат
        const teamsData = response.data.map((team: any, index: number) => {
          // Получаем имя команды
          const teamName = team.title || team.name || `Команда ${index + 1}`;
          
          // Получаем участников команды
          const members = team.teamMembers || team.members || [];
          
          // Находим тимлида
          const teamLead = team.pm || members.find((m: any) => 
            m.role === 'pm' || m.role === 'lead' || (m.roles && (m.roles.includes('pm') || m.roles.includes('lead')))
          );

          return {
            id: team.id,
            name: teamName,
            description: team.description || 'Описание команды',
            icon: getTeamIcon(index),
            color: getTeamColor(index),
            members: members.map((member: any) => ({
              ...member,
              name: member.displayName || member.fullName || member.name || member.email,
              rating: member.rating || (Math.random() * 2 + 8).toFixed(1),
              status: Math.random() > 0.3 ? 'online' : 'offline',
              lastSeen: Math.random() > 0.5 ? `${Math.floor(Math.random() * 60)} мин. назад` : undefined
            })),
            projectCount: 1,
            teamLead: teamLead ? {
              ...teamLead,
              name: teamLead.displayName || teamLead.fullName || teamLead.name || teamLead.email,
              rating: teamLead.rating || '9.8'
            } : undefined,
            role: team.role
          };
        });
        
        setTeams(teamsData);
      } catch (error: any) {
        console.error('Error fetching teams:', error);
        setError('Не удалось загрузить команды');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTeams();
    }
  }, [user]);

  // Получаем иконку для команды
  const getTeamIcon = (index: number) => {
    const icons = ['📱', '🌐', '📊', '🚀', '💼', '��', '📈', '👥'];
    return icons[index % icons.length];
  };

  // Получаем цвет для команды
  const getTeamColor = (index: number) => {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-gray-500', 'bg-pink-500', 'bg-indigo-500'];
    return colors[index % colors.length];
  };

  // Открываем детали команды
  const handleTeamClick = async (teamId: string) => {
    try {
      setTeamLoading(true);
      setError(null);
      
      // Находим команду в локальных данных
      const team = teams.find(t => t.id === teamId);
      if (!team) {
        setError('Команда не найдена');
        return;
      }

      // Создаем детали команды
      const teamDetails: TeamDetails = {
        id: team.id,
        name: team.name,
        description: team.description,
        icon: team.icon,
        color: team.color,
        teamLead: team.teamLead || {
          id: 'default',
          name: 'Не назначен',
          email: '',
          role: 'pm',
          rating: '0.0'
        },
        members: team.members.filter(m => m.role !== 'pm' && m.role !== 'lead')
      };

      setSelectedTeam(teamDetails);
    } catch (error: any) {
      console.error('Error fetching team details:', error);
      setError('Не удалось загрузить детали команды');
    } finally {
      setTeamLoading(false);
    }
  };

  const handleBackToTeams = () => {
    setSelectedTeam(null);
  };

  const handleCreateTeam = async (teamData: any) => {
    try {
      // Добавляем новую команду в локальный список
      const newTeam = {
        ...teamData,
        id: `team-${Date.now()}`,
        members: teamData.teamMembers || [],
        projectCount: 0,
        teamLead: undefined
      };
      
      setTeams(prevTeams => [...prevTeams, newTeam]);
      
      console.log('Создана новая команда:', newTeam);
    } catch (error) {
      console.error('Ошибка при создании команды:', error);
      setError('Не удалось создать команду');
    }
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
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Выбрать команду
              </Button>
              <Button className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Добавить в команду
              </Button>
              <Button variant="ghost" className="text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Удалить участников
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
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        {selectedTeam.teamLead?.avatar ? (
                          <img src={selectedTeam.teamLead.avatar} alt={selectedTeam.teamLead.name} className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                          <span className="text-white font-semibold text-xl">
                            {selectedTeam.teamLead?.name?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor(selectedTeam.teamLead?.status)} rounded-full border-2 border-white`}></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{selectedTeam.teamLead?.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-blue-600 font-medium">{selectedTeam.teamLead?.rating || '9.8'}</span>
                        <span className="text-gray-600">{getRoleLabel(selectedTeam.teamLead?.role || 'pm')}</span>
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
                            <span className="text-blue-600 font-medium">{member.rating || '8.8'}</span>
                            <span className="text-gray-600 text-sm">{getRoleLabel(member.role)}</span>
                          </div>
                          {member.lastSeen && (
                            <p className="text-xs text-gray-500 mt-1">был(а) {member.lastSeen}</p>
                          )}
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
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет команд</h3>
            <p className="text-gray-500">Создайте первую команду для начала работы</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {teams.map((team) => (
              <Card 
                key={team.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 p-6"
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
                  {team.teamLead && (
                    <div className="flex items-center gap-3">
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
                    </div>
                  )}
                  
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
    </div>
  );
};