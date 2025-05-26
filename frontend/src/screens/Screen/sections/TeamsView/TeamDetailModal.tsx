import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../../api/config';
import { useAuth } from '../../../../hooks/useAuth';

interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  profession?: string;
  rating?: number;
  roles: string[];
  experienceYears?: number;
  avgRate?: number;
  workTime?: string;
  verified?: boolean;
  status?: string;
  isFavorite?: boolean;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  pm?: User;
  members: User[];
  createdAt: string;
}

interface TeamDetailModalProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const SpecialistCard = ({ executor, onFavorite, onMenu, isFavorite, onInvite, loading }) => (
  <div className="bg-white rounded-[16px] shadow flex flex-col gap-2 px-4 py-3 border border-[#ECECEC] relative">
    <div className="absolute top-3 left-3">
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${executor.status === 'Занят' ? 'bg-[#FFEAEA] text-[#ED533F]' : 'bg-[#E6F9ED] text-[#1DBA66]'}`}>{executor.status}</span>
    </div>
    <div className="flex items-center gap-3">
      <img src={executor.avatarUrl} alt={executor.name} className="w-12 h-12 rounded-full object-cover" />
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-1">
          <span className="font-medium text-neutralneutral-10 text-base">{executor.name}</span>
          {executor.isFavorite && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#7B61FF" strokeWidth="2">
              <path d="M12 21C12 21 4 13.5 4 8.5C4 5.5 6.5 3 9.5 3C11.04 3 12.5 3.99 13 5.36C13.5 3.99 14.96 3 16.5 3C19.5 3 22 5.5 22 8.5C22 13.5 12 21 12 21Z" />
            </svg>
          )}
        </div>
        <span className="text-xs text-neutralneutral-60">{executor.profession}</span>
      </div>
      <button onClick={onMenu} className="ml-auto p-1 rounded-full hover:bg-neutralneutral-90 transition">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#A5A5A7" strokeWidth="2">
          <circle cx="5" cy="12" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="19" cy="12" r="2"/>
        </svg>
      </button>
    </div>
    <div className="flex items-center gap-2 mt-2">
      <span className="text-sm font-semibold text-[#1DBA66] bg-[#E6F9ED] rounded-full px-2 py-0.5">{executor.rating}</span>
      <span className="text-xs text-neutralneutral-60">{executor.profession}</span>
    </div>
    <div className="flex items-center gap-2 mt-2">
      {isFavorite ? (
        <button onClick={onFavorite} className="flex items-center gap-1 text-[#7B61FF] text-xs px-2 py-1 rounded-full bg-[#F3F0FF] border border-[#E0D7FF]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#7B61FF" strokeWidth="2">
            <path d="M12 21C12 21 4 13.5 4 8.5C4 5.5 6.5 3 9.5 3C11.04 3 12.5 3.99 13 5.36C13.5 3.99 14.96 3 16.5 3C19.5 3 22 5.5 22 8.5C22 13.5 12 21 12 21Z" />
          </svg>
          Удалить из избранного
        </button>
      ) : (
        <button onClick={onFavorite} className="flex items-center gap-1 text-[#7B61FF] text-xs px-2 py-1 rounded-full bg-[#F3F0FF] border border-[#E0D7FF]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#7B61FF" strokeWidth="2">
            <path d="M12 21C12 21 4 13.5 4 8.5C4 5.5 6.5 3 9.5 3C11.04 3 12.5 3.99 13 5.36C13.5 3.99 14.96 3 16.5 3C19.5 3 22 5.5 22 8.5C22 13.5 12 21 12 21Z" />
          </svg>
          Добавить в избранное
        </button>
      )}
      <button onClick={onInvite} disabled={loading} className="ml-auto px-3 py-1 rounded-full bg-main-colorsaqua text-white text-xs font-medium hover:bg-[#3771C8] transition disabled:opacity-60">Создать заявку</button>
    </div>
  </div>
);

export const TeamDetailModal: React.FC<TeamDetailModalProps> = ({
  team,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { user } = useAuth();
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedProfession, setSelectedProfession] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const professions = [
    'Frontend разработчик',
    'Back-End разработчик',
    'Тестировщик',
    'Аналитик',
    'Дизайнер'
  ];

  const getAvatarUrl = (user: User) => {
    return user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
  };

  const searchExecutors = async () => {
    if (!selectedProfession) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('profession', selectedProfession);
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const response = await apiClient.get(`/teams/${team.id}/search-executors?${params}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching executors:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (executorId: string) => {
    try {
      await apiClient.post(`/teams/${team.id}/invite`, {
        receiverId: executorId,
        projectType: 'with_project'
      });
      
      alert('Заявка отправлена!');
      setShowAddMember(false);
      setSearchResults([]);
      setSelectedProfession('');
      setSearchQuery('');
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Ошибка при отправке заявки');
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Удалить участника из команды?')) return;
    
    try {
      await apiClient.delete(`/teams/${team.id}/remove-member`, {
        data: { memberId }
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Ошибка при удалении участника');
    }
  };

  useEffect(() => {
    if (selectedProfession) {
      searchExecutors();
    }
  }, [selectedProfession, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{team.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Team Leader */}
          {team.pm && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Team Leader</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={getAvatarUrl(team.pm)}
                    alt={team.pm.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{team.pm.name}</h4>
                    <p className="text-gray-600">{team.pm.profession}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-blue-600 font-medium">
                        ⭐ {team.pm.rating || '9.8'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {team.pm.experienceYears || '5+'} лет опыта
                      </span>
                      {team.pm.verified && (
                        <span className="text-sm text-green-600">✓ Верифицирован</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Команда проекта */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Команда проекта ({team.members.length})
              </h3>
              {user && user.roles.includes('pm') && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Добавить в команду
                </button>
              )}
            </div>

            {team.members.length > 0 ? (
              <div className="space-y-3">
                {team.members.map((member) => (
                  <div key={member.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={getAvatarUrl(member)}
                          alt={member.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{member.name}</h4>
                          <p className="text-gray-600">{member.profession}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-blue-600 font-medium">
                              ⭐ {member.rating || '8.8'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {member.avgRate || '2000'} ₽/час
                            </span>
                            <span className="text-sm text-gray-500">
                              {member.workTime || 'Полный день'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeMember(member.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>В команде пока нет участников</p>
                <p className="text-sm mt-1">Добавьте исполнителей для работы над проектом</p>
              </div>
            )}
          </div>
        </div>

        {/* Модал добавления участника */}
        {showAddMember && user && user.roles.includes('pm') && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Добавить в команду</h3>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {/* Поиск и фильтры */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Front-End разработчик, VUE.JS"
                      className="w-full border border-[#ECECEC] rounded-[12px] h-12 px-12 text-[16px] bg-[#F8F8FA]"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutralneutral-60">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#A5A5A7" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" /></svg>
                    </span>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-[#E0D7FF] text-[#7B61FF] flex items-center justify-center font-bold text-base">2</button>
                  <button className="rounded-full bg-[#F3F0FF] text-[#7B61FF] px-4 py-2 font-medium text-sm flex items-center gap-2"><span>Создать заявку</span><svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M10 4v8m0 0l3-3m-3 3l-3-3" stroke="#7B61FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="3" width="14" height="14" rx="7" stroke="#7B61FF" strokeWidth="1.5"/></svg></button>
                </div>
                {/* Фильтрация */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-neutralneutral-60 text-sm">Фильтрация</span>
                  <span className="bg-[#F3F0FF] text-[#7B61FF] rounded-full px-3 py-1 text-xs flex items-center gap-1">По рейтингу <button className="ml-1 text-[#7B61FF]">×</button></span>
                </div>
                {/* Сетка специалистов */}
                <div className="grid grid-cols-3 gap-6">
                  {searchResults.map(executor => (
                    <SpecialistCard
                      key={executor.id}
                      executor={executor}
                      onFavorite={() => {/* TODO: реализовать избранное */}}
                      onMenu={() => {/* TODO: реализовать меню */}}
                      isFavorite={executor.isFavorite}
                      onInvite={() => sendInvitation(executor.id)}
                      loading={loading}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 