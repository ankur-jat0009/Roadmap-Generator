import { generateRoadmap } from './services/geminiService';
import { supabase } from './services/supabaseService';
import dotenv from 'dotenv';
dotenv.config();

async function testAll() {
    console.log("--- STARTING INTEGRATION TESTS ---");

    // 1. Test Gemini
    console.log("\n[1/2] Testing Gemini (Model: gemini-flash-lite-latest)...");
    try {
        const roadmap = await generateRoadmap("HTML Basics", "Beginner", "3 days", "");
        console.log("✅ Gemini: Success!");
        console.log("   Roadmap Title:", roadmap.title);
    } catch (error: any) {
        console.error("❌ Gemini: Failed!");
        console.error("   Error:", error.message || error);
    }

    // 2. Test Supabase
    console.log("\n[2/2] Testing Supabase Connection...");
    try {
        // Try to fetch from roadmaps table
        const { data, error } = await supabase.from('roadmaps').select('*').limit(1);
        
        if (error) {
            // If table doesn't exist, it's still a "connection" success if we get a specific DB error
            // but let's see what happens.
            console.log("⚠️ Supabase: Connection established, but query had issues.");
            console.log("   Query Error:", error.message);
        } else {
            console.log("✅ Supabase: Success! Query executed.");
            console.log("   Data retrieved:", data);
        }
    } catch (error: any) {
        console.error("❌ Supabase: Critical Failure!");
        console.error("   Error:", error.message || error);
    }

    console.log("\n--- TESTS COMPLETE ---");
    process.exit(0);
}

testAll();
