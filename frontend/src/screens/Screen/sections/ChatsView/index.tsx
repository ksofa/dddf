import React, { useState, useEffect } from "react";
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
  SendMessageRequest
} from "../../../../api/chats";
import { useAuth } from "../../../../hooks/useAuth";

interface Project {
  id: string;
  title: string;
  teamMembers: string[];
  teamLead: string;
}

interface User {
  id: string;
  displayName?: string;
  profileImage?: string;
}

export const ChatsView = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
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
      setChats(projectChats);
      setMobileView('chats');
    } catch (error) {
      console.error('Error loading project chats:', error);
    }
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      const userChats = await getUserChats();
      setChats(userChats);
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
  const loadChatMessages = async (chat: Chat) => {
    try {
      setSelectedChat(chat);
      
      const chatMessages = await getChatMessages(chat.projectId, chat.id);
      setMessages(chatMessages);
      
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
    return user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=random`;
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
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

  const getChatDisplayName = (chat: Chat) => {
    if (chat.name) return chat.name;
    
    // Для приватных чатов показываем имя собеседника
    if (chat.type === 'direct' && chat.participants) {
      const otherParticipant = chat.participants.find(p => p !== user?.uid);
      if (otherParticipant) {
        const participant = allUsers.find(u => u.id === otherParticipant);
        return participant?.displayName || 'Пользователь';
      }
    }
    
    return chat.name || 'Чат';
  };

  const getChatSubtitle = (chat: Chat) => {
    if (chat.projectTitle) {
      return `Проект: ${chat.projectTitle}`;
    }
    if (chat.type === 'group') {
      return `${chat.participants?.length || 0} участников`;
    }
    return 'Личный чат';
  };

  // Определяем заголовок в зависимости от роли
  const getTitle = () => {
    if (user?.roles?.includes('admin')) return 'Все чаты проектов';
    if (user?.roles?.includes('pm')) return 'Чаты моих проектов';
    if (user?.roles?.includes('executor')) return 'Чаты проектов';
    return 'Чаты';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main-colorsaqua"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-main-colorsbackground">
      {/* Список проектов для PM */}
      {user?.roles?.includes('pm') && mobileView === 'projects' && (
        <div className="w-full md:w-80 bg-neutralneutral-100 border-r border-[#ececec] flex flex-col">
          <div className="p-4 border-b border-[#ececec]">
            <h2 className="text-lg font-h2 text-neutralneutral-10">Мои проекты</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {projects.length === 0 ? (
              <div className="p-4 text-center text-neutralneutral-60 font-paragraph-16">
                У вас пока нет проектов
              </div>
            ) : (
              projects.map(project => (
                <div
                  key={project.id}
                  onClick={() => loadProjectChats(project)}
                  className="p-4 border-b border-[#ececec] hover:bg-main-colorsbackground cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-main-colorsaqua-20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-main-colorsaqua" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-paragraph-16-medium text-neutralneutral-10 truncate">
                        {project.title}
                      </h3>
                      <p className="text-sm text-neutralneutral-60 font-paragraph-14 truncate">
                        {project.teamMembers?.length || 0} участников
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-neutralneutral-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Список чатов проекта */}
      {((user?.roles?.includes('pm') && selectedProject && mobileView === 'chats') || (!user?.roles?.includes('pm') && (!selectedChat || mobileView === 'chats'))) && (
        <div className="w-full md:w-80 bg-neutralneutral-100 border-r border-[#ececec] flex flex-col">
          <div className="p-4 border-b border-[#ececec]">
            <div className="flex items-center justify-between">
              {user?.roles?.includes('pm') && selectedProject ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedProject(null);
                      setChats([]);
                      setMobileView('projects');
                    }}
                    className="p-1 hover:bg-neutralneutral-90 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h2 className="text-lg font-h2 text-neutralneutral-10">Чаты проекта</h2>
                    <p className="text-sm text-neutralneutral-60 font-paragraph-14">{selectedProject.title}</p>
                  </div>
                </div>
              ) : (
                <h2 className="text-lg font-h2 text-neutralneutral-10">Чаты</h2>
              )}
              {user?.roles?.includes('admin') && (
                <button
                  onClick={() => setShowCreateChat(true)}
                  className="p-2 hover:bg-neutralneutral-90 rounded-lg transition-colors"
                  title="Создать чат"
                >
                  <svg className="w-5 h-5 text-main-colorsaqua" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-neutralneutral-60 font-paragraph-16">
                {selectedProject ? 'В проекте пока нет чатов' : 'У вас пока нет чатов'}
              </div>
            ) : (
              chats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => loadChatMessages(chat)}
                  className="p-4 border-b border-[#ececec] hover:bg-main-colorsbackground cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-main-colorsaqua-20 rounded-lg flex items-center justify-center">
                      {chat.type === 'group' ? (
                        <svg className="w-6 h-6 text-main-colorsaqua" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      ) : (
                        <span className="text-main-colorsaqua font-paragraph-16-medium">
                          {getChatDisplayName(chat)[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-paragraph-16-medium text-neutralneutral-10 truncate">
                        {getChatDisplayName(chat)}
                      </h3>
                      <p className="text-sm text-neutralneutral-60 font-paragraph-14 truncate">
                        {chat.lastMessage || getChatSubtitle(chat)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {chat.lastMessageAt && (
                        <span className="text-xs text-neutralneutral-60">
                          {formatTime(chat.lastMessageAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Сообщения чата */}
      {selectedChat && (
        <div className="flex-1 flex flex-col bg-main-colorsbackground">
          <div className="p-4 bg-neutralneutral-100 border-b border-[#ececec]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedChat(null);
                  setMessages([]);
                  setMobileView('chats');
                }}
                className="p-1 hover:bg-neutralneutral-90 rounded md:hidden"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 rounded-full bg-main-colorsaqua-20 flex items-center justify-center">
                {selectedChat.type === 'group' ? (
                  <svg className="w-5 h-5 text-main-colorsaqua" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ) : (
                  <span className="text-main-colorsaqua font-paragraph-16-medium">
                    {getChatDisplayName(selectedChat)[0]}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-paragraph-16-medium text-neutralneutral-10">
                  {getChatDisplayName(selectedChat)}
                </h3>
                <p className="text-sm text-neutralneutral-60 font-paragraph-14">
                  {getChatSubtitle(selectedChat)}
                </p>
              </div>
            </div>
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-neutralneutral-60 font-paragraph-16 mt-8">
                Сообщений пока нет. Начните общение!
              </div>
            ) : (
              messages.map((message, index) => {
                const showDate = index === 0 || formatDate(message.timestamp) !== formatDate(messages[index - 1]?.timestamp);
                
                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center text-sm text-neutralneutral-60 font-paragraph-14 my-4">
                        {formatDate(message.timestamp)}
                      </div>
                    )}
                    <div className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user?.uid
                          ? 'bg-main-colorsaqua text-white'
                          : 'bg-neutralneutral-100 text-neutralneutral-10'
                      }`}>
                        {message.senderId !== user?.uid && (selectedChat.type === 'group') && (
                          <p className="text-xs font-paragraph-14-medium mb-1 opacity-75">
                            {message.sender?.displayName}
                          </p>
                        )}
                        <p className="font-paragraph-16">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderId === user?.uid ? 'text-white opacity-75' : 'text-neutralneutral-60'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Ввод сообщения */}
          <div className="p-4 bg-neutralneutral-100 border-t border-[#ececec]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Написать сообщение..."
                disabled={sendingMessage}
                className="flex-1 px-4 py-2 border border-[#ececec] rounded-lg focus:outline-none focus:border-main-colorsaqua font-paragraph-16 disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                className="px-4 py-2 bg-main-colorsaqua text-white rounded-lg hover:bg-[#3771C8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-paragraph-16-medium"
              >
                {sendingMessage ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания чата (только для админов) */}
      {showCreateChat && user?.roles?.includes('admin') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-h2 text-neutralneutral-10 mb-4">Создать новый чат</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-paragraph-14-medium text-neutralneutral-10 mb-2">
                  Название чата
                </label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#ececec] rounded-lg focus:outline-none focus:border-main-colorsaqua font-paragraph-16"
                  placeholder="Введите название чата"
                />
              </div>

              <div>
                <label className="block text-sm font-paragraph-14-medium text-neutralneutral-10 mb-2">
                  Тип чата
                </label>
                <select
                  value={newChatType}
                  onChange={(e) => setNewChatType(e.target.value as 'group' | 'direct')}
                  className="w-full px-3 py-2 border border-[#ececec] rounded-lg focus:outline-none focus:border-main-colorsaqua font-paragraph-16"
                >
                  <option value="group">Групповой</option>
                  <option value="direct">Личный</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-paragraph-14-medium text-neutralneutral-10 mb-2">
                  Участники
                </label>
                <div className="max-h-40 overflow-y-auto border border-[#ececec] rounded-lg">
                  {allUsers.map(user => (
                    <label key={user.id} className="flex items-center p-2 hover:bg-neutralneutral-90 cursor-pointer">
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
                        className="mr-2"
                      />
                      <span className="font-paragraph-16">{user.displayName}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateChat}
                disabled={!newChatName.trim() || selectedUsers.length === 0 || creatingChat}
                className="flex-1 py-2 bg-main-colorsaqua text-white rounded-lg hover:bg-[#3771C8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-paragraph-16-medium"
              >
                {creatingChat ? 'Создание...' : 'Создать'}
              </button>
              <button
                onClick={() => {
                  setShowCreateChat(false);
                  setNewChatName("");
                  setSelectedUsers([]);
                }}
                className="px-4 py-2 border border-[#ececec] text-neutralneutral-60 rounded-lg hover:bg-neutralneutral-90 transition-colors font-paragraph-16-medium"
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