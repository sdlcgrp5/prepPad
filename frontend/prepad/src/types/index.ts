// types/index.ts

// User type
export interface User {
   id: number;
   email: string;
   name?: string;
 }
 
 // Resume types
 export interface ResumeProfile {
   id: number;
   firstName: string;
   lastName: string;
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
 
 export interface ResumeFile {
   id: number;
   fileName: string;
   fileType: string;
   uploadedAt: string;
   fileUrl: string;
 }
 
 // Job Analysis types
 export interface JobAnalysis {
   id: number;
   company: string;
   role: string;
   uploadedAt: string;
   score: number;
   source: string;
   matchDetails?: MatchDetails;
 }
 
 export interface MatchDetails {
   matchedSkills: string[];
   missingSkills: string[];
   analysis: string;
 }
 
 // Dashboard statistics
 export interface DashboardStats {
   totalAnalyses: number;
   averageScore: number;
   recentAnalyses: JobAnalysis[];
   topMissingSkills: string[];
 }
 
 // Notification types
 export interface Notification {
   id: number;
   type: 'Application' | 'System';
   message: string;
   isRead: boolean;
   createdAt: string;
   relatedEntityId?: number;
   relatedEntityType?: string;
 }