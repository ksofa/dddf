import React, { useState } from "react";
import { SuccessScreen } from "../SuccessScreen";
import { useAuth } from '../../hooks/useAuth';

interface CalculationRequestFormProps {
  onSubmit: (data: { estimatedHours: number; rate: number; comment: string }) => void;
  onCancel: () => void;
}

export const CalculationRequestForm: React.FC<CalculationRequestFormProps> = ({ onSubmit, onCancel }) => {
  const { user } = useAuth();
  const [estimatedHours, setEstimatedHours] = useState("");
  const [rate, setRate] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const total = (Number(estimatedHours) || 0) * (Number(rate) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!estimatedHours || !rate) {
      setError("Заполните все поля");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        estimatedHours: Number(estimatedHours),
        rate: Number(rate),
        comment,
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Ошибка отправки");
    }
    setLoading(false);
  };

  if (user && !user.roles.includes('pm')) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
        <div className="bg-white rounded-[16px] p-8 min-w-[400px] flex flex-col gap-6 shadow-xl items-center">
          <h2 className="text-[20px] font-semibold text-[#222] mb-4">Доступ запрещен</h2>
          <p className="text-[#ED533F] text-center">Только проектный менеджер может отправлять заявки на расчет исполнителям.</p>
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

  if (success) {
    return <SuccessScreen buttonText="На главную" onButtonClick={onCancel} />;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-[16px] p-8 min-w-[400px] flex flex-col gap-6 shadow-xl"
      >
        <h2 className="text-[20px] font-semibold text-[#222] mb-4">Заявка на расчет</h2>
        <input
          type="number"
          placeholder="Оценочное время (часы)"
          className="border border-[#ECECEC] rounded-[12px] h-12 px-4 text-[16px] mb-3"
          value={estimatedHours}
          onChange={e => setEstimatedHours(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Ставка (₽/час)"
          className="border border-[#ECECEC] rounded-[12px] h-12 px-4 text-[16px] mb-3"
          value={rate}
          onChange={e => setRate(e.target.value)}
          required
        />
        <textarea
          placeholder="Комментарий"
          className="border border-[#ECECEC] rounded-[12px] px-4 py-3 text-[16px] mb-3 resize-none h-[80px]"
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
        <div className="bg-[#F8F8FA] rounded-[8px] p-4 flex justify-between items-center">
          <span className="text-[14px] font-medium text-[#4A4C50]">Итоговая сумма:</span>
          <span className="text-[18px] font-medium text-[#333539]">{total.toLocaleString()} ₽</span>
        </div>
        {error && <div className="text-[#ED533F] text-sm text-center mb-2">{error}</div>}
        <div className="flex gap-4 mt-6">
          <button
            type="button"
            className="flex-1 h-12 border border-[#ECECEC] rounded-[12px] font-medium text-[#222] bg-white hover:bg-[#F8F8FA] transition"
            onClick={onCancel}
            disabled={loading}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="flex-1 h-12 bg-main-colorsaqua text-white rounded-[12px] font-medium hover:bg-[#3771C8] transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Отправка..." : "Отправить"}
          </button>
        </div>
      </form>
    </div>
  );
}; 