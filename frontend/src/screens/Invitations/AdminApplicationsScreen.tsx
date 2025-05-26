import React, { useState, useEffect } from 'react';
import { getClientApplications, processClientApplication, ClientApplication } from '../../api/invitations';

export const AdminApplicationsScreen: React.FC = () => {
  const [applications, setApplications] = useState<ClientApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<ClientApplication | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadApplications();
  }, [activeTab]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getClientApplications(activeTab);
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке заявок');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (applicationId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(applicationId);
      await processClientApplication(applicationId, action, comment);
      
      // Обновляем список заявок
      await loadApplications();
      
      // Закрываем модальное окно
      setSelectedApplication(null);
      setComment('');
      
      alert(action === 'approve' ? 'Заявка одобрена!' : 'Заявка отклонена!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка при обработке заявки');
    } finally {
      setProcessingId(null);
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

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(budget);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Загрузка заявок...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Заявки от заказчиков
          </h1>
          <p className="text-gray-600">
            Управление заявками на создание проектов
          </p>
        </div>

        {/* Табы */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'pending', label: 'Ожидающие', count: applications.length },
                { key: 'approved', label: 'Одобренные', count: 0 },
                { key: 'rejected', label: 'Отклоненные', count: 0 }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && applications.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                      {applications.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* Список заявок */}
        <div className="bg-white shadow rounded-lg">
          {applications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500 text-lg">
                {activeTab === 'pending' ? 'Нет ожидающих заявок' : 
                 activeTab === 'approved' ? 'Нет одобренных заявок' : 
                 'Нет отклоненных заявок'}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {applications.map((application) => (
                <div key={application.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 mr-3">
                          {application.projectName}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {getStatusText(application.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Заказчик:</p>
                          <p className="font-medium">{application.clientName}</p>
                          <p className="text-sm text-gray-500">{application.clientEmail}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Бюджет:</p>
                          <p className="font-medium text-green-600">{formatBudget(application.budget)}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Дедлайн:</p>
                          <p className="font-medium">{new Date(application.deadline).toLocaleDateString('ru-RU')}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Дата подачи:</p>
                          <p className="font-medium">{formatDate(application.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">Описание:</p>
                        <p className="text-gray-900">{application.description}</p>
                      </div>
                      
                      {application.requirements && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-1">Требования:</p>
                          <p className="text-gray-900">{application.requirements}</p>
                        </div>
                      )}
                      
                      {application.adminComment && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-600 mb-1">Комментарий администратора:</p>
                          <p className="text-gray-900">{application.adminComment}</p>
                        </div>
                      )}
                    </div>
                    
                    {activeTab === 'pending' && (
                      <div className="ml-6 flex space-x-2">
                        <button
                          onClick={() => setSelectedApplication(application)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Обработать
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно для обработки заявки */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              Обработка заявки: {selectedApplication.projectName}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Комментарий (необязательно):
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Добавьте комментарий к решению..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleProcess(selectedApplication.id, 'approve')}
                disabled={processingId === selectedApplication.id}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {processingId === selectedApplication.id ? 'Обработка...' : 'Одобрить'}
              </button>
              
              <button
                onClick={() => handleProcess(selectedApplication.id, 'reject')}
                disabled={processingId === selectedApplication.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {processingId === selectedApplication.id ? 'Обработка...' : 'Отклонить'}
              </button>
              
              <button
                onClick={() => {
                  setSelectedApplication(null);
                  setComment('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 