import { supabase } from './supabase';
import { ResumeData } from '../types';

// Default state for a new or empty resume
const initialResumeState: ResumeData = {
    full_name: '', job_title: '', email: '', phone: '', linkedin_url: '', github_url: '',
    summary: '', education: [], experience: [], projects: [], skills: [],
    achievements: [], certifications: [] // <-- ADDED
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Fetches a user's resume data from the database.
export const getResume = async (userId: string): Promise<ResumeData | null> => {
    try {
        const response = await fetch(`${API_URL}/resumes/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch resume");
        const data = await response.json();

        if (!data) return null;
        
        return {
            ...initialResumeState,
            ...data,
            education: Array.isArray(data.education) ? data.education : [],
            experience: Array.isArray(data.experience) ? data.experience : [],
            projects: Array.isArray(data.projects) ? data.projects : [],
            skills: Array.isArray(data.skills) ? data.skills : [],
            achievements: Array.isArray(data.achievements) ? data.achievements : [],
            certifications: Array.isArray(data.certifications) ? data.certifications : [],
        };
    } catch (error) {
        console.error('Error fetching resume direct:', error);
        return null;
    }
};


// Function to save or update (upsert) a resume for a user
export const upsertResume = async (resumeData: Partial<ResumeData>): Promise<ResumeData> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    try {
        const response = await fetch(`${API_URL}/resumes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, resumeData })
        });

        if (!response.ok) throw new Error("Failed to save resume");
        const data = await response.json();

        return {
            ...initialResumeState,
            ...data,
            education: Array.isArray(data.education) ? data.education : [],
            experience: Array.isArray(data.experience) ? data.experience : [],
            projects: Array.isArray(data.projects) ? data.projects : [],
            skills: Array.isArray(data.skills) ? data.skills : [],
            achievements: Array.isArray(data.achievements) ? data.achievements : [],
            certifications: Array.isArray(data.certifications) ? data.certifications : [],
        };
    } catch (error) {
        console.error('Error upserting resume direct:', error);
        throw error;
    }
};