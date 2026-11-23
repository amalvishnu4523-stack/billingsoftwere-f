import React from 'react';

export default function LoadingScreen({ message }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  );
}
