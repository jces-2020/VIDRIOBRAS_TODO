import React from 'react';

export default function ModalMetodoPago({ open, onClose, onSelect }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 min-w-[320px] flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4">Selecciona método de pago</h2>
        <div className="flex flex-col gap-4 w-full">
          <button
            className="bg-green-600 hover:bg-green-700 text-white py-2 rounded"
            onClick={() => onSelect('efectivo')}
          >
            Pagar con efectivo
          </button>
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded"
            onClick={() => onSelect('yape')}
          >
            Pagar con Yape
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            onClick={() => onSelect('tarjeta')}
          >
            Pagar con tarjeta
          </button>
        </div>
        <button
          className="mt-6 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
