import React, { useEffect, useState } from "react";
import { getProjects } from "../../api/projects";
import { getUsers, getCurrentUser } from "../../api/auth";
import { apiClient } from "../../api/config";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  title: string;
  status: string[];
  manager: string;
  client: string;
  assignedPM?: string;
  assignedPMName?: string;
}

interface User {
  uid: string;
  email: string;
  displayName: string;
  roles: string[];
}

export const ProjectsListScreen: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectManagers, setProjectManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningPM, setAssigningPM] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const user = getCurrentUser();
  const isAdmin = user?.roles?.includes('admin') || user?.role === 'admin';
  const isPM = user?.roles?.includes('project_manager') || user?.roles?.includes('pm') || user?.role === 'pm';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загружаем проекты
      const projectsData = await getProjects();
      setProjects(projectsData);
      
      // Если админ, загружаем проект-менеджеров
      if (isAdmin) {
        const usersData = await getUsers();
        const pms = usersData.filter(user => user.roles.includes('project_manager'));
        setProjectManagers(pms);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignPM = async (projectId: string, pmId: string) => {
    try {
      setAssigningPM(projectId);
      
      await apiClient.post(`/projects/${projectId}/assign-pm`, {
        projectManagerId: pmId
      });
      
      // Обновляем локальное состояние
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { 
              ...project, 
              assignedPM: pmId,
              assignedPMName: projectManagers.find(pm => pm.uid === pmId)?.displayName,
              manager: pmId,
              status: ['assigned']
            }
          : project
      ));
      
    } catch (error) {
      console.error('Error assigning PM:', error);
      alert('Ошибка при назначении проект-менеджера');
    } finally {
      setAssigningPM(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5F8] flex flex-col">
      {/* Хедер */}
      <header className="bg-white border-b border-[#E6EAF2] px-4 sm:px-6 md:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <img src="/logo.svg" alt="TASKA" className="h-6 sm:h-7" />
          <span className="text-[#A5A5A7] text-xs sm:text-sm ml-2 sm:ml-4">Сегодня 21 февраля</span>
          <span className="text-[#222] text-xs sm:text-sm font-medium ml-1 sm:ml-2">14:03 МСК</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* ... фильтры, иконки, счет */}
        </div>
      </header>
      {/* Контент */}
      <main className="flex-1 flex flex-col md:flex-row">
        {/* Боковое меню */}
        <aside className="w-full md:w-56 bg-[#F3F5F8] border-b md:border-b-0 md:border-r border-[#E6EAF2] flex flex-row md:flex-col items-center md:items-start py-3 md:py-6 px-4 md:px-0 overflow-x-auto md:overflow-x-visible">
          {/* ... пункты меню */}
        </aside>
        {/* Список проектов */}
        <section className="flex-1 p-4 sm:p-6 md:p-8">
          <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Проекты</h1>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <input className="rounded-lg border px-3 sm:px-4 py-2 w-full sm:w-72" placeholder="Искать проект" />
            {/* ... фильтры */}
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2982FD]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-[#ECECEC] flex flex-col gap-2 hover:shadow-md transition"
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {/* Лого */}
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#F3F7FE] rounded-lg flex items-center justify-center">
                        {/* Здесь будет иконка/лого */}
                      </div>
                      <span className="text-sm sm:text-base font-medium">{project.title}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {project.status.map((s: string) => (
                        <span key={s} className={`border rounded px-2 py-0.5 text-xs ${
                          s === 'pending' ? 'text-yellow-600 border-yellow-300 bg-yellow-50' :
                          s === 'assigned' ? 'text-blue-600 border-blue-300 bg-blue-50' :
                          s === 'in_progress' ? 'text-green-600 border-green-300 bg-green-50' :
                          'text-gray-600 border-gray-300 bg-gray-50'
                        }`}>
                          {s === 'pending' ? 'Ожидает' :
                           s === 'assigned' ? 'Назначен PM' :
                           s === 'in_progress' ? 'В работе' :
                           s}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-[#A5A5A7]">
                      РП: {project.assignedPMName || 'Не назначен'}
                    </div>
                    <div className="text-xs text-[#A5A5A7]">Клиент: {project.client}</div>
                  </div>
                  
                  {/* Кнопка "Команда" только для РП */}
                  {isPM && (
                    <button
                      className="mt-2 px-4 py-2 bg-[#2982FD] text-white rounded-lg text-sm font-medium hover:bg-[#3771C8]"
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/projects/${project.id}/team`);
                      }}
                    >
                      Команда
                    </button>
                  )}
                  
                  {/* Админские функции */}
                  {isAdmin && !project.assignedPM && (
                    <div className="border-t pt-3 mt-2">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Назначить PM:
                      </label>
                      <select 
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                        onChange={(e) => {
                          if (e.target.value) {
                            assignPM(project.id, e.target.value);
                          }
                        }}
                        disabled={assigningPM === project.id}
                        defaultValue=""
                      >
                        <option value="">
                          {assigningPM === project.id ? 'Назначение...' : 'Выберите PM...'}
                        </option>
                        {projectManagers.map((pm) => (
                          <option key={pm.uid} value={pm.uid}>
                            {pm.displayName} ({pm.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}; 