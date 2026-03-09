const { execSync } = require('child_process');

const envs = {
    DATABASE_URL: 'postgresql://postgres:9%26u25Zc3%3FX%26N_%26w@db.dainnwasbsejppsakyrl.supabase.co:5432/postgres',
    SUPABASE_URL: 'https://dainnwasbsejppsakyrl.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhaW5ud2FzYnNlanBwc2FreXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NDA3MDMsImV4cCI6MjA4NzQxNjcwM30.Rmb5ie5H-jZlIjn1zGN78IniXxNPeSPz2JPeywUw-20',
    SESSION_SECRET: 'f2e9a7b8c1d2e3f4a5b6c7d8e9f0a1b2'
};

for (const [name, value] of Object.entries(envs)) {
    try {
        console.log(`Setting ${name} for Vercel...`);
        // Use a clean buffer to send the value without newlines via stdin
        execSync(`npx -y vercel env add ${name} production --force`, {
            input: Buffer.from(value),
            cwd: process.cwd()
        });
        console.log(`Successfully set ${name}`);
    } catch (err) {
        console.error(`Error setting ${name}:`, err.message);
    }
}
