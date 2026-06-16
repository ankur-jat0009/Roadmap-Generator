import React, { useState, useCallback, useEffect } from 'react';
import { generateRoadmap, generatePersonalizedRoadmap } from './services/geminiService';
import { Roadmap as RoadmapType, SavedRoadmap, User, ResumeData } from './types';
import Loader from './components/Loader';
import Roadmap from './components/Roadmap';
import Navbar from './components/Navbar';
import VerticalNavbar from './components/VerticalNavbar';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import ProfilePage from './components/ProfilePage';
import HomePage from './components/HomePage';
import AptitudeDashboard from './components/AptitudeDashboard';
import MockInterviewPage from './components/MockInterviewPage';
import PortfolioPreview from './components/PortfolioPreview';
import DevCardPortfolio from './components/portfolio-templates/DevCardPortfolio';
import CleanPortfolio from './components/portfolio-templates/CleanPortfolio';
import GradientPortfolio from './components/portfolio-templates/GradientPortfolio';
import OnboardingTour, { TourStep } from './components/OnboardingTour'; // Import Tour
import { extractTextFromPDF } from './utils/pdfParser';
import { getSession, onAuthStateChange, signOutUser } from './services/authService';
import { getSavedRoadmaps, saveRoadmap, deleteRoadmap, updateRoadmapProgress, updateRoadmap } from './services/roadmapService';
import { getResume } from './services/resumeService';
// import * as pdfjsLib from 'pdfjs-dist';
import ArrowUpTrayIcon from './components/icons/ArrowUpTrayIcon';
import { SparklesIcon } from '@heroicons/react/24/outline';

// Configure the worker for pdfjs-dist
// pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;

type View = 'home' | 'dashboard' | 'roadmapGenerator' | 'resume' | 'profile' | 'portfolio' | 'aptitude' | 'mockInterview' | 'sharedPortfolio';

