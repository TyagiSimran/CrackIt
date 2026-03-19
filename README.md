# 🚀 CrackIt – AI-Powered Interview Preparation Platform

> 🎯 Practice. Improve. Crack Interviews with AI.

CrackIt is an intelligent interview preparation system that simulates real-world interview environments using AI.  
It helps candidates practice interviews, receive instant feedback, and improve performance using data-driven insights.

---

## 📦 💡 Problem Statement

❌ No real interview practice  
❌ Lack of structured feedback  
❌ Difficulty preparing for multiple interview types  

👉 Solution:  
✔ AI-driven mock interviews  
✔ Personalized evaluation  
✔ Resume-based question generation  

---

## 🎯 Key Highlights (ATS Friendly)

✔ Full-stack AI application (FastAPI + React + Supabase)  
✔ RESTful API design for scalable backend  
✔ JWT Authentication + Role-based Access Control  
✔ AI integration (Groq API) for answer evaluation  
✔ Resume parsing system (PDF → skills extraction)  
✔ PostgreSQL query optimization using indexing  
✔ Interactive dashboard with analytics  

---

## 🛠️ Tech Stack

### 🔙 Backend
- FastAPI (High-performance APIs)  
- PostgreSQL (Supabase)  
- JWT Authentication  
- Groq AI API  
- PyPDF2 (Resume Parsing)  

### 🔜 Frontend
- React.js + Vite  
- Tailwind CSS  
- React Router  
- Axios  
- Recharts (Data Visualization)  

---

## 🏗️ System Architecture

┌────────────────────┐  
│   Frontend (React) │  
└─────────┬──────────┘  
          ↓  
┌────────────────────┐  
│   FastAPI Backend  │  
└─────────┬──────────┘  
          ↓  
┌────────────────────┐  
│ Supabase PostgreSQL│  
└─────────┬──────────┘  
          ↓  
┌────────────────────┐  
│   Groq AI Engine   │  
└────────────────────┘  

---

## 🔥 Core Features

### 🔐 Authentication System
✔ Secure login/register (JWT)  
✔ Role-based access (User/Admin)  

### 🧠 AI Interview Engine
✔ Real-time mock interviews  
✔ AI scoring & feedback  
✔ Interview categories:
- Technical  
- HR  
- Behavioral  
- System Design  
- Aptitude  
- Resume-based  

### 📄 Resume Intelligence
✔ Upload PDF resume  
✔ Extract skills & projects  
✔ Generate personalized questions  

### 📊 Performance Dashboard
✔ Track scores & progress  
✔ Visual analytics (charts)  

### 🛠 Admin Panel
✔ Manage question bank  
✔ Control system data  

---

## 📂 Folder Structure

CrackIt/  
├── backend/  
│   ├── main.py  
│   ├── routers/  
│   ├── models/  
│   └── utils/  
│  
├── frontend/  
│   ├── src/  
│   ├── components/  
│   ├── pages/  
│   └── context/  

---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository
git clone https://github.com/your-username/crackit.git  
cd crackit  

### 2️⃣ Backend Setup
cd backend  
pip install -r requirements.txt  
uvicorn main:app --reload  

### 3️⃣ Frontend Setup
cd frontend  
npm install  
npm run dev  

---

## 🗄️ Database Design

users → authentication & roles  
questions → interview questions  
interview_sessions → session tracking  
interview_responses → answers + AI feedback  
resumes → parsed resume data  

---

## 🔐 Security Features

✔ JWT-based authentication  
✔ Password hashing (bcrypt)  
✔ Protected API routes  
✔ CORS configuration  

---

## 📈 Impact

✔ Improves interview readiness  
✔ Provides real-time feedback  
✔ Identifies strengths & weaknesses  
✔ Enables structured preparation  

---

## 🚀 Future Enhancements

🎤 Voice-based interviews  
🤖 Advanced LLM evaluation  
📱 Mobile-first UI  
🌍 Multi-language support  

---

## 👨‍💻 Author

**Vishal Chaturvedi**  
MCA | Full Stack Developer | AI Enthusiast  

---

## ⭐ Why This Project Stands Out

✔ AI + Full Stack integration  
✔ Real-world problem solving  
✔ Strong backend + frontend architecture  
✔ Production-ready design  

---

## 📌 Recruiter Note

✔ Backend architecture & API design  
✔ AI integration in real applications  
✔ Full-stack development skills  
✔ Database design & optimization  
