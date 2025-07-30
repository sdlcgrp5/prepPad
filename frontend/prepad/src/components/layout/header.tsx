// components/layout/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [profileName, setProfileName] = useState<string>('');

  // Fetch profile data to get real name
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      
      try {
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.profile && data.profile.firstName && data.profile.lastName) {
            setProfileName(`${data.profile.firstName} ${data.profile.lastName}`);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    fetchProfile();
  }, [token]);

  const handleProfileClick = () => {
    router.push('/profile');
  };

  // Display name priority: profileName > user.name > user.email
  const displayName = profileName || user?.name || user?.email || '';
  
  // Avatar letter: use first letter of profileName if available, otherwise email
  const avatarLetter = profileName 
    ? profileName.charAt(0).toUpperCase()
    : (user?.email ? user.email.charAt(0).toUpperCase() : '');
  
  return (
    <div className="mb-8 flex items-center justify-between border-b-white/60 border-b-2 pb-5">
      <h1 className="text-3xl font-bold">{title}</h1>
      
      <div className="flex items-center space-x-3">
        <button 
          onClick={handleProfileClick}
          className="flex items-center space-x-2 cursor-pointer"
          aria-label="Go to profile"
        >
          <div className="relative h-10 w-10 rounded-full bg-gray-600">
            <div className="flex h-full w-full items-center justify-center rounded-full font-bold text-white">
              {avatarLetter}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-200">
              {displayName}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}