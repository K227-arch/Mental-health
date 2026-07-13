# Bugfix Requirements Document

## Introduction

The MindCare AI mental health app is designed to guide students through structured AI-student interactions using a 5-stage Prompt Engineering framework. The framework should progressively guide students from initial rapport building through emotional exploration, stressor identification, risk assessment, and finally intervention planning. Currently, the AI chat interactions (primarily in the screening page and the messaging system) do not follow this structured 5-stage progression. The screening page uses a fixed PHQ-9 questionnaire format with no conversational stage management, and the messaging API simply stores messages without any AI-driven conversational flow. This means students are not receiving the intended therapeutic conversational experience that progressively assesses their mental health state.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a student initiates an AI chat session THEN the system jumps directly into PHQ-9 questionnaire questions without establishing rapport or asking about the student's general emotional state over the last two weeks

1.2 WHEN a student responds to the AI during a chat session THEN the system does not track which conversational stage the student is in, and does not progress through stages (Rapport Building → Emotional Exploration → Stressor Identification → Risk Assessment → Intervention Planning)

1.3 WHEN a student provides emotional context in their responses THEN the system does not follow up with stage-appropriate prompts to explore emotions deeper (Stage 2) or identify contributing stressors (Stage 3)

1.4 WHEN a student's responses indicate potential risk factors THEN the system does not deliver the structured risk assessment question ("Have you had thoughts of harming yourself or feeling that life is not worth living?") as part of Stage 4

1.5 WHEN a student completes the emotional assessment stages THEN the system does not offer structured intervention planning (Stage 5) asking whether the student would like assistance from a counsellor or mental health professional

### Expected Behavior (Correct)

2.1 WHEN a student initiates an AI chat session THEN the system SHALL begin with Stage 1 (Rapport Building) by greeting the student and asking: "Hello, welcome. How have you been feeling emotionally over the last two weeks?"

2.2 WHEN a student responds to the Stage 1 rapport prompt THEN the system SHALL progress to Stage 2 (Emotional Exploration) by asking: "What emotions have been most dominant recently?" and SHALL track the current conversation stage

2.3 WHEN a student responds to the Stage 2 emotional exploration prompt THEN the system SHALL progress to Stage 3 (Stressor Identification) by asking: "What factors do you think have contributed to these feelings?"

2.4 WHEN a student responds to the Stage 3 stressor identification prompt THEN the system SHALL progress to Stage 4 (Risk Assessment) by asking: "Have you had thoughts of harming yourself or feeling that life is not worth living?"

2.5 WHEN a student responds to the Stage 4 risk assessment prompt THEN the system SHALL progress to Stage 5 (Intervention Planning) by asking: "Would you like assistance from a counsellor or mental health professional?"

2.6 WHEN the system is at any stage of the 5-stage framework THEN the system SHALL maintain and persist the current stage state so that conversation continuity is preserved across messages

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a student completes the PHQ-9 questionnaire through the existing screening page THEN the system SHALL CONTINUE TO calculate and display the PHQ-9 score and severity level correctly

3.2 WHEN a student's message contains crisis keywords (e.g., "suicide", "self-harm", "want to die") THEN the system SHALL CONTINUE TO flag the message, trigger notifications to counsellors, and provide immediate crisis resources

3.3 WHEN the AI analysis endpoint receives a text for sentiment/emotion/crisis analysis THEN the system SHALL CONTINUE TO return accurate NLP analysis results using HuggingFace models

3.4 WHEN a counsellor sends a message to a student through the counsellor chat THEN the system SHALL CONTINUE TO deliver the message normally without interference from the AI framework stages

3.5 WHEN a student accesses the dashboard THEN the system SHALL CONTINUE TO display mood tracking, wellness milestones, and session information correctly

---

## Bug Condition (Formal Specification)

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type ChatInteraction
  OUTPUT: boolean
  
  // Returns true when a student is in an AI-guided chat session
  // and the system should be following the 5-stage framework
  RETURN X.isAIChatSession = true AND X.senderRole = "student"
END FUNCTION
```

### Property Specification (Fix Checking)

```pascal
// Property: Fix Checking - 5-Stage Framework Progression
FOR ALL X WHERE isBugCondition(X) DO
  session ← getSession(X.sessionId)
  currentStage ← session.currentStage
  
  ASSERT currentStage IN {1, 2, 3, 4, 5}
  ASSERT aiResponse(X) = stagePrompt(currentStage + 1) OR (currentStage = 5 AND aiResponse(X) = completionMessage)
  ASSERT session.currentStage' = min(currentStage + 1, 5)
END FOR
```

### Preservation Goal

```pascal
// Property: Preservation Checking - Existing features unaffected
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```

This ensures that PHQ-9 scoring, crisis keyword detection, NLP analysis, counsellor messaging, and dashboard functionality remain unchanged for all non-AI-chat-session interactions.
