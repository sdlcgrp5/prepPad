// components/layout/Header.tsx
'use client';

import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user } = useAuth();
  
  return (
    <div className="mb-8 flex items-center justify-between border-b-white/60 border-b-2 pb-5">
      <h1 className="text-3xl font-bold">{title}</h1>
      
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="relative h-10 w-10 rounded-full bg-purple-200">
            <div className="flex h-full w-full items-center justify-center rounded-full font-bold text-gray-800">
              {user?.email ? user.email.charAt(0).toUpperCase() : ''}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400">{user?.email || ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
}