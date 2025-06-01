import React, { useState } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";

export const ProfileView = (): JSX.Element => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || ''
  });

  const handleSave = () => {
    // Здесь будет логика сохранения профиля
    console.log('Saving profile:', editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || ''
    });
    setIsEditing(false);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'pm':
        return 'Проект-менеджер';
      case 'executor':
        return 'Исполнитель';
      case 'customer':
        return 'Заказчик';
      default:
        return 'Пользователь';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500';
      case 'pm':
        return 'bg-blue-500';
      case 'executor':
        return 'bg-green-500';
      case 'customer':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Профиль пользователя</h1>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              Редактировать
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                Отмена
              </Button>
              <Button
                onClick={handleSave}
              >
                Сохранить
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Avatar */}
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {(user?.fullName || user?.displayName || 'У').charAt(0).toUpperCase()}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {user?.fullName || user?.displayName || 'Пользователь'}
              </h3>
              <p className="text-gray-600">{user?.email}</p>
            </div>

            {/* Roles */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Роли</h4>
              <div className="flex flex-wrap gap-2">
                {user?.roles?.map((role) => (
                  <Badge
                    key={role}
                    className={`${getRoleBadgeColor(role)} text-white`}
                  >
                    {getRoleDisplayName(role)}
                  </Badge>
                )) || (
                  <Badge className="bg-gray-500 text-white">
                    Пользователь
                  </Badge>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Дата регистрации</span>
                <span className="text-sm font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : 'Не указана'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Последний вход</span>
                <span className="text-sm font-medium">
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ru-RU') : 'Сегодня'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={logout}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Выйти из аккаунта
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Информация о профиле</h3>
            
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Полное имя
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{user?.fullName || 'Не указано'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{user?.email || 'Не указано'}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+7 (999) 999-99-99"
                  />
                ) : (
                  <p className="text-gray-900">{user?.phone || 'Не указано'}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  О себе
                </label>
                {isEditing ? (
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Расскажите о себе..."
                  />
                ) : (
                  <p className="text-gray-900">{user?.bio || 'Не указано'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Безопасность</h3>
            
            <div className="space-y-4">
              <Button variant="outline" className="w-full sm:w-auto">
                Изменить пароль
              </Button>
              <Button variant="outline" className="w-full sm:w-auto ml-0 sm:ml-3">
                Настройки уведомлений
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 