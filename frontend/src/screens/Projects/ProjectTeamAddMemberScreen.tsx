import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/config';
import { useAuth } from '../../hooks/useAuth';

interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  profession?: string;
  rating?: number;
  roles: string[];
  status?: string;
  isFavorite?: boolean;
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

export const ProjectTeamAddMemberScreen: React.FC = () => {
  const { id: teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreateRequests = async () => {
    setSubmitting(true);
    try {
      await Promise.all(selected.map(executorId =>
        apiClient.post(`/teams/${teamId}/invite`, {
          receiverId: executorId,
          projectType: 'with_project'
        })
      ));
      alert('Заявки отправлены!');
      setSelected([]);
    } catch (e) {
      alert('Ошибка при отправке заявок');
    } finally {
      setSubmitting(false);
    }
  };

  const searchExecutors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      const response = await apiClient.get(`/teams/${teamId}/search-executors?${params}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching executors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchExecutors();
    // eslint-disable-next-line
  }, [searchQuery]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Breadcrumbs и заголовок */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="text-[#A5A5A7] hover:text-[#7B61FF]">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#A5A5A7" strokeWidth="2"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span className="text-[20px] font-semibold text-[#222]">Добавить в команду</span>
      </div>
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
        <button className="w-10 h-10 rounded-full bg-[#E0D7FF] text-[#7B61FF] flex items-center justify-center font-bold text-base">{selected.length}</button>
        <button
          className={`rounded-full bg-[#F3F0FF] text-[#7B61FF] px-4 py-2 font-medium text-sm flex items-center gap-2 transition ${selected.length === 0 || submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#E0D7FF]'}`}
          disabled={selected.length === 0 || submitting}
          onClick={handleCreateRequests}
        >
          <span>Создать заявку</span>
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M10 4v8m0 0l3-3m-3 3l-3-3" stroke="#7B61FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="3" width="14" height="14" rx="7" stroke="#7B61FF" strokeWidth="1.5"/></svg>
        </button>
      </div>
      {/* Фильтрация */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-neutralneutral-60 text-sm">Фильтрация</span>
        <span className="bg-[#F3F0FF] text-[#7B61FF] rounded-full px-3 py-1 text-xs flex items-center gap-1">По рейтингу <button className="ml-1 text-[#7B61FF]">×</button></span>
      </div>
      {/* Loader */}
      {loading ? (
        <div className="flex justify-center items-center py-12"><div className="loader"></div></div>
      ) : searchResults.length === 0 ? (
        <div className="text-center text-gray-400 py-12">Ничего не найдено</div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {searchResults.map(executor => (
            <div
              key={executor.id}
              className={`cursor-pointer transition border-2 ${selected.includes(executor.id) ? 'border-[#7B61FF] bg-[#F3F0FF]' : 'border-transparent'} rounded-[16px]`}
              onClick={() => toggleSelect(executor.id)}
            >
              <SpecialistCard
                executor={executor}
                onFavorite={() => {/* TODO: избранное */}}
                onMenu={() => {/* TODO: меню */}}
                isFavorite={executor.isFavorite}
                onInvite={() => {/* TODO: заявка */}}
                loading={loading}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectTeamAddMemberScreen; 