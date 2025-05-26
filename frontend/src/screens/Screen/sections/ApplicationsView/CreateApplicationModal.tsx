import React, { useState } from "react";
import { createApplication } from "../../../../api/applications";

interface CreateApplicationModalProps {
  projectId: string;
  userId: string;
  onClose: () => void;
}

export const CreateApplicationModal: React.FC<CreateApplicationModalProps> = ({ projectId, userId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await createApplication({ projectId, userId });
      onClose();
    } catch (e: any) {
      setError(e.message || "Ошибка создания заявки");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-white rounded-xl p-8 shadow-lg min-w-[320px] flex flex-col gap-4">
        <h2 className="text-xl font-semibold mb-2">Создать заявку</h2>
        {/* Можно добавить дополнительные поля, если нужно */}
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <div className="flex gap-2 mt-4">
          <button
            className="flex-1 bg-gray-200 rounded py-2 font-medium"
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </button>
          <button
            className="flex-1 bg-[#5B7FC7] text-white rounded py-2 font-medium disabled:opacity-60"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Отправка..." : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}; 