const App: React.FC = () => {
    // Initialize view based on URL to prevent flicker
    const [view, setView] = useState<View>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('view') === 'sharedPortfolio' ? 'sharedPortfolio' : 'home';
    });

    const [roadmap, setRoadmap] = useState<RoadmapType | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [autoGenerate, setAutoGenerate] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // State for Generation
    const [topic, setTopic] = useState<string>('');
    const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Professional'>('Beginner');
    const [generationMode, setGenerationMode] = useState<'topic' | 'job'>('topic');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeText, setResumeText] = useState<string>('');
    const [jobTitle, setJobTitle] = useState<string>('');
    const [jobDescription, setJobDescription] = useState<string>('');
    const [isParsing, setIsParsing] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [userName, setUserName] = useState('');
    const [modalView, setModalView] = useState<'signIn' | 'signUp' | null>(null);
    const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmap[]>([]);

    // Public Portfolio Data
    const [publicResumeData, setPublicResumeData] = useState<ResumeData | null>(null);

    // --- TOUR STATE ---
    const [showTour, setShowTour] = useState(false);

    // Define Tour Steps
    const tourSteps: TourStep[] = [
        {
            targetId: 'tour-welcome-header',
            title: 'Welcome to BuildMyPortfolio!',
            content: 'This is your dashboard. From here, you can access all the AI-powered tools to boost your career.',
            position: 'center'
        },
        {
            targetId: 'nav-roadmap',
            title: 'AI Roadmap Generator',
            content: 'Generate personalized learning paths for any tech stack or job role tailored to your timeline.',
            position: 'right'
        },
        {
            targetId: 'nav-interview',
            title: 'Mock Interviews',
            content: 'Practice speaking with an AI interviewer and get real-time feedback on your answers.',
            position: 'right'
        },
        {
            targetId: 'nav-profile',
            title: 'Your Profile',
            content: 'Access your saved roadmaps, resume data, and your shareable portfolio link here.',
            position: 'right'
        }
    ];

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const publicView = params.get('view');
        const sharedUserId = params.get('userId');

        if (publicView === 'sharedPortfolio' && sharedUserId) {
            setView('sharedPortfolio');
            getResume(sharedUserId).then(data => {
                if (data) setPublicResumeData(data);
            }).catch(err => console.error("App: Error loading public resume:", err));
        }

        const checkUser = async () => {
            try {
                const session = await getSession();
                const currentUser = session?.user ?? null;
                setUser(currentUser);

                if (publicView !== 'sharedPortfolio') {
                    if (currentUser) {
                        setUserName(currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User');
                        setView('dashboard');
                        loadRoadmaps();
                    } else {
                        setView('home');
                    }
                }
            } catch (err) {
                console.error("App: Error checking user:", err);
            }
        };

        checkUser();

        const subscription = onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            console.log("Auth State Changed. Event:", _event, "User:", currentUser?.email);
            setUser(currentUser);
            if (currentUser) {
                setUserName(currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User');
                setView(prevView => (prevView === 'home' || prevView === 'sharedPortfolio') ? 'dashboard' : prevView);
                loadRoadmaps();
            } else {
                // Only redirect to home if we aren't in a public view
                setView(prevView => prevView !== 'sharedPortfolio' ? 'home' : prevView);
            }
        });

        return () => {
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        };
    }, []);

    const loadRoadmaps = async () => {
        try {
            const data = await getSavedRoadmaps();
            setSavedRoadmaps(data);
        } catch (err) {
            console.error("Failed to load roadmaps:", err);
        }
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setRoadmap(null);
        try {
            let result: RoadmapType;
            if (generationMode === 'topic') {
                result = await generateRoadmap(topic, level, '4 weeks', user?.id || '');
            } else {
                if (!resumeText) {
                    throw new Error("Resume text not found. Please re-upload your resume.");
                }
                result = await generatePersonalizedRoadmap(resumeText, jobTitle, jobDescription, '4 weeks');
            }
            setRoadmap(result);
        } catch (err: any) {
            setError(err.message || "Failed to generate roadmap.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleProgressToggle = async (roadmapId: string, stepIndex: number) => {
        const roadmapToUpdate = savedRoadmaps.find(r => r.id === roadmapId);
        if (!roadmapToUpdate) return;

        let newProgress = [...roadmapToUpdate.completedSteps];
        if (newProgress.includes(stepIndex)) {
            newProgress = newProgress.filter(i => i !== stepIndex);
        } else {
            newProgress.push(stepIndex);
        }

        try {
            await updateRoadmapProgress(roadmapId, newProgress);
            setSavedRoadmaps(prev => prev.map(r =>
                r.id === roadmapId ? { ...r, completedSteps: newProgress } : r
            ));
        } catch (err) {
            console.error("Failed to update progress:", err);
        }
    };

    const handleSaveRoadmap = async () => {
        if (!roadmap || !user) return;
        try {
            const saved = await saveRoadmap(roadmap);
            setSavedRoadmaps(prev => [saved, ...prev]);
            setSuccessMessage("Roadmap saved to your profile!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Failed to save roadmap:", err);
        }
    };

    const handleDeleteRoadmap = async (id: string) => {
        try {
            await deleteRoadmap(id);
            setSavedRoadmaps(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error("Failed to delete roadmap:", err);
        }
    };

    const handleUpdateRoadmap = async (updated: SavedRoadmap) => {
        try {
            const result = await updateRoadmap(updated);
            setSavedRoadmaps(prev => prev.map(r => r.id === result.id ? result : r));
        } catch (err) {
            console.error("Failed to update roadmap:", err);
        }
    };

    const handleTourComplete = () => {
        setShowTour(false);
        localStorage.setItem('onboarding_complete', 'true');
    };

    const handleProjectSelect = (projectTitle: string) => {
        setTopic(projectTitle);
        setAutoGenerate(true);
    };

    const handleAuthSuccess = () => {
        setModalView(null);
        setView('dashboard');
        // Trigger tour for new sign ups immediately
        const hasSeenTour = localStorage.getItem('onboarding_complete');
        if (!hasSeenTour) {
            setTimeout(() => setShowTour(true), 500);
        }
    };

    const handleSignOut = async () => {
        await signOutUser();
        setView('home');
    };

    const renderContent = () => {
        const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

        // --- PUBLIC PORTFOLIO VIEW LOGIC ---
        if (view === 'sharedPortfolio') {
            if (!publicResumeData) return <div className="w-full min-h-screen flex items-center justify-center bg-white"><Loader /></div>;
            return (
                <div className="w-full min-h-screen bg-white relative">
                    {(() => {
                        const template = publicResumeData.portfolio_template || 'modern-minimalist';
                        switch (template) {
                            case 'dev-card': return <DevCardPortfolio data={publicResumeData} readOnly={true} />;
                            case 'clean': return <CleanPortfolio data={publicResumeData} readOnly={true} />;
                            case 'gradient': return <GradientPortfolio data={publicResumeData} readOnly={true} />;
                            case 'modern-minimalist':
                            default: return <PortfolioPreview data={publicResumeData} readOnly={true} />;
                        }
                    })()}
                    <a
                        href="/"
                        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-white/90 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all group no-underline"
                        title="Create your own portfolio with BuildMyPortfolio"
                    >
                        <div className="w-5 h-5 bg-primary rounded flex items-center justify-center text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 2.613a48.116 48.116 0 01-3.413-.387m-7.757-2.557c.818-.28 1.954-.59 3.25-.855m0 0a48.109 48.109 0 00-3.413.387m3.413-.387L19.5 7.5m-9.062.371c.674.05 1.354.102 2.037.152m-6.099-.548a9.026 9.026 0 0111.41 0m-11.41 0a9.042 9.042 0 01-2.096-.983M3 14.15l-1.618-2.52a2.18 2.18 0 01.378-2.83l.882-.588m0 0a9.052 9.052 0 012.096-.983M3 14.15l2.25-3.375M20.25 14.15l-2.25-3.375" />
                            </svg>
                        </div>
                        <span className="text-xs font-medium text-slate-500 group-hover:text-primary transition-colors">Made with BuildMyPortfolio</span>
                    </a>
                </div>
            );
        }

        if (!user && view !== 'home') {
            return <HomePage onSignUpClick={() => setModalView('signUp')} onNavigate={setView as any} isLoggedIn={false} />;
        }

        switch (view) {
            case 'home':
                return <HomePage onSignUpClick={() => setModalView('signUp')} onNavigate={setView as any} isLoggedIn={!!user} />;

            case 'dashboard':
                return <Dashboard userName={userName} onNavigate={setView as any} stats={{ roadmaps: savedRoadmaps.length }} />;

            case 'resume':
                return <ResumeAnalyzer onProjectSelect={handleProjectSelect} />;

            case 'profile':
            case 'portfolio':
                return <ProfilePage
                    userName={userName}
                    savedRoadmaps={savedRoadmaps}
                    onProgressToggle={handleProgressToggle}
                    onDeleteRoadmap={handleDeleteRoadmap}
                    onUpdateRoadmap={handleUpdateRoadmap}
                    onNavigate={setView as any}
                    initialTab={view === 'portfolio' ? 'portfolio' : undefined}
                />;
            case 'aptitude':
                return <AptitudeDashboard />;
            case 'mockInterview':
                return <MockInterviewPage user={user} />;

            case 'roadmapGenerator':
            default:
                const isCurrentRoadmapSaved = !!(roadmap && savedRoadmaps.some(r => r.title === roadmap.title && r.description === roadmap.description));
                const canGenerate = generationMode === 'topic'
                    ? !isLoading && topic.trim()
                    : !isLoading && !isParsing && resumeFile && resumeText && jobTitle.trim() && jobDescription.trim();

                return (
                    <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
                        <header className="w-full text-center pt-8 md:pt-12">
                            <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                                AI Roadmap Generator
                            </h1>
                            <p className="mt-4 text-lg text-text-secondary">
                                Chart your course. Generate a plan by topic or a personalized plan for your dream job.
                            </p>
                        </header>

                        <main className="w-full flex-grow flex flex-col items-center">
                            <div className="w-full max-w-3xl p-6 bg-background-secondary/80 backdrop-blur-md rounded-xl shadow-xl border border-border mt-8">

                                <div className="flex mb-6 p-1 bg-background-accent rounded-lg">
                                    <button
                                        onClick={() => setGenerationMode('topic')}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${generationMode === 'topic' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                    >
                                        By Topic
                                    </button>
                                    <button
                                        onClick={() => setGenerationMode('job')}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${generationMode === 'job' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                    >
                                        Personalized (Job-based)
                                    </button>
                                </div>

                                {generationMode === 'topic' ? (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-text-primary mb-2">What do you want to learn?</label>
                                            <input
                                                type="text"
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                placeholder="e.g. React.js, Data Science, Python..."
                                                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-text-secondary/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-text-primary mb-2">Skill Level</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {(['Beginner', 'Intermediate', 'Professional'] as const).map((l) => (
                                                    <button
                                                        key={l}
                                                        onClick={() => setLevel(l)}
                                                        className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${level === l ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-border text-text-secondary hover:border-primary/50'}`}
                                                    >
                                                        {l}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-text-primary mb-2">Target Job Title</label>
                                                <input
                                                    type="text"
                                                    value={jobTitle}
                                                    onChange={(e) => setJobTitle(e.target.value)}
                                                    placeholder="e.g. Frontend Engineer"
                                                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-text-primary mb-2">Upload Resume (PDF)</label>
                                                <div className="relative">
                                                <input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            
                                                            setResumeFile(file);
                                                            setIsParsing(true);
                                                            setError(null);
                                                            try {
                                                                const text = await extractTextFromPDF(file);
                                                                setResumeText(text);
                                                            } catch (err: any) {
                                                                setError(err.message);
                                                                setResumeFile(null);
                                                            } finally {
                                                                setIsParsing(false);
                                                            }
                                                        }}
                                                        className="hidden"
                                                        id="resume-upload"
                                                    />
                                                    <label
                                                        htmlFor="resume-upload"
                                                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${resumeFile ? 'border-success bg-success/5 text-success' : 'border-border hover:border-primary text-text-secondary'}`}
                                                    >
                                                        <ArrowUpTrayIcon className="w-5 h-5" />
                                                        <span className="truncate">{resumeFile ? resumeFile.name : 'Select Resume'}</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-text-primary mb-2">Job Description (Optional but recommended)</label>
                                            <textarea
                                                value={jobDescription}
                                                onChange={(e) => setJobDescription(e.target.value)}
                                                rows={4}
                                                placeholder="Paste the job description here for better results..."
                                                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleGenerate}
                                    disabled={!canGenerate}
                                    className="w-full mt-8 py-4 bg-primary hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Generating path...
                                        </>
                                    ) : (
                                        <>
                                            <SparklesIcon className="w-5 h-5" />
                                            Generate AI Roadmap
                                        </>
                                    )}
                                </button>
                            </div>

                            {roadmap && (
                                <div className="mt-12 w-full animate-fadeInUp">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-bold text-text-primary">Your Learning Path</h2>
                                        {user && (
                                            <button
                                                onClick={handleSaveRoadmap}
                                                disabled={isCurrentRoadmapSaved}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isCurrentRoadmapSaved ? 'bg-success/10 text-success border border-success/20 cursor-default' : 'bg-white dark:bg-white/5 border border-border hover:border-primary text-text-primary shadow-sm hover:shadow-md'}`}
                                            >
                                                {isCurrentRoadmapSaved ? '✓ Saved to Profile' : 'Save to Profile'}
                                            </button>
                                        )}
                                    </div>
                                    <Roadmap roadmap={roadmap} />
                                </div>
                            )}

                            {error && (
                                <div className="mt-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-center text-sm font-medium animate-fadeIn">
                                    {error}
                                </div>
                            )}
                        </main>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-background text-text-primary font-sans transition-colors duration-300 selection:bg-primary/30">
            {/* Render Tour if conditions met */}
            {showTour && (
                <OnboardingTour
                    steps={tourSteps}
                    onComplete={handleTourComplete}
                    onSkip={handleTourComplete}
                />
            )}

            {view === 'sharedPortfolio' ? (
                renderContent()
            ) : user ? (
                <div className="flex h-screen overflow-hidden flex-col md:flex-row">
                    {/* Desktop Sidebar */}
                    <div className="hidden md:block h-full">
                        <VerticalNavbar
                            currentView={view}
                            onNavigate={(v) => setView(v as View)}
                            isLoggedIn={true}
                            onSignInClick={() => { }}
                            onSignUpClick={() => { }}
                            onSignOut={handleSignOut}
                        />
                    </div>

                    {/* Mobile Top Navbar */}
                    <div className="md:hidden">
                        <Navbar
                            currentView={view}
                            onNavigate={(v) => setView(v as View)}
                            isLoggedIn={true}
                            onSignInClick={() => { }}
                            onSignUpClick={() => { }}
                            onSignOut={handleSignOut}
                        />
                    </div>

                    <main className="flex-1 overflow-y-auto bg-background relative scrollbar-hide">
                        <div className="p-4 md:p-8 max-w-[1600px] mx-auto pb-20 md:pb-8">
                            {renderContent()}
                        </div>
                    </main>
                </div>
            ) : (
                <div className="flex flex-col min-h-screen bg-background">
                    <Navbar
                        currentView={view}
                        onNavigate={(v) => setView(v as View)}
                        isLoggedIn={false}
                        onSignInClick={() => setModalView('signIn')}
                        onSignUpClick={() => setModalView('signUp')}
                        onSignOut={() => { }}
                    />
                    <div className="flex-grow">
                        <div className="flex flex-col items-center">
                            <div key={view} className="w-full animate-fadeIn">
                                {renderContent()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {modalView && (
                <AuthModal
                    initialView={modalView}
                    onClose={() => setModalView(null)}
                    onAuthSuccess={handleAuthSuccess}
                />
            )}

            {/* Success Toast */}
            {successMessage && (
                <div className="fixed bottom-6 right-6 bg-success text-white px-6 py-3 rounded-lg shadow-lg animate-fadeIn z-50 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {successMessage}
                </div>
            )}
        </div>
    );
};

export default App;
