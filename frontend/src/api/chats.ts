import { api } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  displayName?: string;
  fullName?: string;
  profileImage?: string;
  roles?: string[];
}

export interface Chat {
  id: string;
  projectId: string;
  projectTitle: string;
  name: string;
  type: 'group' | 'direct';
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageBy?: string;
  createdAt: Date;
  updatedAt: Date;
  isTeamChat?: boolean;
  isPrivateChat?: boolean;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  sender?: {
    id: string;
    displayName: string;
    profileImage?: string;
  };
  timestamp: Date;
  type: 'text' | 'file' | 'image';
  readBy?: string[];
}

export interface SendMessageRequest {
  chatId: string;
  projectId: string;
  text: string;
}

// Получить все чаты пользователя
export const getUserChats = async (): Promise<Chat[]> => {
  try {
    const response = await api.get('/chats');
    return response.data;
  } catch (error) {
    console.error('Error fetching user chats:', error);
    throw error;
  }
};

// Получить чаты проекта
export const getProjectChats = async (projectId: string): Promise<Chat[]> => {
  try {
    const response = await api.get(`/projects/${projectId}/chats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project chats:', error);
    throw error;
  }
};

// Получить сообщения чата
export const getChatMessages = async (
  projectId: string,
  chatId: string,
  limit: number = 50
): Promise<Message[]> => {
  try {
    const response = await api.get(`/projects/${projectId}/chats/${chatId}/messages`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }
};

// Получить сообщения глобального чата
export async function getGlobalChatMessages(chatId: string, limit = 50): Promise<Message[]> {
  const response = await api.get(`/chats/global/${chatId}/messages`, {
    params: { limit }
  });
  return response.data;
}

// Отправить сообщение
export const sendMessage = async (data: SendMessageRequest): Promise<Message> => {
  try {
    const response = await api.post(`/projects/${data.projectId}/chats/${data.chatId}/messages`, {
      text: data.text
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Создать новый чат
export const createChat = async (
  projectId: string,
  name: string,
  participants: string[],
  type: 'group' | 'direct' = 'group'
): Promise<Chat> => {
  try {
    const response = await api.post(`/projects/${projectId}/chats`, {
      name,
      participants,
      type
    });
    return response.data;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

// Отметить сообщения как прочитанные
export const markMessagesAsRead = async (
  projectId: string,
  chatId: string
): Promise<void> => {
  try {
    await api.post(`/projects/${projectId}/chats/${chatId}/read`);
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

// Добавить участника в чат
export const addParticipant = async (
  projectId: string,
  chatId: string,
  userId: string
): Promise<void> => {
  try {
    await api.post(`/projects/${projectId}/chats/${chatId}/participants`, {
      userId
    });
  } catch (error) {
    console.error('Error adding participant:', error);
    throw error;
  }
};

// Удалить участника из чата
export const removeParticipant = async (
  projectId: string,
  chatId: string,
  userId: string
): Promise<void> => {
  try {
    await api.delete(`/projects/${projectId}/chats/${chatId}/participants/${userId}`);
  } catch (error) {
    console.error('Error removing participant:', error);
    throw error;
  }
};

// Получить статистику чата
export const getChatStats = async (
  projectId: string,
  chatId: string
): Promise<any> => {
  try {
    const response = await api.get(`/projects/${projectId}/chats/${chatId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chat stats:', error);
    throw error;
  }
};

// Получить участников проекта (для создания чатов)
export async function getProjectMembers(projectId: string): Promise<User[]> {
  const response = await api.get(`/projects/${projectId}/members`);
  return response.data;
}

// Получить всех пользователей (для создания чатов) - только для админов
export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    // Если нет доступа к /users, возвращаем пустой массив
    console.warn('No access to all users, using project members instead');
    return [];
  }
} 