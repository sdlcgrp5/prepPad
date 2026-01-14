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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { token, hasDataProcessingConsent, setDataProcessingConsent } = useAuth();
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
          if (response.status === 409) {
            // Profile data inconsistency detected
            setError('Profile data inconsistency detected. Please sign out and sign back in, or contact support if the issue persists.');
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
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
          className="bg-purple-700 hover:bg-purple-600 text-white px-6 py-2 rounded font-medium"
        >
          Create Profile
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />

      {/* Main content */}
      <div className="ml-0 md:ml-40 p-4 md:p-8">
        {/* Header with hamburger menu and title */}
        <div className="mb-6 md:mb-8 flex items-center space-x-4">
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold flex-1">Profile</h1>
          <button
            onClick={handleEditProfile}
            className="bg-purple-700 hover:bg-purple-600 text-white px-3 md:px-4 py-2 rounded font-medium flex items-center text-sm md:text-base"
          >
            <Image
              className="fill-purple-400 mr-1 md:mr-2"
              src="/PencilSimple.svg"
              alt="edit profile"
              width={20}
              height={20}
              priority
            />
            <span className="hidden sm:inline">Edit Profile</span>
            <span className="sm:hidden">Edit</span>
          </button>
        </div>

        {/* Profile content */}
        <div className="space-y-8">
          {/* Basic Info */}
          <section className="bg-gray-800/50 rounded-md p-6 border border-gray-500/50">
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
            <section className="bg-gray-800/50 rounded-md p-6 border border-gray-500/50">
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
            <section className="bg-gray-800/50 rounded-md p-6 border border-gray-500/50">
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
            <section className="bg-gray-800/50 rounded-md p-6 border border-gray-500/50">
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

          {/* Privacy Settings */}
          <section className="bg-gray-800/50 rounded-md p-4 md:p-6 border border-gray-500/50">
            <h2 className="text-xl font-semibold mb-4 text-purple-400">Privacy Settings</h2>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-gray-700/50 rounded-lg gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">AI Data Processing</h3>
                  <p className="text-sm text-gray-400">
                    Allow your data to be processed by external AI services for resume analysis and job matching.
                    When enabled, your personal information is anonymized before processing.
                  </p>
                </div>
                <div className="md:ml-6 flex justify-end md:justify-start">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={hasDataProcessingConsent}
                      onChange={(e) => setDataProcessingConsent(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-400 mb-1">Privacy Protection</h4>
                  <p className="text-xs text-blue-200">
                    {hasDataProcessingConsent 
                      ? "Your personal information is anonymized before being sent to AI services. Names, emails, and phone numbers are replaced with placeholders during processing."
                      : "AI processing is disabled. You can enable it anytime to use resume analysis and job matching features."
                    }
                  </p>
                </div>
              </div>
              
              {hasDataProcessingConsent && (
                <div className="text-xs text-gray-400 mt-2">
                  ✓ Data anonymization active<br/>
                  ✓ PII protection enabled<br/>
                  ✓ Secure transmission<br/>
                  ✓ No long-term storage by external services
                </div>
              )}
            </div>
          </section>
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