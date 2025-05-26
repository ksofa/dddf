import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/config';
import { useAuth } from '../../hooks/useAuth';

interface Invitation {
  id: string;
  projectId: string;
  projectTitle: string;
  senderName: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
}

export const InvitationsScreen: React.FC = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Загружаем приглашения
  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get('/my-invitations');
        setInvitations(response.data);
      } catch (error: any) {
        console.error('Error fetching invitations:', error);
        setError('Не удалось загрузить приглашения');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.roles?.includes('executor')) {
      fetchInvitations();
    }
  }, [user]);

  // Принять приглашение
  const handleAccept = async (invitationId: string) => {
    try {
      setProcessingId(invitationId);
      
      await apiClient.post(`/invitations/${invitationId}/accept`);
      
      // Обновляем список приглашений
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      alert('Приглашение принято! Вы добавлены в команду проекта.');
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      alert('Ошибка при принятии приглашения');
    } finally {
      setProcessingId(null);
    }
  };

  // Отклонить приглашение
  const handleDecline = async (invitationId: string) => {
    try {
      setProcessingId(invitationId);
      
      await apiClient.post(`/invitations/${invitationId}/decline`);
      
      // Обновляем список приглашений
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      alert('Приглашение отклонено.');
    } catch (error: any) {
      console.error('Error declining invitation:', error);
      alert('Ошибка при отклонении приглашения');
    } finally {
      setProcessingId(null);
    }
  };

  if (!user?.roles?.includes('executor')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Доступ только для исполнителей</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка приглашений...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Приглашения в проекты</h2>
      </div>

      {invitations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">Нет новых приглашений</div>
          <p className="text-sm text-gray-400">
            Приглашения в проекты будут отображаться здесь
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {invitation.projectTitle}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    От: <span className="font-medium">{invitation.senderName}</span>
                  </p>
                  {invitation.message && (
                    <p className="text-gray-700 mb-4">
                      {invitation.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Получено: {new Date(invitation.createdAt.toDate()).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <div className="flex space-x-3 ml-4">
                  <button
                    onClick={() => handleAccept(invitation.id)}
                    disabled={processingId === invitation.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === invitation.id ? 'Принимаю...' : 'Принять'}
                  </button>
                  <button
                    onClick={() => handleDecline(invitation.id)}
                    disabled={processingId === invitation.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === invitation.id ? 'Отклоняю...' : 'Отклонить'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 