import { getAuthToken } from './auth';

const API_BASE_URL = 'http://localhost:3000/api';

// ============= ИНТЕРФЕЙСЫ =============

export interface TeamInvitation {
  id: string;
  type: 'team_invitation';
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  userEmail: string;
  senderId: string;
  senderName: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
  updatedAt: any;
  respondedAt?: any;
}

export interface ClientApplication {
  id: string;
  type: 'client_application';
  projectName: string;
  description: string;
  budget: number;
  deadline: string;
  requirements: string;
  contactInfo: any;
  clientId: string;
  clientName: string;
  clientEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  updatedAt: any;
  processedBy?: string;
  processedAt?: any;
  adminComment?: string;
}

// Для обратной совместимости
export interface Invitation extends TeamInvitation {}

// ============= ЗАЯВКИ НА ВСТУПЛЕНИЕ В КОМАНДУ (ДЛЯ PM) =============

// Отправить заявку пользователю на вступление в команду
export const sendTeamInvitation = async (projectId: string, userId: string, message?: string): Promise<{ message: string; invitationId: string }> => {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, message }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка при отправке заявки');
  }

  return response.json();
};

// Получить входящие заявки на вступление в команду для текущего пользователя
export const getMyTeamInvitations = async (status: string = 'pending'): Promise<TeamInvitation[]> => {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/team-invitations?status=${status}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка при получении заявок');
  }

  return response.json();
};

// Ответить на заявку на вступление в команду (принять/отклонить)
export const respondToTeamInvitation = async (invitationId: string, action: 'accept' | 'reject'): Promise<{ message: string; status: string }> => {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/team-invitations/${invitationId}/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка при обработке заявки');
  }

  return response.json();
};

// Получить отправленные заявки на вступление в команду для проекта (для PM)
export const getProjectTeamInvitations = async (projectId: string): Promise<TeamInvitation[]> => {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/team-invitations`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка при получении заявок проекта');
  }

  return response.json();
};

// ============= ЗАЯВКИ ОТ ЗАКАЗЧИКОВ (ДЛЯ АДМИНОВ) =============

// Создать заявку от заказчика на создание проекта
export const createClientApplication = async (applicationData: {
  projectName: string;
  description: string;
  budget: number;
  deadline: string;
  requirements?: string;
  contactInfo?: any;
}): Promise<{ message: string; applicationId: string }> => {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/client-applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(applicationData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка при создании заявки');
  }

  return response.json();
};

// Получить заявки от заказчиков (для админов)
export const getClientApplications = async (status: string = 'pending'): Promise<ClientApplication[]> => {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/client-applications?status=${status}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка при получении заявок от заказчиков');
  }

  return response.json();
};

// Обработать заявку от заказчика (для админов)
export const processClientApplication = async (
  applicationId: string, 
  action: 'approve' | 'reject', 
  comment?: string
): Promise<{ message: string; status: string }> => {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/client-applications/${applicationId}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ action, comment }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка при обработке заявки');
  }

  return response.json();
};

// Получить мои заявки (для заказчиков)
export const getMyApplications = async (status?: string): Promise<ClientApplication[]> => {
  const token = await getAuthToken();
  
  const url = status 
    ? `${API_BASE_URL}/my-applications?status=${status}`
    : `${API_BASE_URL}/my-applications`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка при получении моих заявок');
  }

  return response.json();
};

// ============= УНИВЕРСАЛЬНЫЕ ФУНКЦИИ =============

// Получить заявки в зависимости от роли пользователя
export const getInvitations = async (status: string = 'pending'): Promise<(TeamInvitation | ClientApplication)[]> => {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/invitations?status=${status}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка при получении заявок');
  }

  return response.json();
};

// ============= ФУНКЦИИ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ =============

// Отправить заявку (для обратной совместимости)
export const sendInvitation = sendTeamInvitation;

// Получить входящие заявки (для обратной совместимости)
export const getMyInvitations = getMyTeamInvitations;

// Ответить на заявку (для обратной совместимости)
export const respondToInvitation = respondToTeamInvitation;

// Получить отправленные заявки для проекта (для обратной совместимости)
export const getProjectInvitations = getProjectTeamInvitations;

// Принять приглашение
export const acceptInvitation = async (invitationId: string) => {
  return respondToTeamInvitation(invitationId, 'accept');
};

// Отклонить приглашение
export const declineInvitation = async (invitationId: string) => {
  return respondToTeamInvitation(invitationId, 'reject');
}; 