'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import Link from 'next/link';

interface ProfileData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  zipCode: string | null;
  jobTitle: string | null;
  company: string | null;
  startDate?: string;
  endDate?: string;
  location?: string;
  jobDescription?: string;
  yearsOfExperience: string | null;
  linkedinUrl: string | null;
  highestDegree: string | null;
  fieldOfStudy: string | null;
  institution: string | null;
  graduationYear: string | null;
  skills: string[];
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!token) {
          console.error('No authentication token found');
          router.push('/signin');
          return;
        }

        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setProfile(data.profile);
        } else {
          console.error('Failed to fetch profile:', data.error);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [token, router]);
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Loading profile...</p>
      </div>
    );
  }
  
  if (!profile && !loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
        <p className="mb-6">No profile found. Please create one first.</p>
        <Link 
          href="/resumeupload" 
          className="bg-purple-700 hover:bg-purple-600 text-white py-2 px-4 rounded"
        >
          Create Profile
        </Link>
      </div>
    );
  }

  // Format the degree display
//   const formatDegree = (degree: string | null) => {
//     if (!degree) return "Masters"; // Default value
    
//     switch(degree) {
//       case 'high_school': return 'High School';
//       case 'associate': return 'Associate\'s';
//       case 'bachelor': return 'Bachelor\'s';
//       case 'master': return 'Masters';
//       case 'doctorate': return 'Doctorate';
//       default: return degree;
//     }
//   };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="ml-36 p-8 w-full">
        {/* Header with title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>
        
        {/* Profile content */}
        {profile && (
          <div className="space-y-8">
            {/* Profile header with avatar and basic info */}
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-300 w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-gray-800">
                  {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h2>
                  <p className="text-gray-400">{profile.jobTitle || 'No job title specified'}</p>
                  <p className="text-gray-400">{profile.zipCode || 'No location specified'}</p>
                </div>
              </div>
              
              <button 
                onClick={() => router.push('/resumeupload')}
                className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
            </div>
            
            {/* Contact Information */}
            <section>
              <h3 className="text-xl font-semibold mb-4 text-purple-400">Contact Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-400">Phone</p>
                  <p>{profile.phone || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Email address</p>
                  <p>{profile.email || 'Not Specified'}</p>
                </div>

                <div>
                <p className="text-sm text-gray-400 mb-1">Location</p>
                  <p>{profile.location || 'Not Specified'}</p>
                </div>
                <div>

                  <p className="text-sm text-gray-400">LinkedIn</p>
                  <p>{profile.linkedinUrl || 'Not specified'}</p>
                </div>
              </div>
            </section>
            
            {/* Work Experience */}
            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-xl font-semibold mb-4 text-purple-400">Work Experience</h3>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Job Role</p>
                    <p className="font-medium">{profile.jobTitle || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400">Company</p>
                    <p className="font-medium">{profile.company || 'Not specified'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Duration</p>
                    <p className="font-medium">{profile.startDate ? profile.startDate.substring(0, 5) : 'Not specified'} - {profile.endDate === "present" ? "Present" : profile.endDate ? profile.endDate.substring(0, 5) : 'Not specified'}</p>
                  </div>

                  <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="font-medium">{profile.location || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400">Years of Experience</p>
                    <p className="font-medium">{profile.yearsOfExperience || 'Not specified'}</p>
                  </div>
                </div>
                
                {profile.jobDescription && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-400 mb-1">Job Description</p>
                    <p>{profile.jobDescription}</p>
                  </div>
                )}
              </div>
            </section>
            
            {/* Education */}
            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-xl font-semibold mb-4 text-purple-400">Education</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-400">Degree</p>
                  <p>{profile.highestDegree || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Field of study</p>
                  <p>{profile.fieldOfStudy || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Institution</p>
                  <p>{profile.institution || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Graduation Year</p>
                  <p>{profile.graduationYear || 'Not specified'}</p>
                </div>
              </div>
            </section>
            
            {/* Skills */}
            <section className="border-t border-gray-700 pt-6">
              <h3 className="text-xl font-semibold mb-4 text-purple-400">Skills</h3>
              
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="bg-purple-900 px-3 py-1 rounded text-sm"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-400">No skills specified</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}