# Tasks: 5-Stage Prompt Engineering Framework Fix

## Task 1: Update screening page initial flow to include Stage 1 rapport
- [x] Change initial message from PHQ-9 question to rapport greeting
- [x] Add "rapport" phase before "phq9" phase  
- [x] Handle student's response to rapport message → transition to PHQ-9
- [x] Add bridge message when transitioning from rapport to PHQ-9

## Task 2: Refine stage detection in chat-ai backend
- [x] Adjust message count thresholds for more natural transitions
- [x] Ensure Stage 4 (risk) is reached when appropriate indicators exist
- [x] Verify fallback responses use exact framework prompts

## Task 3: Verify build passes
- [x] Run `next build` to confirm no TypeScript or compilation errors
