import { apiClient } from './config';

export interface ApplicationData {
  fullName: string;
  phone: string;
  projectTitle: string;
  projectDescription: string;
  email?: string;
  techSpec?: string;
  techSpecFile?: File;
}

export interface Application {
  id: string;
  fullName: string;
  phone: string;
  projectTitle: string;
  projectDescription: string;
  email?: string;
  techSpec?: string;
  techSpecFile?: {
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimetype: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  assignedTeamLead?: string;
  teamMembers: string[];
}

// Создать заявку (без авторизации)
export async function createApplication(data: ApplicationData): Promise<{ message: string; applicationId: string; data: Application }> {
  const formData = new FormData();
  
  formData.append('fullName', data.fullName);
  formData.append('phone', data.phone);
  formData.append('projectTitle', data.projectTitle);
  formData.append('projectDescription', data.projectDescription);
  
  if (data.email) {
    formData.append('email', data.email);
  }
  
  if (data.techSpec) {
    formData.append('techSpec', data.techSpec);
  }
  
  if (data.techSpecFile) {
    formData.append('techSpecFile', data.techSpecFile);
  }

  const response = await apiClient.post('/applications', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

// Получить все заявки (для админов)
export async function getApplications(params?: { status?: string; limit?: number }): Promise<Application[]> {
  const response = await apiClient.get('/applications', { params });
  return response.data;
}

// Одобрить заявку
export async function approveApplication(applicationId: string, teamLeadId?: string): Promise<{ message: string }> {
  const response = await apiClient.post(`/applications/${applicationId}/approve`, {
    teamLeadId
  });
  return response.data;
}

// Отклонить заявку
export async function rejectApplication(applicationId: string, reason?: string): Promise<{ message: string }> {
  const response = await apiClient.post(`/applications/${applicationId}/reject`, {
    reason
  });
  return response.data;
} 