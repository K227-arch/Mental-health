# Selfcare Hub — System Design & Development Documentation

## 1. System Overview

Selfcare Hub is an AI-powered student mental health support web application designed to provide university students with accessible, confidential mental health screening, AI-driven conversational support, and secure counsellor communication. The system integrates multiple AI modules including Natural Language Processing (NLP), Large Language Models (LLMs), a Prompt Engineering Engine, an Explainable AI Module, and a Suicide Detection Engine.

---

## 2. Technologies & Languages Used

### 2.1 Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.2.9 | React-based full-stack framework (App Router) |
| React | 19.2.4 | UI component library |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 4.x | Utility-first CSS framework |
| Framer Motion | 12.x | Page animations and transitions |
| Three.js / React Three Fiber | 0.185 | 3D background visualizations |
| Recharts | 3.x | Data visualization charts |
| Lucide React | 1.x | Icon library |

### 2.2 Backend & APIs
| Technology | Purpose |
|---|---|
| Next.js API Routes | Serverless backend endpoints |
| InsForge SDK | Backend-as-a-Service (PostgreSQL database, authentication, storage) |
| OpenAI SDK (openai package) | Interface to LLM providers |
| Groq API (llama-3.1-8b-instant) | Primary LLM for AI chat responses |
| OpenRouter API (GPT-4o-mini) | Fallback LLM provider |
| HuggingFace Inference API | NLP models for sentiment, emotion, transcription |

### 2.3 AI/ML Models
| Model | Provider | Purpose |
|---|---|---|
| llama-3.1-8b-instant | Groq | Conversational AI, mental health reasoning |
| GPT-4o-mini | OpenRouter | NLP classification, screening analysis |
| openai/whisper-large-v3 | HuggingFace | Voice-to-text transcription |
| trpakov/vit-face-expression | HuggingFace | Facial emotion detection from video |
| cardiffnlp/twitter-roberta-base-sentiment | HuggingFace | Sentiment analysis |
| rabiaqayyum/autotrain-mental-health-analysis | HuggingFace | Mental health text classification |
| facebook/bart-large-mnli | HuggingFace | Zero-shot crisis classification |

### 2.4 Infrastructure & Hosting
| Service | Purpose |
|---|---|
| Vercel | Frontend hosting and serverless deployment |
| InsForge (PostgreSQL) | Database, authentication, file storage |
| GitHub | Version control and CI/CD trigger |
| Custom domain (selfcare.ug) | Production URL |

