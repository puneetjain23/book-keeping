// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { hashPassword } from '../db/utils';

const STORED_HASH = '48ad3d81ce7f707b9f8423c6c40adc888bd48b7804df512d5ca57c5f4d76ec45'; // SHA-256 hash of your password

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const inputHash = await hashPassword(password);
    if (inputHash === STORED_HASH) {
      localStorage.setItem('loggedIn', 'true');
      onLogin();
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-80">
        <h2 className="text-xl font-bold mb-4 text-center">Login</h2>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter password"
          className="w-full p-2 border border-gray-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <button
          onClick={handleSubmit}
          className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 transition"
        >
          Login
        </button>
      </div>
    </div>
  );
}
