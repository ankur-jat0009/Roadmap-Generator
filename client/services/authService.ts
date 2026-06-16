import { supabase } from './supabase';
import { AuthCredentials } from '../types';

export const signUpUser = async ({ name, email, password }: AuthCredentials) => {
    console.log("Attempting Sign Up for:", email);
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
            }
        }
    });
    if (error) {
        console.error("Sign Up Error:", error);
        throw error;
    }
    console.log("Sign Up Success:", data);
    return data;
};

export const signInUser = async ({ email, password }: AuthCredentials) => {
    console.log("Attempting Sign In for:", email);
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) {
        console.error("Sign In Error:", error);
        throw error;
    }
    console.log("Sign In Success:", data);
    return data;
};

export const signOutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const getSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
}

// THIS FUNCTION IS UPDATED
// It now directly returns the subscription object from Supabase, which is what App.tsx needs.
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
    const { data } = supabase.auth.onAuthStateChange(callback);
    return data.subscription;
};

