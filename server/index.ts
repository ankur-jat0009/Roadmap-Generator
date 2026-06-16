import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';

// Import Roadmap & Analysis features from Gemini Service
import {
    suggestProjectsFromResume,
    generateRoadmap,
    generateAIReply,
    generateAptitudeQuestions,
    generateStudyGuide,
    generatePersonalizedRoadmap,
} from './services/geminiService';

// Import Interview & Voice features from Sarvam Service
import {
    startInterview,
    continueInterview,
    getInterviewFeedback,
    getAIAudio,
    getTranscription
} from './services/sarvamService';

import { getResumeDirect, upsertResumeDirect } from './services/dbService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://roadmap-generator-ogf6.onrender.com',
        'https://buildmyportfolio99.vercel.app',
        /\.vercel\.app$/ 
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));

// Set up multer for audio uploads
const upload = multer({ dest: 'uploads/' });

// Root & Health Check
app.get('/', (req, res) => res.send("API is running..."));
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// --- API Routes ---

// Resume Analysis
app.post('/api/analyze-resume', async (req: Request, res: Response) => {
    try {
        const { resumeText, jobTitle, jobDescription } = req.body;
        const result = await suggestProjectsFromResume(resumeText, jobTitle, jobDescription);
        res.json(result);
    } catch (error) {
        console.error("Error in /api/analyze-resume:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
    }
});

// Roadmap Generation
app.post('/api/generate-roadmap', async (req: Request, res: Response) => {
    try {
        const { topic, level, timeline, userId } = req.body;
        const result = await generateRoadmap(topic, level, timeline, userId);
        res.json(result);
    } catch (error) {
        console.error("Error in /api/generate-roadmap:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
    }
});

// Personalized Roadmap Generation
app.post('/api/personalized-roadmap', async (req: Request, res: Response) => {
    try {
        const { resumeText, jobTitle, jobDescription, timeline } = req.body;
        const result = await generatePersonalizedRoadmap(resumeText, jobTitle, jobDescription, timeline);
        res.json(result);
    } catch (error) {
        console.error("Error in /api/personalized-roadmap:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
    }
});

// Aptitude Questions
app.post('/api/aptitude/questions', async (req: Request, res: Response) => {
    try {
        const { topic, numQuestions, category, referenceQuestions } = req.body;
        // The service now expects 4 arguments: referenceQuestions, topicName, topicCategory, count
        const result = await generateAptitudeQuestions(
            referenceQuestions || [], 
            topic || "General Aptitude", 
            category || "Quantitative", 
            numQuestions || 5
        );
        res.json(result);
    } catch (error) {
        console.error("Error in /api/aptitude/questions:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
    }
});

// Study Guide
app.post('/api/aptitude/study-guide', async (req: Request, res: Response) => {
    try {
        const { topicName } = req.body;
        const result = await generateStudyGuide(topicName);
        res.json({ studyGuide: result });
    } catch (error) {
        console.error("Error in /api/aptitude/study-guide:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
    }
});

// AI Chat Reply
app.post('/api/chat/reply', async (req: Request, res: Response) => {
    try {
        const { message } = req.body;
        const result = await generateAIReply(message);
        res.json({ reply: result });
    } catch (error) {
        console.error("Error in /api/chat/reply:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
    }
});

// Mock Interview - Start
app.post('/api/interview/start', async (req: Request, res: Response) => {
    try {
        const { resumeText, jobTitle, jobDescription } = req.body;
        const firstQuestion = await startInterview(resumeText, jobTitle, jobDescription);
        res.json({ question: firstQuestion });
    } catch (error) {
        console.error("Error in /api/interview/start:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
    }
});

// Mock Interview - Continue
app.post('/api/interview/continue', async (req: Request, res: Response) => {
    try {
        const { conversationHistory, resumeText, jobTitle } = req.body;
        const nextQuestion = await continueInterview(conversationHistory, resumeText, jobTitle);
        res.send(nextQuestion);
    } catch (error) {
        console.error("Error in /api/interview/continue:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
    }
});

// Mock Interview - Feedback
app.post('/api/interview/feedback', async (req: Request, res: Response) => {
    try {
        const { conversationHistory, jobTitle, resumeText } = req.body;
        const result = await getInterviewFeedback(conversationHistory, jobTitle, resumeText);
        res.json(result);
    } catch (error) {
        console.error("Error in /api/interview/feedback:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
    }
});

// Text-to-Speech
app.post('/api/tts', async (req: Request, res: Response) => {
    try {
        const { textToSpeak } = req.body;
        const audioBase64 = await getAIAudio(textToSpeak);
        res.json({ audioUrl: `data:audio/wav;base64,${audioBase64}` });
    } catch (error) {
        console.error("Error in /api/tts:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
    }
});

// Audio Transcription
app.post('/api/transcribe', upload.single('audio'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file provided." });
        }
        const transcript = await getTranscription(req.file.path);
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.json({ transcript });
    } catch (error) {
        console.error("Error in /api/transcribe:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
    }
});

// Direct Database Routes
app.get('/api/resumes/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const resume = await getResumeDirect(userId);
        res.json(resume);
    } catch (error) {
        console.error("Error fetching resume direct:", error);
        res.status(500).json({ error: "Failed to fetch resume" });
    }
});

app.post('/api/resumes', async (req: Request, res: Response) => {
    try {
        const { userId, resumeData } = req.body;
        if (!userId) return res.status(400).json({ error: "User ID required" });
        const result = await upsertResumeDirect(userId, resumeData);
        res.json(result);
    } catch (error) {
        console.error("Error saving resume direct:", error);
        res.status(500).json({ error: "Failed to save resume" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
