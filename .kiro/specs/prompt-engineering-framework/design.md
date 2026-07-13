# Technical Design: 5-Stage Prompt Engineering Framework Fix

## Problem Summary

The screening/chat flow in `app/screening/page.tsx` does not follow the 5-stage framework properly:

1. **Stage 1 skipped**: The initial AI message jumps directly into PHQ-9 questions without first building rapport ("Hello, welcome. How have you been feeling emotionally over the last two weeks?")
2. **Post-assessment transition**: After PHQ-9, the system skips Stage 1 and starts at Stage 2 ("exploration"), missing the conversational bridge
3. **Stage detection logic** in `/api/chat-ai/route.ts` uses message count thresholds that may not match natural conversation flow

## Solution Design

### Approach: Conversational Wrapper Around PHQ-9

Instead of jumping into PHQ-9 immediately, the flow becomes:

1. **Stage 1 (Rapport)**: AI greets student warmly, asks how they've been feeling
2. **PHQ-9 Phase**: Student clicks "Start Check-in" or the system transitions naturally into the questionnaire
3. **Stage 2–5 (Post-PHQ-9 Chat)**: After assessment, the AI continues through exploration → stressors → risk → intervention using the existing `/api/chat-ai` backend

### Changes Required

#### 1. `app/screening/page.tsx` (Frontend)

- Change initial message to use Stage 1 rapport prompt
- Add a "rapport" phase before the PHQ-9 starts
- When student responds to rapport question, transition to PHQ-9 with a bridge message
- After PHQ-9 + NLP analysis completes, continue with Stage 2 (exploration) as before

#### 2. `/api/chat-ai/route.ts` (Backend) — Minor tweaks

- Improve `detectStageFromHistory` to be less aggressive with message-count transitions
- Ensure fallback responses match the exact 5-stage prompts from the framework

### Data Flow

```
Student opens /screening
  → AI shows Stage 1 rapport message
  → Student responds (free text)
  → System transitions to PHQ-9 questions
  → Student completes PHQ-9
  → NLP analysis runs
  → AI transitions to Stage 2 chat (exploration)
  → AI progressively moves through stages 3, 4, 5
```

### Unchanged Behavior

- PHQ-9 scoring logic remains identical
- Crisis keyword detection remains active at all times
- NLP analysis pipeline unaffected
- Counsellor messaging and dashboard pages untouched
- Crisis page unaffected
