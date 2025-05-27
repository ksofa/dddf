import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { useAuth } from '../../../../hooks/useAuth';
import { apiClient } from '../../../../api/config';

interface Application {
  id: string;
  projectTitle: string;
  projectDescription: string;
  fullName: string;
  phone: string;
  email?: string;
  rate?: string;
  startDate?: string;
  estimatedDuration?: number;
  estimatedDurationUnit?: string;
  coverLetter?: string;
  techSpec?: string;
  techSpecFile?: {
    originalName: string;
    size: number;
    path: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  approvedAt?: any;
  rejectedAt?: any;
  rejectionReason?: string;
  assignedPM?: string;
  projectId?: string;
}

interface User {
  id: string;
  uid?: string;
  displayName: string;
  email: string;
  roles: string[];
}

export const ApplicationsView = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [projectManagers, setProjectManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPMs, setSelectedPMs] = useState<{ [key: string]: string }>({});
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user?.roles?.includes('admin')) {
      loadApplications();
      loadProjectManagers();
    }
  }, [user]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading applications...');
      
      // Добавляем timestamp для избежания кэширования
      const timestamp = new Date().getTime();
      const response = await apiClient.get(`/applications?_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      console.log('✅ Applications loaded:', response.data);
      
      // Проверяем, что данные корректные
      if (Array.isArray(response.data)) {
        setApplications(response.data);
        console.log('📊 Applications count:', response.data.length);
      } else {
        console.warn('⚠️ Invalid applications data format:', response.data);
        setApplications([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading applications:', error);
      setError(`Ошибка загрузки заявок: ${error.response?.data?.message || error.message}`);
      setApplications([]); // Очищаем заявки при ошибке
    } finally {
      setLoading(false);
    }
  };

  const loadProjectManagers = async () => {
    try {
      console.log('🔄 Loading project managers...');
      const response = await apiClient.get('/users', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const pms = response.data.filter((user: User) => user.roles?.includes('pm'));
      console.log('✅ Project managers loaded:', pms.length);
      setProjectManagers(pms);
    } catch (error: any) {
      console.error('❌ Error loading project managers:', error);
    }
  };

  const handleApprove = async (applicationId: string) => {
    const pmId = selectedPMs[applicationId];
    if (!pmId) {
      alert('Пожалуйста, выберите проект-менеджера');
      return;
    }

    try {
      setProcessingIds(prev => new Set(prev).add(applicationId));
      console.log('🔄 Approving application:', applicationId, 'with PM:', pmId);
      
      await apiClient.post(`/applications/${applicationId}/approve`, { pmId });
      
      console.log('✅ Application approved successfully');
      alert('Заявка одобрена и проект создан!');
      
      // Перезагружаем заявки
      await loadApplications();
      
      // Очищаем выбранного PM
      setSelectedPMs(prev => {
        const newState = { ...prev };
        delete newState[applicationId];
        return newState;
      });
    } catch (error: any) {
      console.error('❌ Error approving application:', error);
      alert(`Ошибка при одобрении заявки: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  const handleReject = async (applicationId: string) => {
    const reason = prompt('Укажите причину отклонения (необязательно):');
    
    try {
      setProcessingIds(prev => new Set(prev).add(applicationId));
      console.log('🔄 Rejecting application:', applicationId);
      
      await apiClient.post(`/applications/${applicationId}/reject`, { reason });
      
      console.log('✅ Application rejected successfully');
      alert('Заявка отклонена');
      
      // Перезагружаем заявки
      await loadApplications();
    } catch (error: any) {
      console.error('❌ Error rejecting application:', error);
      alert(`Ошибка при отклонении заявки: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Не указано';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Неверная дата';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'approved': return 'Одобрена';
      case 'rejected': return 'Отклонена';
      default: return status;
    }
  };

  // Фильтрация заявок
  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  if (!user?.roles?.includes('admin')) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Доступ запрещен</h2>
        <p className="text-gray-600">Только администраторы могут просматривать заявки</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Загрузка заявок...</span>
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
          <Button 
            onClick={loadApplications}
            variant="outline"
            size="sm"
            className="mt-3 text-red-600 border-red-300 hover:bg-red-50"
          >
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок и действия */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Заявки от заказчиков</h1>
            <p className="text-gray-600 mt-1">Управление заявками на создание проектов</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={loadApplications}
              variant="outline"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Загрузка...' : 'Обновить'}
            </Button>
          </div>
        </div>

        {/* Фильтры */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус заявки
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="pending">Ожидающие</SelectItem>
                  <SelectItem value="approved">Одобренные</SelectItem>
                  <SelectItem value="rejected">Отклоненные</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Всего заявок: <span className="font-medium">{applications.length}</span>
                {statusFilter !== 'all' && (
                  <span> | Отфильтровано: <span className="font-medium">{filteredApplications.length}</span></span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Список заявок */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {statusFilter === 'all' ? 'Нет заявок' : `Нет заявок со статусом "${getStatusText(statusFilter)}"`}
            </h3>
            <p className="text-gray-500">Заявки от заказчиков будут отображаться здесь</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((application) => (
              <Card key={application.id} className="shadow-sm border border-gray-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{application.projectTitle}</CardTitle>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(application.status)}>
                          {getStatusText(application.status)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Подана: {formatDate(application.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Основная информация */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Информация о заказчике</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">ФИО:</span> {application.fullName}</p>
                          <p><span className="font-medium">Телефон:</span> {application.phone}</p>
                          {application.email && (
                            <p><span className="font-medium">Email:</span> {application.email}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Описание проекта</h4>
                        <p className="text-sm text-gray-700">{application.projectDescription}</p>
                      </div>

                      {application.techSpec && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Техническое задание</h4>
                          <p className="text-sm text-gray-700">{application.techSpec}</p>
                        </div>
                      )}

                      {application.coverLetter && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Сопроводительное письмо</h4>
                          <p className="text-sm text-gray-700">{application.coverLetter}</p>
                        </div>
                      )}
                    </div>

                    {/* Дополнительная информация и действия */}
                    <div className="space-y-4">
                      {/* Детали проекта */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Детали проекта</h4>
                        <div className="space-y-1 text-sm">
                          {application.rate && (
                            <p><span className="font-medium">Оплата:</span> {application.rate}</p>
                          )}
                          {application.startDate && (
                            <p><span className="font-medium">Дата начала:</span> {new Date(application.startDate).toLocaleDateString('ru-RU')}</p>
                          )}
                          {application.estimatedDuration && (
                            <p><span className="font-medium">Длительность:</span> {application.estimatedDuration} {application.estimatedDurationUnit || 'дней'}</p>
                          )}
                        </div>
                      </div>

                      {/* Файл ТЗ */}
                      {application.techSpecFile && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Прикрепленный файл</h4>
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{application.techSpecFile.originalName}</p>
                              <p className="text-xs text-gray-500">{Math.round(application.techSpecFile.size / 1024)} KB</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/api/applications/${application.id}/tech-spec-file`, '_blank')}
                            >
                              Скачать
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Действия для ожидающих заявок */}
                      {application.status === 'pending' && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Назначить проект-менеджера</h4>
                          <div className="space-y-3">
                            <Select 
                              value={selectedPMs[application.id] || ''} 
                              onValueChange={(value) => setSelectedPMs(prev => ({ ...prev, [application.id]: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите PM" />
                              </SelectTrigger>
                              <SelectContent>
                                {projectManagers.map((pm) => (
                                  <SelectItem key={pm.id} value={pm.id}>
                                    {pm.displayName} ({pm.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApprove(application.id)}
                                disabled={!selectedPMs[application.id] || processingIds.has(application.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                {processingIds.has(application.id) ? 'Обработка...' : 'Одобрить и создать проект'}
                              </Button>
                              <Button
                                onClick={() => handleReject(application.id)}
                                disabled={processingIds.has(application.id)}
                                variant="outline"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                Отклонить
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Информация об обработке */}
                      {application.status === 'approved' && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-1">Заявка одобрена</h4>
                          <p className="text-sm text-green-700">
                            Одобрена: {formatDate(application.approvedAt)}
                          </p>
                          {application.projectId && (
                            <p className="text-sm text-green-700">
                              ID проекта: {application.projectId}
                            </p>
                          )}
                        </div>
                      )}

                      {application.status === 'rejected' && (
                        <div className="p-3 bg-red-50 rounded-lg">
                          <h4 className="font-medium text-red-900 mb-1">Заявка отклонена</h4>
                          <p className="text-sm text-red-700">
                            Отклонена: {formatDate(application.rejectedAt)}
                          </p>
                          {application.rejectionReason && (
                            <p className="text-sm text-red-700 mt-1">
                              Причина: {application.rejectionReason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};