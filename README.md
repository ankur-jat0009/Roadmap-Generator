# AI Roadmap Generator & Career Architect

🚀 **Deployments:**
*   **Live App:** [https://buildmyportfolio99.vercel.app/](https://buildmyportfolio99.vercel.app/)
*   **API Server:** [https://roadmap-generator-ogf6.onrender.com](https://roadmap-generator-ogf6.onrender.com)

An intelligent, full-stack career development platform designed to help developers bridge the gap between their current skills and their dream jobs. Powered by **Gemini 1.5 Flash-lite** and **Sarvam AI**, this tool automates the creation of personalized learning paths, analyzes resumes for ATS compatibility, and provides realistic mock interview experiences.

---

## 🌟 Key Features

### 🗺️ AI Roadmap Generator
Generate detailed, step-by-step learning paths tailored to your specific goals, difficulty level (Beginner to Expert), and timeline.
*   **Interactive Visualizations:** View your roadmap as a logical graph or a structured timeline.
*   **Progress Tracking:** Save roadmaps to your profile and track completed steps.
*   **Resource Curation:** Automatically discovers top-tier videos, documentation, and tools for each step.

### 📄 Resume Architect & Analyzer
Get instant, professional feedback on your resume using our AI-driven analysis engine.
*   **ATS Matching:** See how well your resume matches specific job descriptions.
*   **Skill Gap Analysis:** Identifies exactly which skills you're missing for a target role.
*   **Project Suggestions:** AI suggests 3 high-impact projects you can build to fill identified skill gaps.
*   **PDF Parsing:** Upload your existing resume and have the AI extract and analyze the content instantly.

### 🎙️ AI Mock Interviews
Practice your interview skills with an adaptive AI hiring manager.
*   **Context-Aware Questions:** The AI asks technical and behavioral questions based on *your* resume and the job you're applying for.
*   **Voice Support:** Powered by Sarvam AI for natural-sounding voice interactions.
*   **Detailed Feedback:** Receive a comprehensive performance report at the end of every session.

### 🧠 Aptitude Prep & Study Guides
*   **Dynamic Quizzes:** AI-generated aptitude questions tailored to your target topics.
*   **Instant Study Guides:** Generate focused summaries and formula sheets for any tech or academic topic.

---

## 🛠️ Tech Stack

**Frontend:**
*   React 19 (TypeScript)
*   Vite (Build Tool)
*   Tailwind CSS (Styling)
*   React Flow (Graph Visualization)
*   Lucide React & Heroicons (Iconography)

**Backend:**
*   Node.js & Express
*   TypeScript
*   PostgreSQL (Database)
*   Supabase (Auth & Data Management)

**AI & Services:**
*   **Google Gemini 1.5 Flash-lite:** Core logic for roadmap generation and resume analysis.
*   **Sarvam AI:** Speech-to-Text and Text-to-Speech for mock interviews.
*   **Supabase Storage:** Profile and resume management.

---

## 🚀 Deployment Guide

### 1. Database (Supabase)
1. Create a project at [Supabase](https://supabase.com/).
2. Run the SQL scripts found in the `/database` directory using the Supabase SQL Editor to set up your tables.
3. Enable **Google Auth** or **Email Auth** in the Authentication settings.

### 2. Backend (Render)
1. Create a **Web Service** on [Render](https://render.com/).
2. Connect your repository and set the **Root Directory** to `server`.
3. **Environment Variables:**
   * `GEMINI_API_KEY`: Your Google AI Studio key.
   * `SARVAM_API_KEY`: Your Sarvam AI subscription key.
   * `DATABASE_URL`: Your Supabase PostgreSQL connection string.
   * `PORT`: `10000`

### 3. Frontend (Vercel)
1. Create a new project on [Vercel](https://vercel.com/).
2. Set the **Root Directory** to `client`.
3. **Environment Variables:**
   * `VITE_API_URL`: Your Render server URL + `/api`.
   * `VITE_SUPABASE_URL`: Your Supabase Project URL.
   * `VITE_SUPABASE_ANON_KEY`: Your Supabase API Key.

---

## 📦 Installation (Local)

1. **Clone the Repo:**
   ```bash
   git clone https://github.com/ankur-jat0009/Roadmap-Generator.git
   ```

2. **Setup Backend:**
   ```bash
   cd server
   npm install
   # Add .env with required keys
   npm run dev
   ```

3. **Setup Frontend:**
   ```bash
   cd client
   npm install
   # Add .env with required keys
   npm run dev
   ```

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License
This project is licensed under the ISC License.