### 2.5 Development Tools
| Tool | Purpose |
|---|---|
| Visual Studio Code (VS Code) | Primary IDE |
| Kiro (AI-powered IDE) | AI-assisted development environment |
| Git | Version control |
| npm | Package manager |
| Vercel CLI | Deployment management |
| Node.js (v20+) | JavaScript runtime |

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│  Next.js App (React 19) + Tailwind CSS + Three.js           │
├─────────────────────────────────────────────────────────────┤
│                    NEXT.JS SERVER                            │
│  API Routes (Serverless Functions)                           │
│  ├── /api/chat-ai (LLM + Prompt Engineering)                │
│  ├── /api/screening/analyze (NLP Module)                    │
│  ├── /api/transcribe (Whisper STT)                          │
│  ├── /api/analyze-video (Facial + Speech AI)                │
│  ├── /api/auth/* (Authentication)                           │
│  ├── /api/messages (Counsellor Chat)                        │
│  └── /api/notifications (Alert System)                      │
├─────────────────────────────────────────────────────────────┤
│                    AI LAYER                                  │
│  ├── Groq (LLM - Primary)                                   │
│  ├── OpenRouter (LLM - Fallback)                            │
│  └── HuggingFace (NLP Models)                               │
├─────────────────────────────────────────────────────────────┤
│                    DATA LAYER                                │
│  InsForge (PostgreSQL + Auth + Storage)                      │
│  ├── student_profiles                                       │
│  ├── screening_results                                      │
│  ├── counsellor_sessions                                    │
│  ├── messages                                               │
│  ├── notifications                                          │
│  ├── mood_entries                                           │
│  └── screening-media (file storage bucket)                  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 AI Module Architecture

```
┌────────────────────────────────────────────────┐
│           PROMPT ENGINEERING ENGINE             │
│  5-Stage Conversational Framework              │
│  Stage 1: Rapport Building                     │
│  Stage 2: Emotional Exploration                │
│  Stage 3: Stressor Identification              │
│  Stage 4: Risk Assessment                      │
│  Stage 5: Intervention Planning                │
├────────────────────────────────────────────────┤
│           LARGE LANGUAGE MODEL (LLM)           │
│  Understanding responses, emotional analysis   │
│  Mental health reasoning, response generation  │
├────────────────────────────────────────────────┤
│           NLP MODULE                           │
│  Sentiment analysis, keyword extraction        │
│  Emotion detection, context interpretation     │
├────────────────────────────────────────────────┤
│           EXPLAINABLE AI MODULE                │
│  Transparent explanations, evidence provision  │
│  Supporting counsellor decision-making         │
├────────────────────────────────────────────────┤
│           SUICIDE DETECTION ENGINE             │
│  Self-harm detection, crisis identification    │
│  Emergency escalation, Q9 auto-flagging        │
└────────────────────────────────────────────────┘
```

---

## 4. Installation & Setup Process

### 4.1 Prerequisites
- Node.js v20 or higher
- npm (Node Package Manager)
- Git
- VS Code or Kiro IDE
- InsForge account (for backend services)
- Groq API key (for LLM)
- HuggingFace API key (for NLP models)

### 4.2 Step-by-Step Installation

**Step 1: Clone the Repository**
```bash
git clone https://github.com/K227-arch/Mental-health.git
cd Mental-health
```

**Step 2: Install Dependencies**
```bash
npm install
```

**Step 3: Configure Environment Variables**
Create a `.env.local` file with the following:
```env
NEXT_PUBLIC_INSFORGE_URL=https://your-project.region.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-anon-key
INSFORGE_API_KEY=your-service-key
GROQ_API_KEY=gsk_your-groq-key
HF_READ_API_KEY=hf_your-huggingface-key
OPENROUTER_API_KEY=sk-or-your-openrouter-key
```

**Step 4: Run Development Server**
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

**Step 5: Build for Production**
```bash
npm run build
```

**Step 6: Deploy to Vercel**
```bash
vercel --prod
```

### 4.3 Database Setup
The InsForge backend automatically provisions the following tables:
- `student_profiles` — User accounts and metadata
- `screening_results` — PHQ-9 assessment scores and responses
- `counsellor_sessions` — Active counselling sessions
- `messages` — Chat messages between students and counsellors
- `notifications` — System alerts and AI analysis notifications
- `mood_entries` — Daily mood tracking data

---

## 5. System Flow & User Journey

### 5.1 Student Flow

```
Landing Page → Sign Up (with consent) → Dashboard
     ↓
Daily Check-in Page:
     ↓
[First Visit / After 2 Weeks]
Stage 1: Rapport Building (AI greeting)
     ↓
Stage 2: PHQ-9 Assessment (9 questions + Q10 functional impairment)
     ↓
NLP Analysis runs (sentiment, classification, risk indicators)
     ↓
Results sent to counsellor (not shown to student)
AI Recommendation shown to student
     ↓
Transition to AI Chat (5-stage framework continues)
     ↓
[Return Visits Within 2 Weeks]
Direct to AI Chat (PHQ-9 returns after 14 days)
```

### 5.2 Counsellor Flow

```
Sign In → Counsellor Dashboard
     ↓
Students Page:
  - View all student cards with full AI analysis
  - PHQ-9 scores, risk indicators, flagged messages
  - NLP analysis, crisis alerts, AI recommendations
     ↓
Chat Page:
  - Real-time messaging with students
  - Flagged message alerts
     ↓
Analytics Page:
  - Population-level insights
  - Risk distribution, trend analysis
```

### 5.3 Crisis Detection Flow

```
Student sends message with crisis keywords
     ↓
Suicide Detection Engine activates
     ↓
Immediate crisis response shown to student
(Helpline numbers, safety resources)
     ↓
Critical notification sent to counsellor
     ↓
Q9 (self-harm question) auto-flagged if score ≥ 1
     ↓
Counsellor receives immediate follow-up alert
```

---

## 6. Data Collection & Model Training

### 6.1 Current Approach (Pre-trained Models)

The system currently uses pre-trained models from established providers:

1. **Groq/OpenRouter LLMs** — Pre-trained on massive text corpora, fine-tuned for instruction-following. Used for conversational AI without custom training.

2. **HuggingFace Models** — Publicly available models trained on:
   - Mental health classification datasets (rabiaqayyum/autotrain)
   - Sentiment analysis corpora (Twitter/social media data)
   - Speech recognition datasets (Whisper — trained on 680,000 hours of audio)
   - Facial expression datasets (FER2013, AffectNet)

### 6.2 How Data Would Be Collected for Custom Model Training

**Phase 1: Data Collection**

1. **Screening Response Data**
   - PHQ-9 responses from consenting students (anonymized)
   - Free-text inputs during assessments
   - Functional impairment ratings
   - Timestamp and frequency patterns

2. **Conversational Data**
   - AI chat transcripts (anonymized, with explicit consent)
   - Student-counsellor message history
   - Crisis keyword occurrences and context
   - Conversation stage progression patterns

3. **Behavioral Data**
   - Mood tracking entries over time
   - App usage patterns (frequency, session duration)
   - Feature engagement metrics
   - Screening completion rates

4. **Multimodal Data**
   - Voice recordings (with consent) for tone analysis
   - Video check-ins for facial expression patterns
   - Text sentiment patterns across sessions

**Phase 2: Data Preprocessing**

1. **Anonymization** — Remove all personally identifiable information
2. **Labeling** — Counsellors annotate conversations with:
   - Risk level (Minimal/Moderate/High/Critical)
   - Dominant emotion categories
   - Appropriate intervention recommendations
3. **Cleaning** — Remove noise, normalize text, handle missing data
4. **Augmentation** — Generate synthetic examples for underrepresented categories

**Phase 3: Model Training**

1. **Fine-tuning LLM for Mental Health Context**
   ```
   Base Model: LLaMA 3.1 8B
   Training Data: Annotated counsellor-student conversations
   Method: LoRA (Low-Rank Adaptation) fine-tuning
   Objective: Generate empathetic, stage-appropriate responses
   Evaluation: BLEU score, counsellor-rated quality, safety checks
   ```

2. **Custom NLP Classification Model**
   ```
   Architecture: DistilBERT or RoBERTa
   Training Data: Labeled screening responses + risk levels
   Classes: Minimal, Mild, Moderate, Moderately Severe, Severe
   Metrics: F1 score, precision, recall per class
   ```

3. **Crisis Detection Model**
   ```
   Architecture: Binary classifier (transformer-based)
   Training Data: Flagged messages + safe messages
   Output: Crisis probability score (0-1)
   Threshold: Alert counsellor if score > 0.4
   ```

4. **Sentiment/Emotion Model**
   ```
   Architecture: Multi-label classifier
   Training Data: Student messages labeled with emotions
   Classes: Anxiety, Depression, Anger, Fear, Sadness, Joy, Neutral
   Application: Real-time emotion tracking during conversations
   ```

**Phase 4: Model Deployment**

1. Export trained models to ONNX or TensorFlow format
2. Deploy to HuggingFace Inference Endpoints or custom server
3. Integrate via API calls from Next.js backend
4. A/B test against pre-trained models for quality comparison
5. Continuous monitoring and retraining pipeline

### 6.3 Ethical Considerations for Data Collection

- **Informed Consent** — Students must explicitly consent before data is used for research
- **Right to Withdraw** — Students can withdraw consent at any time
- **Anonymization** — All data is stripped of identifiers before training
- **IRB Approval** — Institutional Review Board approval required
- **Data Minimization** — Collect only what's necessary for model improvement
- **Secure Storage** — End-to-end encryption for all sensitive data
- **Regular Audits** — Periodic review of model fairness and bias

---

## 7. Key Features Implementation

### 7.1 5-Stage Prompt Engineering Framework
The system guides AI-student interactions through five clinically-informed stages:
- Each stage has specific system prompts that instruct the LLM
- Stage transitions are detected automatically based on conversation depth
- The framework ensures comprehensive mental health assessment

### 7.2 PHQ-9 Screening with NLP Analysis
- Standardized 9-item questionnaire with frequency-based options
- Question 10 (functional impairment) added after Q9
- Automatic Q9 flagging (self-harm) when score ≥ 1
- LLM-powered NLP analysis generates severity classification, sentiment breakdown, and risk indicators
- Results sent to counsellor only (not shown to student)

### 7.3 Real-time Crisis Detection
- 14+ crisis keywords monitored in every message
- Immediate crisis response with helpline numbers
- Critical notification to counsellor within seconds
- Emergency escalation protocol

### 7.4 Multimodal Input Support
- Text chat (primary)
- Voice recording with Whisper transcription
- Video recording with facial emotion analysis
- File upload to counsellor

### 7.5 Chat Message Persistence
- AI chat messages saved to localStorage
- Assessment progress saved to sessionStorage (resume after navigation)
- Chat history sidebar (ChatGPT-style) for reviewing past conversations
- 2-week PHQ-9 cycle with chat as default between assessments

### 7.6 Counsellor Decision Support
- Full AI analysis on student cards (PHQ-9 score, NLP classification, risk indicators)
- Flagged messages with crisis keyword detection
- AI-recommended actions per student
- Real-time notification system

---

## 8. Deployment Pipeline

### 8.1 Development Workflow
```
Local Development (VS Code / Kiro)
     ↓
Git Commit & Push to GitHub
     ↓
Vercel Auto-Deploy (triggered by push)
     ↓
Build (Next.js production build)
     ↓
Deploy to Edge Network
     ↓
Available at https://www.selfcare.ug
```

### 8.2 Environment Variables (Production)
All sensitive keys are stored as Vercel Environment Variables:
- Database connection strings
- API keys for LLM providers
- Authentication secrets
- Storage bucket credentials

### 8.3 Domain Configuration
- Primary: `https://www.selfcare.ug`
- Vercel: `https://mindcare-ai-mu.vercel.app`
- SSL/TLS certificates auto-provisioned by Vercel

---

## 9. Security & Privacy

- **Authentication** — Email/password + Google OAuth via InsForge
- **Session Management** — HTTP-only cookies with refresh tokens
- **Route Protection** — Proxy middleware redirects unauthenticated users
- **Data Encryption** — All data encrypted in transit (HTTPS) and at rest
- **Consent** — Students must consent before using the platform
- **Anonymization** — Student IDs anonymized in counsellor view (optional)
- **GDPR Compliance** — Right to delete, data portability

---

## 10. Testing & Quality Assurance

### 10.1 Tests Performed
- API endpoint testing (all 18 endpoints verified)
- Authentication flow testing (sign-up, sign-in, sign-out, protection)
- AI module testing (crisis detection, stage progression, NLP analysis)
- Static asset serving (images, icons)
- Mobile responsiveness (bottom nav, input accessibility)
- Cross-browser compatibility

### 10.2 Build Verification
- TypeScript compilation (type safety)
- Next.js production build (47 pages compiled)
- Vercel deployment verification
- API response validation

---

## 11. Future Enhancements

1. **Custom Model Training** — Fine-tune LLMs on collected student data
2. **Wearable Integration** — Connect with smartwatches for physiological data
3. **Group Therapy Sessions** — AI-facilitated group support
4. **Predictive Analytics** — Early warning system for at-risk students
5. **Multi-University Deployment** — Scalable architecture for multiple institutions
6. **Offline Support** — PWA with service worker for offline access
7. **Longitudinal Analysis** — Track student progress over semesters/years

---

*Document prepared for: Selfcare Hub Student Mental Health Support System*
*Version: 1.0*
*Date: July 2026*
*Platform: https://www.selfcare.ug*
