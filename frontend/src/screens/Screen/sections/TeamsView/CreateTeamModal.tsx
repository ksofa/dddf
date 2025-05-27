import React, { useState } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTeam: (teamData: any) => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  onCreateTeam
}) => {
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📱');
  const [selectedColor, setSelectedColor] = useState('bg-blue-500');

  const icons = ['📱', '🌐', '📊', '🚀', '💼', '🔧', '📈', '👥', '💻', '🎨', '⚡', '🔥'];
  const colors = [
    'bg-blue-500',
    'bg-red-500', 
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-gray-500'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      alert('Введите название команды');
      return;
    }

    const newTeam = {
      name: teamName,
      title: teamName,
      description: description || 'Описание команды',
      icon: selectedIcon,
      color: selectedColor,
      teamMembers: [],
      members: []
    };

    onCreateTeam(newTeam);
    
    // Сброс формы
    setTeamName('');
    setDescription('');
    setSelectedIcon('📱');
    setSelectedColor('bg-blue-500');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Создать команду</h2>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Название команды */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название команды *
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите название команды"
              required
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Описание команды"
              rows={3}
            />
          </div>

          {/* Выбор иконки */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Иконка команды
            </label>
            <div className="grid grid-cols-6 gap-2">
              {icons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl border-2 transition-colors ${
                    selectedIcon === icon
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Выбор цвета */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Цвет команды
            </label>
            <div className="grid grid-cols-4 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-12 h-8 rounded-md ${color} border-2 transition-all ${
                    selectedColor === color
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Предварительный просмотр */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Предварительный просмотр
            </label>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${selectedColor} rounded-2xl flex items-center justify-center text-white text-xl`}>
                  {selectedIcon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{teamName || 'Название команды'}</h3>
                  <p className="text-sm text-gray-600">{description || 'Описание команды'}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Кнопки */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
            >
              Создать команду
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Отмена
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 