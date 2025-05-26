import React, { useRef, useState } from "react";
import { createApplication } from "../../api/applications";
import { SuccessScreen } from "../../components/SuccessScreen";

interface CreateProjectScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const CreateProjectScreen: React.FC<CreateProjectScreenProps> = ({ onBack, onSuccess }) => {
  const [fio, setFio] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => setFile(null);

  const handleSubmit = async () => {
    if (!fio || !phone || !title || !description) {
      setError("Пожалуйста, заполните все обязательные поля");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createApplication({
        fullName: fio,
        phone,
        projectTitle: title,
        projectDescription: description,
        techSpecFile: file || undefined
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Ошибка при отправке заявки");
    }
    setLoading(false);
  };

  if (success) {
    return <SuccessScreen title="Заявка отправлена!" subtitle="Мы свяжемся с вами в ближайшее время." buttonText="На главную" onButtonClick={onBack} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F5F8] px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl bg-white rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 shadow flex flex-col gap-4 sm:gap-6">
        <button onClick={onBack} className="mb-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition self-start">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h2 className="text-xl sm:text-2xl font-semibold mb-2">Заявка на проект</h2>
        <div className="bg-[#F8F9FB] rounded-xl p-4 sm:p-6 md:p-8 flex flex-col gap-4 border border-[#ECECEC]">
          <input type="text" placeholder="ФИО *" className="border rounded-lg px-3 sm:px-4 py-2 sm:py-3 bg-white text-sm sm:text-base outline-none" value={fio} onChange={e => setFio(e.target.value)} />
          <input type="text" placeholder="Номер телефона *" className="border rounded-lg px-3 sm:px-4 py-2 sm:py-3 bg-white text-sm sm:text-base outline-none" value={phone} onChange={e => setPhone(e.target.value)} />
          <input type="text" placeholder="Название проекта *" className="border rounded-lg px-3 sm:px-4 py-2 sm:py-3 bg-white text-sm sm:text-base outline-none" value={title} onChange={e => setTitle(e.target.value)} />
          <textarea placeholder="Описание проекта *" className="border rounded-lg px-3 sm:px-4 py-2 sm:py-3 bg-white text-sm sm:text-base outline-none min-h-[80px] resize-none" value={description} onChange={e => setDescription(e.target.value)} />
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 border rounded-full px-4 sm:px-5 py-2 bg-white hover:bg-gray-50 transition text-xs sm:text-sm font-medium"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M10 4v8m0 0l3-3m-3 3l-3-3" stroke="#222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="3" width="14" height="14" rx="7" stroke="#222" strokeWidth="1.5"/></svg>
              Прикрепить файл ТЗ
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            />
          </div>
          {file && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <svg width="18" height="18" fill="none" viewBox="0 0 18 18" className="w-4 h-4 sm:w-[18px] sm:h-[18px]"><rect x="2" y="2" width="14" height="14" rx="3" stroke="#3771C8" strokeWidth="1.5"/><path d="M6 9h6M9 6v6" stroke="#3771C8" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span className="text-[#3771C8] text-xs sm:text-sm underline cursor-pointer truncate max-w-[200px] sm:max-w-none">{file.name}</span>
              <span className="text-[10px] sm:text-xs text-[#A5A5A7]">{(file.size / 1024 / 1024).toFixed(1)} Мб</span>
              <button onClick={handleRemoveFile} className="text-[#E14B4B] hover:underline text-xs sm:text-sm">✕</button>
            </div>
          )}
          {error && <div className="text-red-500 text-xs sm:text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>}
          <div className="text-xs sm:text-sm text-gray-500 text-center">
            * - обязательные поля
          </div>
        </div>
        <button
          className="w-full mt-4 bg-[#5B7FC7] hover:bg-[#4070C4] text-white rounded-full py-2 sm:py-3 text-base sm:text-lg font-semibold transition disabled:opacity-60"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Отправка..." : "Отправить заявку"}
        </button>
      </div>
    </div>
  );
}; 