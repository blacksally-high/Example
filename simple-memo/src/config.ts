const env=import.meta.env;
export const CONFIG={name:'나의 메모',url:env.VITE_SUPABASE_URL||'https://unconfigured.supabase.co',key:env.VITE_SUPABASE_PUBLISHABLE_KEY||'not-configured',configured:!!env.VITE_SUPABASE_URL&&!!env.VITE_SUPABASE_PUBLISHABLE_KEY,release:'1.0.0',accountDeletionReady:false,publicSignupReady:env.VITE_PUBLIC_SIGNUP_READY==='true'};
