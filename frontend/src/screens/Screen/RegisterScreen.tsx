import React, { useState } from "react";
import { registerUser } from "../../api/auth";

interface RegisterScreenProps {
  onBack: () => void;
  onLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBack, onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    profession: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    { value: 'admin', label: 'Администратор' },
    { value: 'executor', label: 'Исполнитель' },
    { value: 'pm', label: 'Проектный менеджер (PM)' },
    { value: 'client', label: 'Заказчик' }
  ];

  const professions = [
    'Frontend разработчик',
    'Back-End разработчик', 
    'Тестировщик',
    'Аналитик',
    'Дизайнер'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.email || !formData.password || !formData.role) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    // Проверяем, что для исполнителей и PM указана профессия
    if ((formData.role === 'executor' || formData.role === 'pm') && !formData.profession) {
      setError('Для исполнителей и PM необходимо указать профессию');
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        roles: [formData.role],
        profession: formData.profession || undefined
      });
      
      alert('Регистрация успешна! Теперь вы можете войти в систему.');
      onLogin();
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  const shouldShowProfession = formData.role === 'executor' || formData.role === 'pm';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Регистрация</h1>
          <p className="text-gray-600">Создайте новый аккаунт</p>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Имя */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Имя *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите ваше имя"
              required
            />
          </div>

          {/* Телефон */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Телефон *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+7 (999) 123-45-67"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@email.com"
              required
            />
          </div>

          {/* Роль */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Роль *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Выберите роль</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Профессия (только для исполнителей и PM) */}
          {shouldShowProfession && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Профессия *
              </label>
              <select
                name="profession"
                value={formData.profession}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Выберите профессию</option>
                {professions.map((profession) => (
                  <option key={profession} value={profession}>
                    {profession}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Пароль */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пароль *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Минимум 6 символов"
              required
            />
          </div>

          {/* Подтверждение пароля */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Подтвердите пароль *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Повторите пароль"
              required
            />
          </div>

          {/* Ошибка */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Кнопка регистрации */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        {/* Дополнительная информация */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Дополнительную информацию профиля можно будет заполнить позже в личном кабинете
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Назад
            </button>
            <button
              onClick={onLogin}
              className="flex-1 bg-transparent hover:bg-gray-50 text-blue-500 font-medium py-2 px-4 rounded-lg border border-blue-500 transition-colors"
            >
              Уже есть аккаунт?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 