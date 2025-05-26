import React, { useState, useEffect } from 'react';
import { createClientApplication, getMyApplications, ClientApplication } from '../../api/invitations';

export const ClientApplicationScreen: React.FC = () => {
  const [applications, setApplications] = useState<ClientApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Форма создания заявки
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    budget: '',
    deadline: '',
    requirements: '',
    contactInfo: {
      phone: '',
      telegram: '',
      email: ''
    }
  });

  useEffect(() => {
    loadApplications();
  }, [activeTab]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyApplications(activeTab);
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке заявок');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectName || !formData.description || !formData.budget || !formData.deadline) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    try {
      setSubmitting(true);
      await createClientApplication({
        projectName: formData.projectName,
        description: formData.description,
        budget: parseFloat(formData.budget),
        deadline: formData.deadline,
        requirements: formData.requirements,
        contactInfo: formData.contactInfo
      });

      // Сбрасываем форму
      setFormData({
        projectName: '',
        description: '',
        budget: '',
        deadline: '',
        requirements: '',
        contactInfo: {
          phone: '',
          telegram: '',
          email: ''
        }
      });

      setShowCreateForm(false);
      await loadApplications();
      alert('Заявка успешно отправлена!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка при создании заявки');
    } finally {
      setSubmitting(false);
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
      case 'pending': return 'На рассмотрении';
      case 'approved': return 'Одобрена';
      case 'rejected': return 'Отклонена';
      default: return status;
    }
  };

  if (loading && !showCreateForm) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Загрузка заявок...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Мои заявки на проекты
            </h1>
            <p className="text-gray-600">
              Создание и управление заявками на разработку проектов
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Создать заявку
          </button>
        </div>

        {/* Табы */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'pending', label: 'На рассмотрении', count: applications.length },
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
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-500 text-lg mb-4">
                {activeTab === 'pending' ? 'Нет заявок на рассмотрении' : 
                 activeTab === 'approved' ? 'Нет одобренных заявок' : 
                 'Нет отклоненных заявок'}
              </div>
              {activeTab === 'pending' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Создать первую заявку
                </button>
              )}
            </div>
          ) : (
            applications.map((application) => (
              <div key={application.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 mr-3">
                        {application.projectName}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {getStatusText(application.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-600 mb-1">Комментарий администратора:</p>
                        <p className="text-gray-900">{application.adminComment}</p>
                        {application.processedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(application.processedAt)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Модальное окно создания заявки */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-6">Создать заявку на проект</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название проекта *
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Введите название проекта"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание проекта *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Опишите ваш проект подробно"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Бюджет (₽) *
                    </label>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100000"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Дедлайн *
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дополнительные требования
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Укажите дополнительные требования к проекту"
                  />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Контактная информация</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Телефон</label>
                      <input
                        type="tel"
                        value={formData.contactInfo.phone}
                        onChange={(e) => setFormData({
                          ...formData, 
                          contactInfo: {...formData.contactInfo, phone: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+7 (999) 123-45-67"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Telegram</label>
                      <input
                        type="text"
                        value={formData.contactInfo.telegram}
                        onChange={(e) => setFormData({
                          ...formData, 
                          contactInfo: {...formData.contactInfo, telegram: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="@username"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.contactInfo.email}
                        onChange={(e) => setFormData({
                          ...formData, 
                          contactInfo: {...formData.contactInfo, email: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Отправка...' : 'Отправить заявку'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 