import React from 'react';

export function Confirm({
  message = 'Are you sure?',
  onConfirm,
  onCancel,
}: {
  message?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="bg-white p-4 rounded shadow">
        <p className="mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1 rounded border">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-3 py-1 rounded bg-red-600 text-white">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
