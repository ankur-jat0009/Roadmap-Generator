# 🚀 Interview Preparation Guide: Project Road

This document contains 20 detailed interview questions and answers based on the architecture, implementation, and logic of Project Road. Use this to prepare for technical interviews and explain your contributions effectively.

---

### **Part 1: The Basics (Project Overview & Tech Stack)**

#### **1. Can you give me a high-level overview of this project?**
**Answer:** "I built 'Road,' an AI-powered career development suite designed to bridge the gap between learning and getting hired. It uses Google’s Gemini AI to generate personalized learning roadmaps, analyze resumes against job descriptions, and conduct voice-interactive mock interviews. It’s a full-stack application built with React 19, Node.js (Express), and Supabase."

#### **2. Why did you choose React 19 and Vite instead of something like Next.js?**
**Answer:** "I opted for React 19 with Vite for maximum speed and a lightweight client-side experience. Since the application is highly interactive—featuring a custom Roadmap editor and a real-time Mock Interview—an SPA (Single Page Application) approach was ideal. It allows for seamless state management without the complexity of server-side rendering for every UI change."

#### **3. How do you manage user authentication and data storage?**
**Answer:** "I integrated **Supabase** for Backend-as-a-Service. It handles JWT-based authentication and uses PostgreSQL for the database. I have tables for users, roadmaps, and resumes, and I use Supabase’s Row-Level Security (RLS) to ensure users can only access their own data, keeping the platform secure by design."

#### **4. How do you handle Dark Mode and Theme consistency?**
**Answer:** "I implemented a `ThemeContext` using React’s Context API that toggles a `dark` class on the root element. Combined with Tailwind CSS, this allows for effortless theme switching across the entire app, including complex components like the Roadmap graph nodes."

#### **5. What is the 'Usage Service' in your backend?**
**Answer:** "The `usageService` is a middleware I built to track AI API consumption. Since LLM calls have costs/quotas, this service tracks how many free trials (roadmaps or interviews) a guest user has performed. It prevents abuse by enforcing limits before requiring a user to sign up."

---

### **Part 2: AI & Roadmap Logic**

#### **6. How does the AI Roadmap generation work technically?**
**Answer:** "When a user submits a topic, the Express server prompts Gemini AI to return a structured JSON object. This JSON defines learning steps, resources, and timelines. On the frontend, I parse this data and use **React Flow** to render it as an interactive, draggable graph where users can track their progress."

#### **7. You mentioned 'React Flow.' Why use that specifically?**
**Answer:** "Standard lists are boring for complex paths. React Flow allowed me to make the roadmap 'alive.' It provides a canvas for nodes and edges, handling zooming and panning natively. It makes the learning journey feel like a professional architecture map rather than just a checklist."

#### **8. How do you handle 'AI Hallucinations' in the Roadmap resources?**
**Answer:** "I use strict prompt engineering to force the AI to prioritize reputable domains like MDN, Coursera, and official docs. Additionally, I've implemented a validation layer that checks for common URL patterns and a user feedback system to flag and remove broken links."

#### **9. What was the most difficult bug you faced regarding AI integration?**
**Answer:** "Handling inconsistent AI output. Sometimes Gemini would return markdown-wrapped JSON instead of a raw object. I solved this by writing a robust 'JSON extractor' utility on the server that uses regex to find the JSON block and validates it against my TypeScript interfaces before it hits the frontend."

#### **10. How do you handle the Aptitude Dashboard’s question generation?**
**Answer:** "The dashboard uses a hybrid approach. I have a core set of verified questions in Supabase, but users can trigger an 'AI Generation' mode. This calls Gemini to create niche questions based on a specific category, ensuring the difficulty level matches the user's current progress."

---

### **Part 3: Resume & Interview Features**

#### **11. How do you handle Resume Analysis and PDF parsing?**
**Answer:** "I use `pdfjs-dist` on the frontend to extract text directly from the user's browser for privacy and speed. That text is sent to the AI for a 'Gap Analysis'—comparing the resume against a job description to identify missing skills and provide a compatibility score."

#### **12. Explain the technical flow of the Mock Interview feature.**
**Answer:** "It's a continuous loop:
1. Gemini generates a question based on the user's resume.
2. The user answers via voice, which is transcribed to text.
3. The server sends that text back to Gemini for evaluation and to trigger the next follow-up question.
4. The AI's response is converted back to speech using a Text-to-Speech (TTS) service so the user 'hears' the interviewer."

#### **13. How do you maintain context during a 15-minute mock interview?**
**Answer:** "I maintain a `conversationHistory` array in the component state, which is sent with every new request to the server. This allows the AI to 'remember' previous answers, follow up on specific points, and ensure the interview flows logically like a real conversation."

#### **14. What happens if the Speech-to-Text (STT) fails or misinterprets the user?**
**Answer:** "I implemented a 'Correction UI' where the transcribed text appears on screen. If the STT is wrong, the user can quickly edit the text before clicking 'Send.' This prevents the AI from penalizing the user for a software glitch."

#### **15. How do you calculate the 'Interview Score' at the end?**
**Answer:** "Once the interview concludes, the entire history is sent to a specific 'Evaluation' prompt. Gemini analyzes the user's technical accuracy, communication style, and confidence, returning a detailed report with a numerical score and specific areas for improvement."

---

### **Part 4: Advanced Engineering (The "5 More" Questions)**

#### **16. How do you handle asynchronous state updates to prevent UI 'flicker' during AI calls?**
**Answer:** "I use 'Optimistic UI' patterns and dedicated loading states. For example, while the Roadmap is generating, I show a skeleton loader that mimics the graph's structure. I also use React's `useTransition` and `Suspense` features to ensure that navigation remains responsive even while heavy data fetching is happening in the background."

#### **17. If the Gemini API goes down, does your entire app break?**
**Answer:** "No. I built a **Circuit Breaker** pattern into my services. If the AI service fails, the app catches the error and offers a 'Static Mode' where it loads pre-saved roadmaps or mock questions from the database. This ensures the user isn't met with a blank screen if there's an external API outage."

#### **18. How do you ensure your prompts stay secure (Prompt Injection prevention)?**
**Answer:** "I never send raw user input directly to the AI as a command. Instead, I use a 'System Prompt' template on the server. The user's input is treated as *data* within that template. I also have a sanitization layer that strips out common injection phrases like 'ignore previous instructions,' ensuring the AI stays within its defined role."

#### **19. Why did you choose Express over a purely serverless (Lambda) approach?**
**Answer:** "Since the Mock Interview requires maintaining a sequence of events and potentially heavy processing of audio blobs, a persistent Express server was easier to debug and manage during the MVP phase. However, the architecture is modular, so I can easily migrate specific routes (like PDF parsing) to serverless functions in the future to handle scale."

#### **20. What is your strategy for optimizing the performance of the React Flow graph with 100+ nodes?**
**Answer:** "React Flow is quite efficient, but for very large roadmaps, I implement **Virtualization**. I only render the nodes that are currently in the viewport. I also use `React.memo` for custom node components to prevent unnecessary re-renders when the user drags a different part of the map."

---

### **Summary Tip for the Interviewer:**
*"The goal of this project wasn't just to use AI, but to use it **responsibly**. I focused on data validation, cost management, and user experience to ensure that the AI acts as a helpful tool rather than an unpredictable black box."*
