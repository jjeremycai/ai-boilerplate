import React from 'react';

export const CarListError = ({ error }: { error?: Error }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Cars</h2>
      <p className="text-gray-600">{error?.message || 'Something went wrong'}</p>
    </div>
  );
};