import React, { useEffect, useState } from "react";
import { getApplications, approveApplication, rejectApplication } from "../../api/applications";
import { getUsers, loginUser, getCurrentUser } from "../../api/auth";
import { useAuth } from "../../hooks/useAuth";
import { apiClient } from '../../api/config';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import { Application, User } from '../../types/index';

interface Team {
  id: string;
  name: string;
  description?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

export const ApplicationsListScreen: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [projectManagers, setProjectManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPM, setSelectedPM] = useState<string>('');

  useEffect(() => {
    fetchApplications();
    if (user?.roles.includes('admin')) {
      fetchProjectManagers();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/applications');
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectManagers = async () => {
    try {
      const response = await api.get('/users');
      const pms = response.data.filter((user: User) => user.roles.includes('pm'));
      setProjectManagers(pms);
    } catch (error) {
      console.error('Error fetching project managers:', error);
      toast.error('Failed to load project managers');
    }
  };

  const handleAccept = async (applicationId: string) => {
    try {
      await api.post(`/applications/${applicationId}/accept`);
      toast.success('Application accepted');
      fetchApplications();
    } catch (error) {
      console.error('Error accepting application:', error);
      toast.error('Failed to accept application');
    }
  };

  const handleDecline = async (applicationId: string) => {
    try {
      await api.post(`/applications/${applicationId}/decline`);
      toast.success('Application declined');
      fetchApplications();
    } catch (error) {
      console.error('Error declining application:', error);
      toast.error('Failed to decline application');
    }
  };

  const handleAssignPM = async (applicationId: string) => {
    if (!selectedPM || typeof selectedPM !== 'string') {
      toast.error('Please select a project manager');
      return;
    }

    try {
      await api.post(`/applications/${applicationId}/assign-pm`, { pmId: selectedPM });
      toast.success('PM assigned successfully');
      fetchApplications();
      setSelectedPM('');
    } catch (error) {
      console.error('Error assigning PM:', error);
      toast.error('Failed to assign PM');
    }
  };

  // Фильтрация заявок по ролям и типу
  const filteredApplications = applications.filter(app => {
    if (!user) return false;
    if (user.roles.includes('admin')) {
      return app.type === 'client_request'; // заявки от заказчиков
    }
    if (user.roles.includes('pm')) {
      return app.senderId === user.uid || app.receiverId === user.uid;
    }
    if (user.roles.includes('executor')) {
      return app.receiverId === user.uid;
    }
    return false;
  });

  const renderApplicationActions = (application: Application) => {
    if (!user) return null;

    if (user.roles.includes('admin')) {
      return (
        <div className="flex flex-col gap-3 min-w-[200px]">
          <Select value={selectedPM || ''} onValueChange={(value: string) => setSelectedPM(value)}>
            <SelectTrigger className="w-full h-10 border-[#dededf] rounded-lg">
              <SelectValue placeholder="Выберите PM" />
            </SelectTrigger>
            <SelectContent>
              {projectManagers.map((pm) => (
                <SelectItem key={pm.id} value={String(pm.id)}>
                  {pm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={() => handleAssignPM(application.id)}
            disabled={!selectedPM}
            className="w-full h-10 bg-main-colorsaqua hover:bg-[#3771C8] disabled:bg-neutralneutral-80 text-white rounded-lg font-paragraph-16-medium transition-colors"
          >
            Назначить PM
          </button>
        </div>
      );
    }

    if (user.roles.includes('executor') && application.receiverId === user.uid) {
      return (
        <div className="flex flex-col gap-2 min-w-[120px]">
          <button 
            onClick={() => handleAccept(application.id)}
            className="h-10 bg-main-colorsgreen hover:bg-[#0fb14d] text-white rounded-lg font-paragraph-16-medium transition-colors"
          >
            Принять
          </button>
          <button 
            onClick={() => handleDecline(application.id)} 
            className="h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg font-paragraph-16-medium transition-colors"
          >
            Отклонить
          </button>
        </div>
      );
    }

    return null;
  };

  const getAvatarUrl = (user: User) => {
    return user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.name || 'User')}&background=random`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Ожидает', className: 'bg-main-colorsorange text-white' },
      approved: { label: 'Принята', className: 'bg-main-colorsgreen text-white' },
      rejected: { label: 'Отклонена', className: 'bg-red-500 text-white' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-status ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getPageTitle = () => {
    if (!user) return 'Заявки';
    
    if (user.roles.includes('admin')) {
      return 'Все заявки';
    } else if (user.roles.includes('pm')) {
      return 'Отправленные заявки';
    } else if (user.roles.includes('executor')) {
      return 'Входящие заявки';
    }
    
    return 'Заявки';
  };

  const getEmptyStateMessage = () => {
    if (!user) return 'Заявок пока нет';
    
    if (user.roles.includes('admin')) {
      return 'В системе пока нет заявок';
    } else if (user.roles.includes('pm')) {
      return 'Вы пока не отправляли заявки исполнителям';
    } else if (user.roles.includes('executor')) {
      return 'Вам пока не поступало предложений о работе';
    }
    
    return 'Заявок пока нет';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-main-colorsbackground min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-h1-alternative text-neutralneutral-10">{getPageTitle()}</h1>
        
        <button
          onClick={fetchApplications}
          className="px-4 py-2 bg-main-colorsaqua text-white rounded-lg text-sm hover:bg-[#3771C8] transition-colors"
        >
          Обновить
        </button>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-neutralneutral-60 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-h2 text-neutralneutral-10 mb-2">{getEmptyStateMessage()}</h3>
          <p className="text-neutralneutral-60 font-paragraph-16">
            {user?.roles.includes('pm') && 'Найдите исполнителей в разделе "Команды" и отправьте им предложения'}
            {user?.roles.includes('executor') && 'Заявки будут появляться здесь, когда проектные менеджеры отправят вам предложения'}
            {user?.roles.includes('admin') && 'Заявки будут отображаться здесь по мере их создания'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <div key={application.id} className="bg-neutralneutral-100 rounded-xl border border-[#ececec] p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-main-colorsaqua-20 rounded-lg flex items-center justify-center">
                      <img className="w-6 h-6" alt="Application" src="/stamp.svg" />
                    </div>
                    <div>
                      <h2 className="text-lg font-h2 text-neutralneutral-10">
                        {application.type === 'team_invitation' ? 'Приглашение в команду' : 'Заявка на проект'}
                      </h2>
                      {getStatusBadge(application.status)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-neutralneutral-60 font-paragraph-16">
                      <span className="font-paragraph-16-medium">От:</span> {application.sender?.name || 'Неизвестно'}
                    </p>
                    {application.team && (
                      <p className="text-neutralneutral-60 font-paragraph-16">
                        <span className="font-paragraph-16-medium">Команда:</span> {application.team.name}
                      </p>
                    )}
                    {application.project && (
                      <p className="text-neutralneutral-60 font-paragraph-16">
                        <span className="font-paragraph-16-medium">Проект:</span> {application.project.name}
                      </p>
                    )}
                    {application.assignedPM && (
                      <p className="text-neutralneutral-60 font-paragraph-16">
                        <span className="font-paragraph-16-medium">Назначен PM:</span> {application.assignedPM}
                      </p>
                    )}
                    {application.coverLetter && (
                      <p className="text-neutralneutral-10 font-paragraph-16 mt-3">
                        {application.coverLetter}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="ml-6">
                  {renderApplicationActions(application)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 