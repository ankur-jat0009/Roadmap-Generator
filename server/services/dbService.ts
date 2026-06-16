import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase connections
  }
});

/**
 * Executes a query using the connection pool.
 */
export const query = (text: string, params?: any[]) => pool.query(text, params);

/**
 * Fetches a user's resume data directly from PostgreSQL.
 */
export const getResumeDirect = async (userId: string) => {
    const text = 'SELECT * FROM user_resumes WHERE user_id = $1 LIMIT 1';
    const res = await query(text, [userId]);
    return res.rows[0] || null;
};

/**
 * Upserts a user's resume data directly into PostgreSQL.
 */
export const upsertResumeDirect = async (userId: string, data: any) => {
    const text = `
        INSERT INTO user_resumes (
            user_id, full_name, job_title, email, phone, 
            linkedin_url, github_url, summary, education, 
            experience, projects, skills, achievements, 
            certifications, portfolio_template
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            full_name = EXCLUDED.full_name,
            job_title = EXCLUDED.job_title,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            linkedin_url = EXCLUDED.linkedin_url,
            github_url = EXCLUDED.github_url,
            summary = EXCLUDED.summary,
            education = EXCLUDED.education,
            experience = EXCLUDED.experience,
            projects = EXCLUDED.projects,
            skills = EXCLUDED.skills,
            achievements = EXCLUDED.achievements,
            certifications = EXCLUDED.certifications,
            portfolio_template = EXCLUDED.portfolio_template,
            created_at = now()
        RETURNING *;
    `;
    
    const values = [
        userId, data.full_name, data.job_title, data.email, data.phone,
        data.linkedin_url, data.github_url, data.summary, 
        JSON.stringify(data.education), JSON.stringify(data.experience),
        JSON.stringify(data.projects), JSON.stringify(data.skills),
        JSON.stringify(data.achievements), JSON.stringify(data.certifications),
        data.portfolio_template
    ];

    const res = await query(text, values);
    return res.rows[0];
};
