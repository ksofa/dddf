import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { api } from "../../../../services/api";
import { 
  getUserChats, 
  getProjectChats,
  getChatMessages, 
  sendMessage, 
  createChat,
  getAllUsers,
  markMessagesAsRead, 
  Chat, 
  Message, 
  SendMessageRequest,
  User
} from "../../../../api/chats";
import { useAuth } from "../../../../hooks/useAuth";

interface Project {
  id: string;
  title: string;
  teamMembers: string[];
  teamLead: string;
  description?: string;
  status?: string[];
}

// Расширяем интерфейс Chat для дополнительных полей
interface ExtendedChat extends Chat {
  unreadCount?: number;
  lastMessageData?: {
    text: string;
    timestamp: Date;
    senderId: string;
  };
}

// Расширяем интерфейс Message для дополнительных полей
interface ExtendedMessage extends Message {
  senderName?: string;
}

// Расширяем интерфейс User для участников чата
interface ChatParticipant {
  id: string;
  displayName?: string;
  email?: string;
  profileImage?: string;
}

export const ChatsView = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [chats, setChats] = useState<ExtendedChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<ExtendedChat | null>(null);
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [mobileView, setMobileView] = useState<'projects' | 'chats' | 'messages'>('projects');
  
  // Состояние для создания нового чата
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [newChatName, setNewChatName] = useState("");
  const [newChatType, setNewChatType] = useState<'group' | 'direct'>('group');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [creatingChat, setCreatingChat] = useState(false);

  // Загрузка проектов в зависимости от роли
  useEffect(() => {
    if (user) {
      if (user.roles?.includes('admin')) {
        // Админ видит все проекты
        loadAllProjects();
      } else if (user.roles?.includes('pm')) {
        // PM видит свои проекты
        loadProjects();
      } else if (user.roles?.includes('executor')) {
        // Executor видит проекты где участвует
        loadExecutorProjects();
      } else {
        loadChats();
      }
      loadAllUsers();
    }
  }, [user]);

  const loadAllProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error loading all projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      const userProjects = response.data.filter((project: any) => 
        project.teamLead === user?.uid || 
        project.manager === user?.uid ||
        project.pmId === user?.uid
      );
      setProjects(userProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExecutorProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      const userProjects = response.data.filter((project: any) => 
        project.team?.includes(user?.uid) ||
        project.teamMembers?.some((member: any) => member.id === user?.uid)
      );
      setProjects(userProjects);
    } catch (error) {
      console.error('Error loading executor projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectChats = async (project: Project) => {
    try {
      setSelectedProject(project);
      const projectChats = await getProjectChats(project.id);
      setChats(projectChats as ExtendedChat[]);
      setMobileView('chats');
    } catch (error) {
      console.error('Error loading project chats:', error);
    }
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      const userChats = await getUserChats();
      setChats(userChats as ExtendedChat[]);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const users = await getAllUsers();
      setAllUsers(users.filter(u => u.id !== user?.uid));
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Загрузка сообщений чата
  const loadChatMessages = async (chat: ExtendedChat) => {
    try {
      setSelectedChat(chat);
      
      const chatMessages = await getChatMessages(chat.projectId, chat.id);
      setMessages(chatMessages as ExtendedMessage[]);
      
      // Отмечаем сообщения как прочитанные
      await markMessagesAsRead(chat.projectId, chat.id);
      
      setMobileView('messages');
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sendingMessage) return;
    
    setSendingMessage(true);
    try {
      const messageData: SendMessageRequest = {
        chatId: selectedChat.id,
        projectId: selectedChat.projectId,
        text: newMessage
      };
      
      await sendMessage(messageData);
      setNewMessage("");
      
      // Перезагружаем сообщения
      await loadChatMessages(selectedChat);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateChat = async () => {
    if (!newChatName.trim() || selectedUsers.length === 0 || creatingChat || !selectedProject) return;
    
    setCreatingChat(true);
    try {
      await createChat(selectedProject.id, newChatName, selectedUsers, newChatType);
      
      // Сбрасываем форму
      setNewChatName("");
      setSelectedUsers([]);
      setShowCreateChat(false);
      
      // Перезагружаем чаты
      await loadProjectChats(selectedProject);
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setCreatingChat(false);
    }
  };

  const getAvatarUrl = (user: User) => {
    return user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=random`;
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  const getChatDisplayName = (chat: ExtendedChat) => {
    if (chat.type === 'direct') {
      // Для прямых чатов ищем другого участника
      const otherParticipantId = chat.participants?.find(p => p !== user?.uid);
      if (otherParticipantId) {
        const participant = allUsers.find(u => u.id === otherParticipantId);
        return participant?.displayName || 'Прямой чат';
      }
      return 'Прямой чат';
    }
    return chat.name || 'Групповой чат';
  };

  const getChatSubtitle = (chat: ExtendedChat) => {
    if (chat.type === 'direct') {
      return 'Личная переписка';
    }
    return `${chat.participants?.length || 0} участников`;
  };

  const getTitle = () => {
    if (user?.roles?.includes('admin')) return 'Все чаты проектов';
    if (user?.roles?.includes('pm')) return 'Чаты моих проектов';
    if (user?.roles?.includes('executor')) return 'Чаты проектов';
    return 'Чаты';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Загрузка чатов...</span>
        </div>
      </div>
    );
  }

  // Мобильная версия - показываем сообщения
  if (selectedChat && mobileView === 'messages') {
    return (
      <div className="flex flex-col h-screen bg-white">
        {/* Заголовок чата */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileView('chats')}
              className="md:hidden"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <div>
              <h3 className="font-semibold text-gray-900">{getChatDisplayName(selectedChat)}</h3>
              <p className="text-sm text-gray-500">{getChatSubtitle(selectedChat)}</p>
            </div>
          </div>
        </div>

        {/* Сообщения */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === user?.uid
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.senderId !== user?.uid && (
                  <p className="text-xs font-medium mb-1 opacity-75">
                    {message.senderName || message.sender?.displayName || 'Пользователь'}
                  </p>
                )}
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.senderId === user?.uid ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Поле ввода сообщения */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Введите сообщение..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sendingMessage}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendingMessage}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Показываем чаты проекта
  if (selectedProject && mobileView === 'chats') {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedProject(null);
                  setMobileView('projects');
                }}
                className="mb-3 text-blue-600 hover:text-blue-800 p-0"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Назад к проектам
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Чаты проекта</h1>
              <p className="text-gray-600 mt-1">{selectedProject.title}</p>
            </div>
            <Button 
              onClick={() => setShowCreateChat(true)}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Создать чат
            </Button>
          </div>

          {/* Список чатов */}
          {chats.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет чатов</h3>
              <p className="text-gray-500 mb-4">Создайте первый чат для этого проекта</p>
              <Button onClick={() => setShowCreateChat(true)}>
                Создать чат
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {chats.map((chat) => (
                <Card 
                  key={chat.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => loadChatMessages(chat)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{getChatDisplayName(chat)}</h3>
                          <p className="text-gray-600">{getChatSubtitle(chat)}</p>
                          {chat.lastMessageData && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                              {chat.lastMessageData.text}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={chat.type === 'direct' ? 'outline' : 'default'}>
                          {chat.type === 'direct' ? 'Личный' : 'Групповой'}
                        </Badge>
                        {chat.unreadCount && chat.unreadCount > 0 && (
                          <Badge className="bg-red-500 text-white">
                            {chat.unreadCount}
                          </Badge>
                        )}
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Модальное окно создания чата */}
        {showCreateChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Создать чат</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateChat(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название чата
                  </label>
                  <input
                    type="text"
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    placeholder="Введите название чата..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип чата
                  </label>
                  <select
                    value={newChatType}
                    onChange={(e) => setNewChatType(e.target.value as 'group' | 'direct')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="group">Групповой чат</option>
                    <option value="direct">Личный чат</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Участники
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {allUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium">{user.displayName}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleCreateChat}
                    disabled={!newChatName.trim() || selectedUsers.length === 0 || creatingChat}
                    className="flex-1"
                  >
                    {creatingChat ? 'Создание...' : 'Создать чат'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateChat(false)}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Показываем список проектов
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{getTitle()}</h1>
          <p className="text-gray-600 mt-1">Общайтесь с командой в чатах проектов</p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет доступных проектов</h3>
            <p className="text-gray-500">Проекты с чатами будут отображаться здесь</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => loadProjectChats(project)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                      <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
                    </div>
                    {project.status && project.status.length > 0 && (
                      <Badge className="bg-green-100 text-green-800">
                        {project.status[0] === 'active' ? 'Активный' : project.status[0]}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{project.teamMembers?.length || 0} участников</span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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