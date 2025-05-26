import React, { useState } from "react";
import { createChat } from "../../../../api/chats";
import { useAuth } from "../../../../hooks/useAuth";

interface CreateChatModalProps {
  onClose: () => void;
}

export const CreateChatModal: React.FC<CreateChatModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const userId = user?.uid;
  const [members, setMembers] = useState("");
  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState<"private" | "group">("private");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const memberIds = members.split(",").map(m => m.trim()).filter(Boolean);
      if (userId && !memberIds.includes(userId)) memberIds.push(userId);
      await createChat({
        members: memberIds,
        projectId: projectId || undefined,
        type,
      });
      onClose();
    } catch (e: any) {
      setError(e.message || "Ошибка создания чата");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-white rounded-[16px] p-8 min-w-[400px] flex flex-col gap-6 shadow-xl">
        <h2 className="text-[20px] font-semibold text-[#222] mb-4">Создать чат</h2>
        <input
          type="text"
          placeholder="ID участников (через запятую)"
          className="border border-[#ECECEC] rounded-[12px] h-12 px-4 text-[16px] mb-3"
          value={members}
          onChange={e => setMembers(e.target.value)}
        />
        <input
          type="text"
          placeholder="ID проекта (опционально)"
          className="border border-[#ECECEC] rounded-[12px] h-12 px-4 text-[16px] mb-3"
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
        />
        <select
          className="border border-[#ECECEC] rounded-[12px] h-12 px-4 text-[16px] mb-3"
          value={type}
          onChange={e => setType(e.target.value as any)}
        >
          <option value="private">Приватный</option>
          <option value="group">Групповой</option>
        </select>
        {error && <div className="text-[#ED533F] text-sm text-center mb-2">{error}</div>}
        <div className="flex gap-4 mt-6">
          <button
            className="flex-1 h-12 border border-[#ECECEC] rounded-[12px] font-medium text-[#222] bg-white hover:bg-[#F8F8FA] transition"
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </button>
          <button
            className="flex-1 h-12 bg-main-colorsaqua text-white rounded-[12px] font-medium hover:bg-[#3771C8] transition disabled:opacity-60"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Создание..." : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}; 