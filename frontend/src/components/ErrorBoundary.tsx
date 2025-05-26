import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error.status} {error.statusText}
            </h1>
            <p className="text-gray-600 mb-6">
              {error.status === 404 
                ? 'Страница не найдена. Возможно, вы перешли по неверной ссылке.'
                : 'Произошла ошибка при загрузке страницы.'
              }
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Что-то пошло не так
          </h1>
          <p className="text-gray-600 mb-6">
            Произошла неожиданная ошибка. Попробуйте обновить страницу.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Обновить страницу
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 