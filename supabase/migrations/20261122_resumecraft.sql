-- ResumeCraft – AI Resume Tailoring Studio
-- Supabase PostgreSQL Database Schema & Row Level Security (RLS) Policies
-- Migration: 20261122_resumecraft.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Central Information Repository)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    other_links JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- 2. PROFESSIONAL SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS public.professional_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SKILLS TABLE (Categorized, Aliased, Verified)
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'Programming Languages',
        'Frontend Technologies',
        'Backend Technologies',
        'Databases',
        'Frameworks and Libraries',
        'Developer Tools',
        'Cloud Platforms',
        'Testing Tools',
        'Other Skills'
    )),
    proficiency TEXT CHECK (proficiency IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    aliases TEXT[] DEFAULT '{}',
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EXPERIENCES TABLE
CREATE TABLE IF NOT EXISTS public.experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    job_title TEXT NOT NULL,
    employment_type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    location TEXT,
    technologies TEXT[] DEFAULT '{}',
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EXPERIENCE BULLETS TABLE (Granular source facts with stable IDs)
CREATE TABLE IF NOT EXISTS public.experience_bullets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('responsibility', 'achievement')),
    text TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    technologies TEXT[] DEFAULT '{}',
    github_url TEXT,
    live_url TEXT,
    duration TEXT,
    keywords TEXT[] DEFAULT '{}',
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PROJECT BULLETS TABLE (Granular facts)
CREATE TABLE IF NOT EXISTS public.project_bullets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('bullet', 'achievement')),
    text TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EDUCATION TABLE
CREATE TABLE IF NOT EXISTS public.education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    branch TEXT NOT NULL,
    start_year TEXT NOT NULL,
    graduation_year TEXT NOT NULL,
    cgpa_or_percentage TEXT,
    additional_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CERTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    issuing_org TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    expiration_date TEXT,
    credential_id TEXT,
    credential_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. RESUME TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.resume_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for public built-in templates
    name TEXT NOT NULL,
    description TEXT,
    layout_type TEXT NOT NULL,
    is_built_in BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    accent_color TEXT DEFAULT '#0066CC',
    font_family TEXT DEFAULT '-apple-system, sans-serif',
    sections_order TEXT[] DEFAULT '{"summary", "skills", "experience", "projects", "education", "certifications"}',
    docx_storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. JOB DESCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.job_descriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    location TEXT,
    url TEXT,
    raw_text TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('paste', 'upload')),
    uploaded_file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. TAILORED RESUMES TABLE
CREATE TABLE IF NOT EXISTS public.tailored_resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_description_id UUID REFERENCES public.job_descriptions(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.resume_templates(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    selected_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    selected_experiences JSONB NOT NULL DEFAULT '[]'::jsonb,
    selected_projects JSONB NOT NULL DEFAULT '[]'::jsonb,
    education_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    certifications_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    validation_report JSONB NOT NULL DEFAULT '{}'::jsonb,
    diff JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. SAVED APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.saved_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    location TEXT,
    job_url TEXT,
    tailored_resume_id UUID REFERENCES public.tailored_resumes(id) ON DELETE SET NULL,
    job_description_id UUID REFERENCES public.job_descriptions(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.resume_templates(id) ON DELETE SET NULL,
    relevance_score INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Applied', 'Interviewing', 'Offer', 'Archived')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. USER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    ai_provider TEXT DEFAULT 'gemini',
    gemini_model TEXT DEFAULT 'gemini-3.8-flash',
    api_key_configured BOOLEAN DEFAULT FALSE,
    privacy_consent_given BOOLEAN DEFAULT TRUE,
    anonymize_pii_in_prompt BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_bullets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_bullets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tailored_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Helper macro for standard user isolation policy
DO $$
DECLARE
    tbl text;
    user_isolated_tables text[] := ARRAY[
        'profiles',
        'professional_summaries',
        'skills',
        'experiences',
        'experience_bullets',
        'projects',
        'project_bullets',
        'education',
        'certifications',
        'achievements',
        'job_descriptions',
        'tailored_resumes',
        'saved_applications',
        'user_settings'
    ];
BEGIN
    FOREACH tbl IN ARRAY user_isolated_tables LOOP
        EXECUTE format('
            CREATE POLICY "%s_user_isolation_policy" ON public.%I
            FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
        ', tbl, tbl);
    END LOOP;
END $$;

-- Resume templates can be built-in (user_id IS NULL, visible to all) or user-created
CREATE POLICY "resume_templates_read_policy" ON public.resume_templates
    FOR SELECT
    USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "resume_templates_modify_policy" ON public.resume_templates
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON public.skills(user_id);
CREATE INDEX IF NOT EXISTS idx_experiences_user_id ON public.experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tailored_resumes_user_id ON public.tailored_resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_applications_user_id ON public.saved_applications(user_id);
