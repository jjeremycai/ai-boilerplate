import React from 'react';

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  price?: number;
}

export const CarListItem = ({ car }: { car: Car }) => {
  return (
    <div className="p-4 border-b border-gray-200 hover:bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            {car.year} {car.make} {car.model}
          </h3>
          {car.color && (
            <p className="text-sm text-gray-600">Color: {car.color}</p>
          )}
        </div>
        {car.price && (
          <div className="text-lg font-medium text-gray-900">
            ${car.price.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};