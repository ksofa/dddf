import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export const ProjectDetailScreen: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/projects')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Назад к проектам
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Детали проекта {projectId}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Основная информация</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">ID проекта:</span>
                  <span className="ml-2 font-medium">{projectId}</span>
                </div>
                <div>
                  <span className="text-gray-600">Статус:</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    Активный
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Действия</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/projects/${projectId}/team`)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Управление командой
                </button>
                <button
                  onClick={() => navigate(`/projects/${projectId}/board`)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Доска задач
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 