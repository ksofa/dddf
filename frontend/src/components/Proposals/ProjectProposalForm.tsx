import { useState } from 'react';
import { TeamMember } from '../../types/project';
import { useAuth } from '../../hooks/useAuth';

interface ProjectProposalFormProps {
  specialist?: TeamMember;
  onSubmit: (data: {
    rate: number;
    estimatedHours: number;
    coverLetter: string;
    projectName: string;
    projectDescription: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export const ProjectProposalForm = ({ specialist, onSubmit, onCancel }: ProjectProposalFormProps) => {
  const { user } = useAuth();
  const [rate, setRate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = Number(estimatedHours) * Number(rate) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rate || !estimatedHours || !coverLetter || !projectName) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        rate: Number(rate),
        estimatedHours: Number(estimatedHours),
        coverLetter,
        projectName,
        projectDescription
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user && !user.roles.includes('pm')) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
        <div className="bg-white rounded-[16px] p-8 min-w-[400px] flex flex-col gap-6 shadow-xl items-center">
          <h2 className="text-[20px] font-semibold text-[#222] mb-4">Доступ запрещен</h2>
          <p className="text-[#ED533F] text-center">Только проектный менеджер может отправлять предложения исполнителям.</p>
          <button
            type="button"
            className="h-12 border border-[#ECECEC] rounded-[12px] font-medium text-[#222] bg-white hover:bg-[#F8F8FA] transition mt-6 px-8"
            onClick={onCancel}
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[16px] p-8 w-[480px]">
        <h2 className="text-[20px] font-medium text-[#333539] mb-6">{specialist ? 'Предложение специалисту' : 'Заявка на проект'}</h2>
        {specialist && (
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              {specialist.avatar && (
                <img src={specialist.avatar} alt={specialist.name} className="w-12 h-12 rounded-full" />
              )}
              <div>
                <h3 className="text-[18px] font-medium text-[#333539]">{specialist.name}</h3>
                <p className="text-[14px] text-[#666769]">{specialist.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-[#333539]">Рейтинг:</span>
              <span className="text-[14px] text-[#666769]">{specialist.rating}</span>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[14px] font-medium text-[#4A4C50] mb-2">
              Название проекта
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full border border-[#DEDEDF] rounded-[8px] px-4 py-3"
              placeholder="Введите название проекта"
              required
            />
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#4A4C50] mb-2">
              Описание проекта
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="w-full border border-[#DEDEDF] rounded-[8px] px-4 py-3 h-[80px] resize-none"
              placeholder="Опишите проект"
            />
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#4A4C50] mb-2">
              Оценочное время реализации (часы)
            </label>
            <input
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              className="w-full border border-[#DEDEDF] rounded-[8px] px-4 py-3"
              placeholder="Введите количество часов"
              required
            />
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#4A4C50] mb-2">
              Ставка (₽/час)
            </label>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full border border-[#DEDEDF] rounded-[8px] px-4 py-3"
              placeholder="Введите ставку"
              required
            />
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#4A4C50] mb-2">
              Сопроводительное письмо
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full border border-[#DEDEDF] rounded-[8px] px-4 py-3 h-[120px] resize-none"
              placeholder="Опишите условия работы и требования к специалисту"
              required
            />
          </div>
          <div className="bg-[#F8F8FA] rounded-[8px] p-4">
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-medium text-[#4A4C50]">Итоговая сумма:</span>
              <span className="text-[18px] font-medium text-[#333539]">{totalAmount.toLocaleString()} ₽</span>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-[#DEDEDF] rounded-[8px] font-medium"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-[#2982FD] text-white rounded-[8px] font-medium disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 