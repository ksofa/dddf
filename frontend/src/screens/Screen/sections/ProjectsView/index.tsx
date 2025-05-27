import React from "react";
import { Card, CardContent } from "../../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Button } from "../../../../components/ui/button";
import { ProjectBoardScreen } from '../../../../screens/Projects/ProjectBoardScreen';
import { getProjects } from "../../../../api/projects";
import { useAuth } from "../../../../hooks/useAuth";

export const ProjectsView = () => {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

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

  // Фильтрация проектов
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    
    const projectStatus = Array.isArray(project.status) ? project.status : [project.status];
    return matchesSearch && projectStatus.includes(statusFilter);
  });

  // Группировка проектов по статусу
  const activeProjects = filteredProjects.filter(p => {
    const status = Array.isArray(p.status) ? p.status : [p.status];
    return status.includes('active') || status.includes('in_progress') || status.includes('assigned');
  });

  const completedProjects = filteredProjects.filter(p => {
    const status = Array.isArray(p.status) ? p.status : [p.status];
    return status.includes('completed') || status.includes('finished');
  });

  const archivedProjects = filteredProjects.filter(p => {
    const status = Array.isArray(p.status) ? p.status : [p.status];
    return status.includes('archived') || status.includes('cancelled');
  });

  if (selectedProjectId) {
    return (
      <div className="relative">
        <button
          className="absolute top-4 left-4 z-10 px-4 py-2 bg-main-colorsaqua text-white rounded-lg text-sm font-medium hover:bg-[#3771C8] transition-colors"
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

  const ProjectCard = ({ project }: { project: any }) => (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-[#ececec] bg-white"
      onClick={() => setSelectedProjectId(project.id)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
              {project.title || 'Без названия'}
            </h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {project.description || 'Описание проекта'}
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Статусы */}
          <div className="flex flex-wrap gap-2">
            {(project.status && Array.isArray(project.status) ? project.status : [project.status].filter(Boolean)).map((s: string) => (
              <span key={s} className={`px-3 py-1 rounded-full text-xs font-medium ${
                s === 'pending' ? 'bg-orange-100 text-orange-800' :
                s === 'active' ? 'bg-green-100 text-green-800' :
                s === 'assigned' ? 'bg-blue-100 text-blue-800' :
                s === 'in_progress' ? 'bg-green-100 text-green-800' :
                s === 'completed' ? 'bg-gray-100 text-gray-800' :
                'bg-gray-100 text-gray-600'
              }`}>
                {s === 'pending' ? 'Ожидает' :
                 s === 'active' ? 'Активный' :
                 s === 'assigned' ? 'Назначен PM' :
                 s === 'in_progress' ? 'В работе' :
                 s === 'completed' ? 'Завершен' :
                 s}
              </span>
            ))}
          </div>

          {/* Информация о проекте */}
          <div className="space-y-2 text-sm text-gray-600">
            {(project.clientCompany || project.client) && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Клиент: {project.clientCompany || project.client}</span>
              </div>
            )}
            
            {(project.teamLeadInfo || project.pm) && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>PM: {project.teamLeadInfo?.displayName || project.pm?.fullName}</span>
              </div>
            )}

            {project.team && project.team.length > 0 && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Команда: {project.team.length} участников</span>
              </div>
            )}

            {project.createdFrom === 'application' && (
              <div className="flex items-center gap-2 text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">Создан из заявки</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Заголовок и действия */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getTitle()}</h1>
          <p className="text-gray-600 mt-1">Управляйте своими проектами</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={loadProjects}
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Загрузка...' : 'Обновить'}
          </Button>
          {user?.roles?.includes('pm') && (
            <Button className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Создать проект
            </Button>
          )}
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Поиск проектов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="in_progress">В работе</option>
              <option value="assigned">Назначен PM</option>
              <option value="pending">Ожидают</option>
              <option value="completed">Завершенные</option>
            </select>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
          <Button 
            onClick={loadProjects}
            variant="outline"
            size="sm"
            className="mt-3 text-red-600 border-red-300 hover:bg-red-50"
          >
            Попробовать снова
          </Button>
        </div>
      )}
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-white border border-gray-200 mb-6">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Активные ({activeProjects.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
            Завершенные ({completedProjects.length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            В архиве ({archivedProjects.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Загрузка проектов...</span>
              </div>
            </div>
          ) : activeProjects.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет активных проектов</h3>
              <p className="text-gray-500 mb-4">Активные проекты будут отображаться здесь</p>
              <Button onClick={loadProjects} variant="outline">
                Обновить список
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {completedProjects.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет завершенных проектов</h3>
              <p className="text-gray-500">Завершенные проекты будут отображаться здесь</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="archived">
          {archivedProjects.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6m0 0l6-6m-6 6v8" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет архивных проектов</h3>
              <p className="text-gray-500">Архивные проекты будут отображаться здесь</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};