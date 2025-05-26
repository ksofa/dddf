import React, { useEffect, useState } from "react";
import { getUsers } from "../../api/auth";
import { useAuth } from "../../hooks/useAuth";

interface ProjectManager {
  uid: string;
  email: string;
  displayName: string;
  roles: string[];
  specialization?: string;
  categories?: string[];
  experience?: string;
  description?: string;
  availability?: 'available' | 'busy' | 'unavailable';
  workload?: number;
  maxProjects?: number;
  stats?: {
    projectsCompleted: number;
    projectsActive: number;
    averageRating: number;
    totalReviews: number;
  };
  contactInfo?: {
    phone?: string;
    telegram?: string;
    linkedin?: string;
  };
}

export const ProjectManagersScreen: React.FC = () => {
  const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPM, setSelectedPM] = useState<ProjectManager | null>(null);
  const { user } = useAuth();

  const isAdmin = user?.roles?.includes('admin') || user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadProjectManagers();
    }
  }, [isAdmin]);

  const loadProjectManagers = async () => {
    try {
      setLoading(true);
      const usersData = await getUsers();
      const pms = usersData.filter(user => user.roles.includes('pm'));
      setProjectManagers(pms);
    } catch (error) {
      console.error('Error loading project managers:', error);
      alert('Ошибка при загрузке проект-менеджеров');
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (availability?: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAvailabilityText = (availability?: string) => {
    switch (availability) {
      case 'available':
        return 'Доступен';
      case 'busy':
        return 'Занят';
      case 'unavailable':
        return 'Недоступен';
      default:
        return 'Не указано';
    }
  };

  const getWorkloadColor = (workload?: number) => {
    if (!workload) return 'bg-gray-200';
    if (workload < 50) return 'bg-green-400';
    if (workload < 80) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  // Функция назначения PM на проект
  const assignPMToProject = async (pmId: string, projectId: string) => {
    try {
      // Здесь будет API вызов для назначения PM
      console.log('Assigning PM', pmId, 'to project', projectId);
      alert('PM назначен на проект');
    } catch (error) {
      console.error('Error assigning PM:', error);
      alert('Ошибка при назначении PM');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F3F5F8] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-700 mb-2">Доступ запрещен</h1>
          <p className="text-gray-500">Только администраторы могут управлять проект-менеджерами</p>
        </div>
      </div>
    );
  }

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
          <button 
            onClick={loadProjectManagers}
            disabled={loading}
            className="bg-[#2982FD] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#3771C8] disabled:opacity-50"
          >
            {loading ? 'Загрузка...' : 'Обновить'}
          </button>
        </div>
      </header>

      {/* Контент */}
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold">Проект-менеджеры</h1>
          <div className="text-sm text-gray-600">
            Всего PM: {projectManagers.length}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2982FD]"></div>
          </div>
        ) : projectManagers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              Проект-менеджеры не найдены
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {projectManagers.map((pm) => (
              <div
                key={pm.uid}
                className="bg-white rounded-xl p-6 shadow-sm border border-[#ECECEC] hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedPM(pm)}
              >
                {/* Заголовок карточки */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {pm.displayName}
                    </h3>
                    <p className="text-sm text-gray-600">{pm.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getAvailabilityColor(pm.availability)}`}>
                    {getAvailabilityText(pm.availability)}
                  </span>
                </div>

                {/* Специализация */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Специализация:</p>
                  <p className="text-sm text-gray-600">{pm.specialization || 'Не указана'}</p>
                </div>

                {/* Опыт */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Опыт:</p>
                  <p className="text-sm text-gray-600">{pm.experience || 'Не указан'}</p>
                </div>

                {/* Загруженность */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Загруженность:</span>
                    <span className="text-sm text-gray-600">{pm.workload || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getWorkloadColor(pm.workload)}`}
                      style={{ width: `${pm.workload || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Статистика */}
                {pm.stats && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Статистика:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-medium text-gray-900">{pm.stats.projectsCompleted}</div>
                        <div className="text-gray-600">Завершено</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-medium text-gray-900">{pm.stats.projectsActive}</div>
                        <div className="text-gray-600">Активных</div>
                      </div>
                      {pm.stats.averageRating > 0 && (
                        <>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="font-medium text-gray-900">{pm.stats.averageRating.toFixed(1)}</div>
                            <div className="text-gray-600">Рейтинг</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="font-medium text-gray-900">{pm.stats.totalReviews}</div>
                            <div className="text-gray-600">Отзывов</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Категории */}
                {pm.categories && pm.categories.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Категории:</p>
                    <div className="flex flex-wrap gap-1">
                      {pm.categories.slice(0, 3).map((category, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                      {pm.categories.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{pm.categories.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Максимальное количество проектов */}
                <div className="text-xs text-gray-500">
                  Макс. проектов: {pm.maxProjects || 'Не указано'}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Модальное окно с подробной информацией */}
      {selectedPM && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Заголовок модального окна */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {selectedPM.displayName}
                  </h2>
                  <p className="text-gray-600">{selectedPM.email}</p>
                </div>
                <button
                  onClick={() => setSelectedPM(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Подробная информация */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Специализация</h3>
                  <p className="text-gray-600">{selectedPM.specialization}</p>
                </div>

                {selectedPM.description && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Описание</h3>
                    <p className="text-gray-600">{selectedPM.description}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Статус и загруженность</h3>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getAvailabilityColor(selectedPM.availability)}`}>
                      {getAvailabilityText(selectedPM.availability)}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Загруженность</span>
                        <span>{selectedPM.workload || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getWorkloadColor(selectedPM.workload)}`}
                          style={{ width: `${selectedPM.workload || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedPM.categories && selectedPM.categories.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Категории</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPM.categories.map((category, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPM.stats && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Статистика</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-lg font-semibold text-gray-900">{selectedPM.stats.projectsCompleted}</div>
                        <div className="text-sm text-gray-600">Завершено проектов</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-lg font-semibold text-gray-900">{selectedPM.stats.projectsActive}</div>
                        <div className="text-sm text-gray-600">Активных проектов</div>
                      </div>
                      {selectedPM.stats.averageRating > 0 && (
                        <>
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-lg font-semibold text-gray-900">{selectedPM.stats.averageRating.toFixed(1)}</div>
                            <div className="text-sm text-gray-600">Средний рейтинг</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-lg font-semibold text-gray-900">{selectedPM.stats.totalReviews}</div>
                            <div className="text-sm text-gray-600">Всего отзывов</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {selectedPM.contactInfo && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Контактная информация</h3>
                    <div className="space-y-1 text-sm">
                      {selectedPM.contactInfo.phone && (
                        <p><span className="font-medium">Телефон:</span> {selectedPM.contactInfo.phone}</p>
                      )}
                      {selectedPM.contactInfo.telegram && (
                        <p><span className="font-medium">Telegram:</span> {selectedPM.contactInfo.telegram}</p>
                      )}
                      {selectedPM.contactInfo.linkedin && (
                        <p><span className="font-medium">LinkedIn:</span> {selectedPM.contactInfo.linkedin}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 