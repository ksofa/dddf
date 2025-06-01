import React, { useState, useEffect } from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { useAuth } from "../../../../hooks/useAuth";
import { API_BASE_URL } from "../../../../api/config";

interface Application {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

const statusLabels = {
  pending: 'Ожидает',
  in_review: 'На рассмотрении',
  approved: 'Одобрено',
  rejected: 'Отклонено'
};

const statusColors = {
  pending: 'bg-gray-500',
  in_review: 'bg-blue-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500'
};

const priorityLabels = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  urgent: 'Срочно'
};

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

export const ApplicationsView: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_review' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/applications`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data);
    } catch (err) {
      console.error('Error loading applications:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке заявок');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: Application['status'], reviewNotes?: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          reviewNotes: reviewNotes || ''
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update application');
      }

      const updatedApplication = await response.json();
      setApplications(applications.map(app => 
        app.id === applicationId ? updatedApplication : app
      ));
    } catch (err) {
      console.error('Error updating application status:', err);
      alert('Ошибка при обновлении статуса заявки');
    }
  };

  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter(app => app.status === filter);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canReviewApplications = user?.roles?.includes('admin') || user?.roles?.includes('pm');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Загрузка заявок...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={loadApplications}>Попробовать снова</Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Заявки</h1>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Все ({applications.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            size="sm"
          >
            Ожидают ({applications.filter(a => a.status === 'pending').length})
          </Button>
          <Button
            variant={filter === 'in_review' ? 'default' : 'outline'}
            onClick={() => setFilter('in_review')}
            size="sm"
          >
            На рассмотрении ({applications.filter(a => a.status === 'in_review').length})
          </Button>
          <Button
            variant={filter === 'approved' ? 'default' : 'outline'}
            onClick={() => setFilter('approved')}
            size="sm"
          >
            Одобрено ({applications.filter(a => a.status === 'approved').length})
          </Button>
          <Button
            variant={filter === 'rejected' ? 'default' : 'outline'}
            onClick={() => setFilter('rejected')}
            size="sm"
          >
            Отклонено ({applications.filter(a => a.status === 'rejected').length})
          </Button>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            {filter === 'all' ? 'Заявок пока нет' : `Нет заявок со статусом "${statusLabels[filter]}"`}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredApplications.map((application) => (
            <div
              key={application.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{application.title}</h3>
                  <p className="text-gray-600 mb-3">{application.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Категория: <span className="font-medium">{application.category}</span></span>
                    <span>Заявитель: <span className="font-medium">{application.applicantName}</span></span>
                    <span>Email: <span className="font-medium">{application.applicantEmail}</span></span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Badge className={priorityColors[application.priority]}>
                    {priorityLabels[application.priority]}
                  </Badge>
                  <Badge className={`text-white ${statusColors[application.status]}`}>
                    {statusLabels[application.status]}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Создано: {formatDate(application.createdAt)}</span>
                  {application.reviewedAt && (
                    <span>Рассмотрено: {formatDate(application.reviewedAt)}</span>
                  )}
                </div>

                {canReviewApplications && application.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(application.id, 'in_review')}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      Взять в работу
                    </Button>
                  </div>
                )}

                {canReviewApplications && application.status === 'in_review' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const notes = prompt('Комментарий к одобрению (необязательно):');
                        handleStatusChange(application.id, 'approved', notes || '');
                      }}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      Одобрить
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const notes = prompt('Причина отклонения:');
                        if (notes) {
                          handleStatusChange(application.id, 'rejected', notes);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Отклонить
                    </Button>
                  </div>
                )}
              </div>

              {application.reviewNotes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">Комментарий рецензента:</div>
                  <div className="text-sm text-gray-600">{application.reviewNotes}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 