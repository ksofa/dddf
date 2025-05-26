import React from "react";
import { Card, CardContent } from "../../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { ProjectBoardScreen } from '../../../../screens/Projects/ProjectBoardScreen';
import { getProjects } from "../../../../api/projects";
import { useAuth } from "../../../../hooks/useAuth";

export const ProjectsView = () => {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading projects from API...');
      console.log('👤 Current user role:', user?.roles);
      
      const projectsData = await getProjects();
      console.log('✅ Projects loaded successfully:', projectsData.length, 'projects');
      
      // Фильтруем проекты по ролям
      let filteredProjects = projectsData;
      
      if (user?.roles?.includes('admin')) {
        // Админ видит все проекты
        filteredProjects = projectsData;
      } else if (user?.roles?.includes('pm')) {
        // PM видит проекты где он назначен PM
        filteredProjects = projectsData.filter(project => 
          project.pmId === user.uid || 
          project.teamLead === user.uid ||
          project.manager === user.uid
        );
      } else if (user?.roles?.includes('executor')) {
        // Executor видит проекты где он участник команды
        filteredProjects = projectsData.filter(project => 
          project.team?.includes(user.uid) ||
          project.teamMembers?.some((member: any) => member.id === user.uid)
        );
      }
      
      console.log('📋 Filtered projects for role:', user?.roles, filteredProjects.length);
      setProjects(filteredProjects);
    } catch (error: any) {
      console.error('❌ Error loading projects:', error);
      setError(`Ошибка загрузки проектов: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Определяем заголовок в зависимости от роли
  const getTitle = () => {
    if (user?.roles?.includes('admin')) return 'Все проекты';
    if (user?.roles?.includes('pm')) return 'Мои проекты (PM)';
    if (user?.roles?.includes('executor')) return 'Мои проекты';
    return 'Проекты';
  };

  if (selectedProjectId) {
    return (
      <div className="relative">
        <button
          className="absolute top-4 left-4 z-10 px-4 py-2 bg-main-colorsaqua text-white rounded-lg text-sm font-medium hover:bg-[#3771C8]"
          onClick={() => setSelectedProjectId(null)}
        >
          ← Назад к проектам
        </button>
        <div className="pt-12">
          <ProjectBoardScreen projectId={selectedProjectId} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-main-colorsbackground min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-h1-alternative text-neutralneutral-10">{getTitle()}</h1>
        <button 
          onClick={loadProjects}
          className="px-4 py-2 bg-main-colorsaqua text-white rounded-lg text-sm hover:bg-[#3771C8] font-paragraph-16-medium"
          disabled={loading}
        >
          {loading ? 'Загрузка...' : '🔄 Обновить'}
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-paragraph-16">{error}</p>
          <button 
            onClick={loadProjects}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 font-paragraph-16-medium"
          >
            Попробовать снова
          </button>
        </div>
      )}

      {/* Отладочная информация */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p><strong>Отладка:</strong></p>
        <p>Загружено проектов: {projects.length}</p>
        <p>Статус загрузки: {loading ? 'Загружается' : 'Завершено'}</p>
        <p>Ошибка: {error || 'Нет'}</p>
        <p>Токен: {localStorage.getItem('authToken') ? 'Есть' : 'Отсутствует'}</p>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-neutralneutral-100 border border-[#ececec]">
          <TabsTrigger value="active" className="font-paragraph-16-medium">Активные</TabsTrigger>
          <TabsTrigger value="completed" className="font-paragraph-16-medium">Завершенные</TabsTrigger>
          <TabsTrigger value="archived" className="font-paragraph-16-medium">В архиве</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main-colorsaqua"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 font-paragraph-16">Проектов не найдено</p>
              <button 
                onClick={loadProjects}
                className="mt-4 px-4 py-2 bg-main-colorsaqua text-white rounded-lg text-sm hover:bg-[#3771C8] font-paragraph-16-medium"
              >
                Обновить список
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {
                try {
                  return (
                    <div key={project.id} className="bg-neutralneutral-100 rounded-xl border border-[#ececec] p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedProjectId(project.id)}>
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-main-colorsaqua-20 rounded-lg flex items-center justify-center">
                          <img className="w-6 h-6" alt="Project" src="/project.svg" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-h2 text-neutralneutral-10 mb-2">{project.title || 'Без названия'}</h3>
                          <p className="text-neutralneutral-60 font-paragraph-16 mb-4">{project.description || 'Описание проекта'}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-1">
                          {(project.status && Array.isArray(project.status) ? project.status : [project.status].filter(Boolean)).map((s: string) => (
                            <span key={s} className={`border rounded-full px-3 py-1 text-xs font-status ${
                              s === 'pending' ? 'text-white bg-main-colorsorange border-main-colorsorange' :
                              s === 'active' ? 'text-white bg-main-colorsgreen border-main-colorsgreen' :
                              s === 'assigned' ? 'text-white bg-main-colorsaqua border-main-colorsaqua' :
                              s === 'in_progress' ? 'text-white bg-main-colorsgreen border-main-colorsgreen' :
                              'text-neutralneutral-60 border-neutralneutral-80 bg-neutralneutral-95'
                            }`}>
                              {s === 'pending' ? 'Ожидает' :
                               s === 'active' ? 'Активный' :
                               s === 'assigned' ? 'Назначен PM' :
                               s === 'in_progress' ? 'В работе' :
                               s}
                            </span>
                          ))}
                        </div>
                        <div className="text-sm text-neutralneutral-60 font-paragraph-14">
                          Клиент: {project.clientCompany || project.client || 'Не указан'}
                        </div>
                        {project.teamLeadInfo && (
                          <div className="text-sm text-neutralneutral-60 font-paragraph-14">
                            PM: {project.teamLeadInfo.displayName}
                          </div>
                        )}
                        {project.pm && (
                          <div className="text-sm text-neutralneutral-60 font-paragraph-14">
                            PM: {project.pm.fullName}
                          </div>
                        )}
                        {project.createdFrom === 'application' && (
                          <div className="text-xs text-main-colorsaqua font-paragraph-14-medium">
                            Создан из заявки
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } catch (err) {
                  console.error('Error rendering project:', project.id, err);
                  return (
                    <div key={project.id} className="bg-neutralneutral-100 rounded-xl border border-[#ececec] p-6">
                      <div className="text-red-500 font-paragraph-16">Ошибка отображения проекта</div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main-colorsaqua"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.filter(p => p.status && Array.isArray(p.status) && (p.status.includes('completed') || p.status.includes('done'))).length > 0 ? (
                projects.filter(p => p.status && Array.isArray(p.status) && (p.status.includes('completed') || p.status.includes('done'))).map((project) => (
                  <Card key={project.id}>
                    <CardContent
                      className="p-6 cursor-pointer hover:bg-main-colorsbackground"
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <h3 className="font-semibold mb-2">{project.title}</h3>
                      <p className="text-gray-600 mb-4">{project.description || 'Описание проекта'}</p>
                      <div className="text-sm text-gray-500">
                        Клиент: {project.client || 'Не указан'}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  Завершенных проектов пока нет
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="archived">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main-colorsaqua"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.filter(p => p.status && Array.isArray(p.status) && p.status.includes('archived')).length > 0 ? (
                projects.filter(p => p.status && Array.isArray(p.status) && p.status.includes('archived')).map((project) => (
                  <Card key={project.id}>
                    <CardContent
                      className="p-6 cursor-pointer hover:bg-main-colorsbackground"
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <h3 className="font-semibold mb-2">{project.title}</h3>
                      <p className="text-gray-600 mb-4">{project.description || 'Описание проекта'}</p>
                      <div className="text-sm text-gray-500">
                        Клиент: {project.client || 'Не указан'}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  Архивированных проектов пока нет
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};