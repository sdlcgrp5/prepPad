'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import Image from "next/image";
import EditProfileModal from '@/components/profile/EditProfileModal';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  zipCode: string | null;
  jobTitle: string | null;
  company: string | null;
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
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!token) {
          router.push('/signin');
          return;
        }

        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            // No profile found, redirect to resume upload
            router.push('/resumeupload');
            return;
          }
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        if (data.success && data.profile) {
          setProfile(data.profile);
        } else {
          throw new Error(data.error || 'Failed to load profile data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, router]);

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
  };

  const handleProfileUpdate = (updatedProfile: ProfileData) => {
    setProfile(updatedProfile);
    setIsEditModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
        <p className="mb-6">No profile found. Please create one first.</p>
        <button
          onClick={() => router.push('/resumeupload')}
          className="bg-purple-700 hover:bg-purple-600 text-white px-6 py-2 rounded"
        >
          Create Profile
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="ml-36 p-8">
        {/* Header with title and edit button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
          <button
            onClick={handleEditProfile}
            className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded flex items-center"
          >
              <Image
                className="fill-purple-400 mr-2"
                src="/PencilSimple.svg"
                alt="edit profile"
                width={24}
                height={24}
                priority
              />
         
            Edit Profile
          </button>
        </div>

        {/* Profile content */}
        <div className="space-y-8">
          {/* Basic Info */}
          <section className="bg-gray-800 rounded-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-purple-400">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400">Name</p>
                <p className="font-medium">{profile.firstName} {profile.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
              {profile.phone && (
                <div>
                  <p className="text-sm text-gray-400">Phone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              )}
              {profile.zipCode && (
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="font-medium">{profile.zipCode}</p>
                </div>
              )}
            </div>
          </section>

          {/* Professional Experience */}
          {(profile.jobTitle || profile.company || profile.yearsOfExperience) && (
            <section className="bg-gray-800 rounded-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-purple-400">Professional Experience</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.jobTitle && (
                  <div>
                    <p className="text-sm text-gray-400">Job Title</p>
                    <p className="font-medium">{profile.jobTitle}</p>
                  </div>
                )}
                {profile.company && (
                  <div>
                    <p className="text-sm text-gray-400">Company</p>
                    <p className="font-medium">{profile.company}</p>
                  </div>
                )}
                {profile.yearsOfExperience && (
                  <div>
                    <p className="text-sm text-gray-400">Years of Experience</p>
                    <p className="font-medium">{profile.yearsOfExperience}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Education */}
          {(profile.highestDegree || profile.fieldOfStudy || profile.institution || profile.graduationYear) && (
            <section className="bg-gray-800 rounded-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-purple-400">Education</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.highestDegree && (
                  <div>
                    <p className="text-sm text-gray-400">Degree</p>
                    <p className="font-medium">{profile.highestDegree}</p>
                  </div>
                )}
                {profile.fieldOfStudy && (
                  <div>
                    <p className="text-sm text-gray-400">Field of Study</p>
                    <p className="font-medium">{profile.fieldOfStudy}</p>
                  </div>
                )}
                {profile.institution && (
                  <div>
                    <p className="text-sm text-gray-400">Institution</p>
                    <p className="font-medium">{profile.institution}</p>
                  </div>
                )}
                {profile.graduationYear && (
                  <div>
                    <p className="text-sm text-gray-400">Graduation Year</p>
                    <p className="font-medium">{profile.graduationYear}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <section className="bg-gray-800 rounded-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-purple-400">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-purple-900 px-3 py-1 rounded text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleProfileUpdate}
          initialData={profile}
        />
      )}
    </div>
  );
}