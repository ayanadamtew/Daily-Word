import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read env variables manually
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const email = `test-${Date.now()}@gmail.com`;
  const password = 'Password123!';
  
  console.log(`--- Signing Up New User: ${email} ---`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  });

  if (authError) {
    console.error('Sign Up Error:', authError);
    return;
  }

  const userId = authData.user.id;
  console.log('User signed up successfully. UID:', userId);

  // Use the session from the signed up user so we are authenticated!
  const userSupabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false
    }
  });
  await userSupabase.auth.setSession(authData.session);

  console.log('\n--- Attempting Profile Insertion as Authenticated User ---');
  const newProfile = {
    id: userId,
    name: 'Test Faithful Reader',
    bible_version: 'NIV',
    is_public: false,
    created_at: new Date().toISOString()
  };

  const { data: profileData, error: profileError } = await userSupabase
    .from('profiles')
    .insert(newProfile)
    .select();

  console.log('Profile Insert Result:', profileData);
  console.log('Profile Insert Error:', JSON.stringify(profileError, null, 2));

  if (profileError) {
    console.log('Profile creation failed. Exiting.');
    return;
  }

  console.log('\n--- Attempting Entry Insertion as Authenticated User ---');
  const testEntry = {
    user_id: userId,
    date: '2026-05-25',
    type: 'read',
    book: 'Genesis',
    chapter: '1',
    verse: '1',
    notes: 'Test note',
    created_at: new Date().toISOString()
  };

  const { data: entryData, error: entryError } = await userSupabase
    .from('entries')
    .insert(testEntry)
    .select();

  console.log('Entry Insert Result:', entryData);
  console.log('Entry Insert Error:', JSON.stringify(entryError, null, 2));
}

run();
