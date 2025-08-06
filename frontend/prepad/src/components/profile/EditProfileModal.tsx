'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import HybridDateSelector from '@/components/HybridDateSelector';

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

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProfile: ProfileData) => void;
  initialData: ProfileData;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function EditProfileModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialData 
}: EditProfileModalProps) {
  const { token } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [basicInfo, setBasicInfo] = useState({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    zipCode: initialData.zipCode || ''
  });

  const [experienceInfo, setExperienceInfo] = useState({
    jobTitle: initialData.jobTitle || '',
    company: initialData.company || '',
    yearsOfExperience: initialData.yearsOfExperience || ''
  });

  const [educationInfo, setEducationInfo] = useState({
    highestDegree: initialData.highestDegree || '',
    fieldOfStudy: initialData.fieldOfStudy || '',
    institution: initialData.institution || '',
    graduationYear: initialData.graduationYear || ''
  });

  const [skillsInfo, setSkillsInfo] = useState({
    skills: initialData.skills || [],
    newSkill: ''
  });

  // Form validation errors
  const [basicInfoErrors, setBasicInfoErrors] = useState<ValidationErrors>({});
  const [experienceInfoErrors, setExperienceInfoErrors] = useState<ValidationErrors>({});
  const [educationInfoErrors, setEducationInfoErrors] = useState<ValidationErrors>({});

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen && initialData) {
      setBasicInfo({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        zipCode: initialData.zipCode || ''
      });
      setExperienceInfo({
        jobTitle: initialData.jobTitle || '',
        company: initialData.company || '',
        yearsOfExperience: initialData.yearsOfExperience || ''
      });
      setEducationInfo({
        highestDegree: initialData.highestDegree || '',
        fieldOfStudy: initialData.fieldOfStudy || '',
        institution: initialData.institution || '',
        graduationYear: initialData.graduationYear || ''
      });
      setSkillsInfo({
        skills: initialData.skills || [],
        newSkill: ''
      });
      setCurrentStep(1);
      setError(null);
      setBasicInfoErrors({});
      setExperienceInfoErrors({});
      setEducationInfoErrors({});
    }
  }, [isOpen, initialData]);

  const formatPhoneNumber = (value: string): string => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    } else {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const validateBasicInfo = (): boolean => {
    const errors: ValidationErrors = {};

    if (!basicInfo.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!basicInfo.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (basicInfo.phone) {
      const digitsOnly = basicInfo.phone.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        errors.phone = "Phone number must be exactly 10 digits";
      } else if (!/^\d{3}-\d{3}-\d{4}$/.test(basicInfo.phone)) {
        errors.phone = "Phone number should be in XXX-XXX-XXXX format";
      }
    }

    if (basicInfo.zipCode && !/^\d{5}(-\d{4})?$/.test(basicInfo.zipCode)) {
      errors.zipCode = "Enter a valid zip code (e.g., 12345 or 12345-6789)";
    }

    setBasicInfoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEducationInfo = (): boolean => {
    const errors: ValidationErrors = {};

    if (educationInfo.graduationYear) {
      const year = parseInt(educationInfo.graduationYear);
      const currentYear = new Date().getFullYear();
      
      if (isNaN(year) || year < 1900 || year > currentYear + 10) {
        errors.graduationYear = `Please enter a valid year between 1900 and ${currentYear + 10}`;
      }
    }

    setEducationInfoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      setBasicInfo({
        ...basicInfo,
        [name]: formattedPhone
      });
    } else {
      setBasicInfo({
        ...basicInfo,
        [name]: value
      });
    }
    
    if (basicInfoErrors[name]) {
      setBasicInfoErrors({
        ...basicInfoErrors,
        [name]: ''
      });
    }
  };

  const handleExperienceInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setExperienceInfo({
      ...experienceInfo,
      [name]: value
    });
    
    if (experienceInfoErrors[name]) {
      setExperienceInfoErrors({
        ...experienceInfoErrors,
        [name]: ''
      });
    }
  };

  const handleEducationInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEducationInfo({
      ...educationInfo,
      [name]: value
    });
    
    if (educationInfoErrors[name]) {
      setEducationInfoErrors({
        ...educationInfoErrors,
        [name]: ''
      });
    }
  };

  const handleAddSkill = () => {
    if (skillsInfo.newSkill.trim() !== '') {
      if (!skillsInfo.skills.includes(skillsInfo.newSkill.trim())) {
        setSkillsInfo({
          skills: [...skillsInfo.skills, skillsInfo.newSkill.trim()],
          newSkill: ''
        });
      } else {
        setError("This skill has already been added");
      }
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsInfo({
      ...skillsInfo,
      skills: skillsInfo.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillsInfo({
      ...skillsInfo,
      newSkill: e.target.value
    });
    if (error && error.includes("skill")) {
      setError(null);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateBasicInfo()) {
      return;
    }
    if (currentStep === 3 && !validateEducationInfo()) {
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateEducationInfo()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get the auth token
      let authToken = token;
      if (!authToken || authToken === 'nextauth') {
        authToken = 'nextauth';
      }

      const profileData = {
        firstName: basicInfo.firstName,
        lastName: basicInfo.lastName,
        phone: basicInfo.phone || null,
        zipCode: basicInfo.zipCode || null,
        jobTitle: experienceInfo.jobTitle || null,
        company: experienceInfo.company || null,
        yearsOfExperience: experienceInfo.yearsOfExperience || null,
        linkedinUrl: null,
        highestDegree: educationInfo.highestDegree || null,
        fieldOfStudy: educationInfo.fieldOfStudy || null,
        institution: educationInfo.institution || null,
        graduationYear: educationInfo.graduationYear || null,
        skills: skillsInfo.skills
      };

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      onSuccess(data.profile);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800/95 backdrop-blur-md rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700/50">
        <div className="relative p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white rounded-full bg-gray-700/50 p-1 font-medium transition-colors duration-200"
            disabled={isSubmitting}
          >
            <Image
              className="text-gray-400"
              src="/X.svg"
              alt="close"
              width={24}
              height={24}
              priority
            />
          </button>

          {/* Title */}
          <div className="flex justify-center mb-8 mt-2">
            <div className="bg-gray-700/80 backdrop-blur-sm px-6 py-2 rounded-full border border-gray-600/50">
              <span className="text-white font-medium">Edit Profile</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-md text-red-200">
              {error}
            </div>
          )}

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Basic Information</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First name"
                      value={basicInfo.firstName}
                      onChange={handleBasicInfoChange}
                      className={`w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 ${basicInfoErrors.firstName ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-purple-500'}`}
                      disabled={isSubmitting}
                    />
                    {basicInfoErrors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{basicInfoErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last name"
                      value={basicInfo.lastName}
                      onChange={handleBasicInfoChange}
                      className={`w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 ${basicInfoErrors.lastName ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-purple-500'}`}
                      disabled={isSubmitting}
                    />
                    {basicInfoErrors.lastName && (
                      <p className="text-red-500 text-xs mt-1">{basicInfoErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={basicInfo.email}
                    className="w-full p-3 bg-gray-600 text-gray-300 rounded focus:outline-none cursor-not-allowed"
                    disabled
                  />
                  <p className="text-gray-400 text-xs mt-1">Email cannot be changed</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone number"
                      value={basicInfo.phone}
                      onChange={handleBasicInfoChange}
                      maxLength={12}
                      className={`w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 ${basicInfoErrors.phone ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-purple-500'}`}
                      disabled={isSubmitting}
                    />
                    {basicInfoErrors.phone && (
                      <p className="text-red-500 text-xs mt-1">{basicInfoErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      name="zipCode"
                      placeholder="Zip code"
                      value={basicInfo.zipCode}
                      onChange={handleBasicInfoChange}
                      className={`w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 ${basicInfoErrors.zipCode ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-purple-500'}`}
                      disabled={isSubmitting}
                    />
                    {basicInfoErrors.zipCode && (
                      <p className="text-red-500 text-xs mt-1">{basicInfoErrors.zipCode}</p>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full bg-purple-700 hover:bg-purple-600 text-white py-3 px-6 rounded font-medium transition duration-300"
                    disabled={isSubmitting}
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <span className="text-gray-500 text-sm">01/04</span>
              </div>
            </div>
          )}

          {/* Step 2: Professional Experience */}
          {currentStep === 2 && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Professional Experience</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="jobTitle"
                    placeholder="Current Job Title"
                    value={experienceInfo.jobTitle}
                    onChange={handleExperienceInfoChange}
                    className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="company"
                    placeholder="Company"
                    value={experienceInfo.company}
                    onChange={handleExperienceInfoChange}
                    className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="yearsOfExperience"
                    placeholder="Years of Experience"
                    value={experienceInfo.yearsOfExperience}
                    onChange={handleExperienceInfoChange}
                    className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="bg-gray-600 hover:bg-gray-500 text-white py-3 px-6 rounded font-medium transition duration-300"
                    disabled={isSubmitting}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-purple-700 hover:bg-purple-600 text-white py-3 px-6 rounded font-medium transition duration-300"
                    disabled={isSubmitting}
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <span className="text-gray-500 text-sm">02/04</span>
              </div>
            </div>
          )}

          {/* Step 3: Education */}
          {currentStep === 3 && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Education</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <select
                      name="highestDegree"
                      value={educationInfo.highestDegree}
                      onChange={handleEducationInfoChange}
                      className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                      disabled={isSubmitting}
                    >
                      <option value="">Highest Degree</option>
                      <option value="high_school">High School</option>
                      <option value="associate">Associate's</option>
                      <option value="bachelor">Bachelor's</option>
                      <option value="master">Master's</option>
                      <option value="doctorate">Doctorate</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      name="fieldOfStudy"
                      placeholder="Field of Study"
                      value={educationInfo.fieldOfStudy}
                      onChange={handleEducationInfoChange}
                      className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      name="institution"
                      placeholder="Institution"
                      value={educationInfo.institution}
                      onChange={handleEducationInfoChange}
                      className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="graduationYear"
                      placeholder="Graduation Year"
                      value={educationInfo.graduationYear}
                      onChange={handleEducationInfoChange}
                      className={`w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 ${educationInfoErrors.graduationYear ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-purple-500'}`}
                      disabled={isSubmitting}
                    />
                    {educationInfoErrors.graduationYear && (
                      <p className="text-red-500 text-xs mt-1">{educationInfoErrors.graduationYear}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="bg-gray-600 hover:bg-gray-500 text-white py-3 px-6 rounded font-medium transition duration-300"
                    disabled={isSubmitting}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-purple-700 hover:bg-purple-600 text-white py-3 px-6 rounded font-medium transition duration-300"
                    disabled={isSubmitting}
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <span className="text-gray-500 text-sm">03/04</span>
              </div>
            </div>
          )}

          {/* Step 4: Skills */}
          {currentStep === 4 && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Skills</h2>
              </div>

              <div className="space-y-4">
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 mb-4 min-h-[60px] p-2 border border-gray-700 rounded">
                    {skillsInfo.skills.length > 0 ? (
                      skillsInfo.skills.map((skill, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center bg-purple-800 text-white px-3 py-1 rounded"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-2 text-purple-300 hover:text-white"
                            disabled={isSubmitting}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 text-sm flex items-center justify-center w-full h-full">Add your professional skills below</div>
                    )}
                  </div>

                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Add Skills"
                      value={skillsInfo.newSkill}
                      onChange={handleSkillInputChange}
                      className="flex-grow p-3 bg-gray-700 text-white rounded-l focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="bg-gray-600 text-white px-4 rounded-r hover:bg-gray-500 transition"
                      disabled={isSubmitting}
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="bg-gray-600 hover:bg-gray-500 text-white py-3 px-6 rounded font-medium transition duration-300"
                    disabled={isSubmitting}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className={`py-3 px-6 rounded transition duration-300 text-white ${
                      isSubmitting 
                        ? 'bg-purple-700/50 cursor-not-allowed' 
                        : 'bg-purple-700 hover:bg-purple-600'
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </div>
                    ) : (
                      'Update Profile'
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <span className="text-gray-500 text-sm">04/04</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}