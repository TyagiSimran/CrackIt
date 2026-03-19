🚀 CrackIt – AI-Powered Interview Preparation Platform

CrackIt is an intelligent interview preparation system that simulates real-world interview environments using AI.
It helps candidates practice interviews, receive instant feedback, and improve performance with data-driven insights.

💡 Problem Statement

Many candidates struggle with:

Lack of real interview practice

No structured feedback

Difficulty preparing for different interview types

👉 CrackIt solves this by providing AI-driven mock interviews + personalized evaluation

🎯 Key Highlights (ATS Optimized)

Built a full-stack AI application using FastAPI, React, and Supabase

Designed RESTful APIs for interview sessions, authentication, and analytics

Implemented JWT-based authentication & role-based access control

Integrated AI (Groq API) for automated answer evaluation and scoring

Developed resume parsing system to generate personalized questions

Optimized database queries using PostgreSQL indexing

Built interactive dashboard using charts for performance tracking

🛠️ Tech Stack
Backend

FastAPI (High-performance APIs)

PostgreSQL (Supabase)

JWT Authentication

Groq AI API

PyPDF2 (Resume Parsing)

Frontend

React.js + Vite

Tailwind CSS

React Router

Axios

Recharts (Data Visualization)

🏗️ System Architecture
Frontend (React)
      ↓
API Layer (FastAPI)
      ↓
Database (Supabase PostgreSQL)
      ↓
AI Evaluation (Groq API)
🔥 Core Features
🔐 Authentication System

Secure login/register using JWT

Role-based access (User/Admin)

🧠 AI Interview Engine

Real-time mock interviews

AI-generated scoring & feedback

Multiple interview categories:

Technical

HR

Behavioral

System Design

Aptitude

Resume-based

📄 Resume Intelligence

Upload PDF resumes

Extract skills & projects

Generate personalized interview questions

📊 Performance Dashboard

Track scores & progress

Visual analytics using charts

🛠 Admin Controls

Manage question bank

Control platform data

📂 Folder Structure
backend/
  ├── main.py
  ├── routers/
  ├── models/
  ├── utils/

frontend/
  ├── src/
  ├── components/
  ├── pages/
  ├── context/
⚙️ Setup Instructions
1️⃣ Clone Repo
git clone https://github.com/your-username/crackit.git
cd crackit
2️⃣ Backend Setup
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
3️⃣ Frontend Setup
cd frontend
npm install
npm run dev
🗄️ Database Design

users → authentication & roles

questions → categorized interview questions

interview_sessions → session tracking

interview_responses → answers + AI feedback

resumes → parsed resume data

🔐 Security Features

JWT token-based authentication

Password hashing using bcrypt

Protected API routes

CORS configuration

📈 Impact

Improves interview readiness through real-time feedback

Helps users identify strengths & weaknesses

Provides structured preparation strategy

🚀 Future Enhancements

🎤 Voice-based interviews

🤖 Advanced LLM-based evaluation

📱 Mobile-first UI

🌍 Multi-language support

👨‍💻 Author

Vishal Chaturvedi
Simran Tyagi 


⭐ Why This Project Stands Out

Combines AI + Full Stack Development

Solves a real-world problem (interview preparation)

Demonstrates backend, frontend, and system design skills

Production-ready architecture
