-- CrackIt Database Schema for Supabase (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QUESTIONS TABLE (Static Question Bank)
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN ('HR', 'Technical', 'Behavioral', 'Aptitude', 'System Design', 'Resume-based')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    question_text TEXT NOT NULL,
    sample_answer TEXT NOT NULL,
    explanation TEXT,
    keywords TEXT[] DEFAULT '{}',
    tips TEXT,
    company TEXT,
    profile TEXT,
    resume_id UUID REFERENCES resumes(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INTERVIEW SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interview_type TEXT NOT NULL CHECK (interview_type IN ('HR', 'Technical', 'Behavioral', 'System Design', 'Aptitude', 'Resume-based', 'Mixed')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    overall_score NUMERIC(4,2) DEFAULT 0,
    total_questions INTEGER DEFAULT 5,
    answered_count INTEGER DEFAULT 0,
    resume_id UUID REFERENCES resumes(id),
    company TEXT,
    profile TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================
-- INTERVIEW RESPONSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS interview_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    user_answer TEXT,
    ai_score NUMERIC(4,2) DEFAULT 0,
    ai_feedback JSONB DEFAULT '{}',
    question_number INTEGER NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'Medium',
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    time_limit INTEGER DEFAULT 120
);

-- ============================================
-- RESUMES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    extracted_skills TEXT[] DEFAULT '{}',
    extracted_projects TEXT[] DEFAULT '{}',
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_sessions_user ON interview_sessions(user_id);
CREATE INDEX idx_responses_session ON interview_responses(session_id);
CREATE INDEX idx_resumes_user ON resumes(user_id);

-- ============================================
-- SEED DATA: Sample Questions
-- ============================================
INSERT INTO questions (category, difficulty, question_text, sample_answer, explanation, keywords, tips) VALUES

-- HR Questions
('HR', 'Easy', 'Tell me about yourself.', 
 'I am a software engineering graduate with experience in full-stack development. I have worked on projects involving React, Python, and cloud technologies. I am passionate about building user-centric applications and continuously learning new technologies.',
 'This is typically the opening question. Keep it concise, professional, and relevant to the role.',
 ARRAY['introduction', 'background', 'experience', 'passion'],
 'Structure your answer: Present → Past → Future. Keep it under 2 minutes.'),

('HR', 'Medium', 'Why should we hire you?',
 'I bring a strong combination of technical skills and problem-solving ability. My experience with modern web technologies, combined with my ability to work effectively in teams and deliver projects on deadline, makes me a strong fit for this role.',
 'Focus on what unique value you bring that aligns with their needs.',
 ARRAY['value proposition', 'skills', 'fit', 'contribution'],
 'Research the company beforehand and tailor your answer to their specific needs.'),

('HR', 'Hard', 'Describe a time you failed and what you learned from it.',
 'During a group project, I took on too many responsibilities without delegating, which led to missed deadlines. I learned the importance of delegation, communication, and realistic planning. Since then, I use project management tools and regular check-ins to ensure balanced workloads.',
 'Shows self-awareness, growth mindset, and ability to learn from mistakes.',
 ARRAY['failure', 'learning', 'growth', 'self-awareness'],
 'Use the STAR method. Be genuine — interviewers value authenticity over perfection.'),

-- Technical Questions
('Technical', 'Easy', 'What is the difference between a list and a tuple in Python?',
 'Lists are mutable (can be modified after creation) and use square brackets []. Tuples are immutable (cannot be modified) and use parentheses (). Tuples are faster and use less memory, making them suitable for fixed data.',
 'Tests fundamental understanding of Python data structures.',
 ARRAY['python', 'list', 'tuple', 'mutable', 'immutable'],
 'Give examples and mention performance implications.'),

('Technical', 'Medium', 'Explain the concept of RESTful APIs.',
 'REST (Representational State Transfer) is an architectural style for designing networked applications. RESTful APIs use HTTP methods (GET, POST, PUT, DELETE) to perform CRUD operations on resources identified by URIs. They are stateless, meaning each request contains all information needed.',
 'REST is the most common API design pattern in modern web development.',
 ARRAY['REST', 'API', 'HTTP', 'CRUD', 'stateless'],
 'Mention status codes, JSON format, and real-world examples.'),

('Technical', 'Hard', 'What is the difference between SQL and NoSQL databases? When would you choose one over the other?',
 'SQL databases are relational, use structured schemas, and support ACID transactions (e.g., PostgreSQL, MySQL). NoSQL databases are non-relational, schema-flexible, and designed for horizontal scaling (e.g., MongoDB, Redis). Choose SQL for complex queries and data integrity; NoSQL for high scalability and flexible data models.',
 'Tests understanding of database design principles and trade-offs.',
 ARRAY['SQL', 'NoSQL', 'relational', 'schema', 'scalability', 'ACID'],
 'Discuss specific use cases for each type.'),

-- Behavioral Questions
('Behavioral', 'Easy', 'How do you handle working under pressure?',
 'I stay organized by breaking tasks into smaller milestones and prioritizing based on urgency and impact. I also communicate proactively with my team about progress and potential blockers. During my final year project, tight deadlines pushed me to develop better time management habits.',
 'Shows emotional intelligence and practical coping strategies.',
 ARRAY['pressure', 'time management', 'prioritization', 'communication'],
 'Share a specific example using the STAR method.'),

('Behavioral', 'Medium', 'Tell me about a time you had a conflict with a team member.',
 'During a hackathon, a teammate and I disagreed on the tech stack. I suggested we list pros and cons of each option and align our choice with the project requirements. We reached a compromise and the project was successful. I learned that active listening and data-driven decisions resolve conflicts effectively.',
 'Tests conflict resolution skills and teamwork.',
 ARRAY['conflict', 'teamwork', 'resolution', 'communication'],
 'Focus on the resolution, not the conflict itself. Show maturity.'),

('Behavioral', 'Hard', 'Describe a situation where you had to make a difficult decision with incomplete information.',
 'In a startup project, we had to choose between two cloud providers with limited benchmarking data. I gathered available performance metrics, consulted with experienced developers, assessed cost trade-offs, and made a decision with a rollback plan. The choice worked well, and I learned to be comfortable with calculated risks.',
 'Tests decision-making under uncertainty and risk assessment skills.',
 ARRAY['decision-making', 'uncertainty', 'risk', 'analysis'],
 'Show your thought process and how you mitigated risks.'),

-- Aptitude Questions
('Aptitude', 'Easy', 'If a train travels 120 km in 2 hours, what is its average speed?',
 'Average speed = Total distance / Total time = 120 km / 2 hours = 60 km/h.',
 'Basic speed-distance-time formula application.',
 ARRAY['speed', 'distance', 'time', 'formula'],
 'Always state the formula first, then substitute values.'),

('Aptitude', 'Medium', 'A shopkeeper sells an item at 20% profit. If the cost price is ₹500, what is the selling price?',
 'Profit = 20% of ₹500 = ₹100. Selling price = Cost price + Profit = ₹500 + ₹100 = ₹600.',
 'Tests profit and loss calculation.',
 ARRAY['profit', 'loss', 'percentage', 'cost price', 'selling price'],
 'Show step-by-step calculation and verify your answer.'),

('Aptitude', 'Hard', 'Three pipes A, B, and C can fill a tank in 6, 8, and 12 hours respectively. If all three are opened together, how long will it take to fill the tank?',
 'Rate of A = 1/6, Rate of B = 1/8, Rate of C = 1/12. Combined rate = 1/6 + 1/8 + 1/12 = 4/24 + 3/24 + 2/24 = 9/24 = 3/8. Time = 8/3 hours = 2 hours 40 minutes.',
 'Tests understanding of work-rate problems with LCM calculations.',
 ARRAY['pipes', 'rate', 'work', 'LCM', 'time'],
 'Find LCM of denominators to simplify fraction addition.');
