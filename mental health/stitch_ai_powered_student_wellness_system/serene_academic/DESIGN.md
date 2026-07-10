---
name: Serene Academic
colors:
  surface: '#f8f9fd'
  surface-dim: '#d8dadd'
  surface-bright: '#f8f9fd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f7'
  surface-container: '#eceef1'
  surface-container-high: '#e6e8ec'
  surface-container-highest: '#e1e2e6'
  on-surface: '#191c1f'
  on-surface-variant: '#41474e'
  inverse-surface: '#2e3134'
  inverse-on-surface: '#eff1f4'
  outline: '#72787f'
  outline-variant: '#c1c7cf'
  surface-tint: '#316289'
  primary: '#074469'
  on-primary: '#ffffff'
  primary-container: '#2a5c82'
  on-primary-container: '#a5d4ff'
  inverse-primary: '#9ccbf7'
  secondary: '#006a64'
  on-secondary: '#ffffff'
  secondary-container: '#9deee5'
  on-secondary-container: '#0c6e68'
  tertiary: '#40413e'
  on-tertiary: '#ffffff'
  tertiary-container: '#585855'
  on-tertiary-container: '#d0ceca'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cde5ff'
  primary-fixed-dim: '#9ccbf7'
  on-primary-fixed: '#001d32'
  on-primary-fixed-variant: '#124a6f'
  secondary-fixed: '#a0f1e8'
  secondary-fixed-dim: '#84d5cc'
  on-secondary-fixed: '#00201e'
  on-secondary-fixed-variant: '#00504b'
  tertiary-fixed: '#e4e2dd'
  tertiary-fixed-dim: '#c8c6c2'
  on-tertiary-fixed: '#1b1c19'
  on-tertiary-fixed-variant: '#474744'
  background: '#f8f9fd'
  on-background: '#191c1f'
  surface-variant: '#e1e2e6'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style
The design system is built to balance clinical reliability with empathetic warmth, specifically tailored for university students and mental health professionals. The brand personality is calm, supportive, and grounded, aiming to reduce anxiety and lower the barrier to seeking help.

The visual style follows a **Modern Corporate** approach with a **Minimalist** lean. It prioritizes clarity and whitespace to ensure the user never feels overwhelmed by information. Subtle high-quality typography and soft layering create a safe digital environment that feels professional yet deeply human.

## Colors
The palette uses a foundation of **Deep Sea Blue** (Primary) to establish trust and authority, complemented by **Soft Teal** (Secondary) to promote serenity and healing. 

**Warm Sand** (Tertiary) is used for large background surfaces to avoid the cold, clinical feel of pure white, providing a sense of comfort. An **Emergency Red** (#D93025) is reserved strictly for high-priority crisis support actions to ensure immediate visibility without inducing panic.

## Typography
This design system utilizes **Inter** for all roles to maintain a systematic, legible, and professional appearance. The tight apertures and tall x-height of Inter ensure maximum readability in dense therapeutic text or data-heavy professional dashboards.

Headlines use medium-to-semibold weights with slight negative letter-spacing for a modern, grounded feel. Body text maintains a generous line height to promote a relaxed reading pace, essential for sensitive mental health content.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a focus on generous "safe zones." The philosophy is to provide ample "breathing room" to keep the user’s cognitive load low.

- **Desktop:** 12-column grid with 24px gutters and 80px side margins.
- **Tablet:** 8-column grid with 24px gutters and 48px side margins.
- **Mobile:** 4-column grid with 16px gutters and 16px side margins.

Horizontal spacing between sections (XL) is intentionally large to clearly separate distinct topics and prevent the interface from feeling cluttered or urgent.

## Elevation & Depth
Depth is communicated through **Tonal Layers** rather than heavy shadows. The background uses the tertiary warm neutral, while active surfaces (cards, chat bubbles) use pure white to appear "lifted."

When shadows are necessary for interactive elements like buttons or modals, they are **Ambient Shadows**: extremely diffused, low-opacity (10%), and tinted with the primary blue color to maintain a soft, integrated look. This prevents the "floating" feeling of traditional material design and keeps the UI grounded.

## Shapes
The design system employs **Rounded** geometry (8px base radius). This avoids the harshness of sharp corners while maintaining more structure than fully pill-shaped "playful" designs. This balance is critical for establishing a tone that is approachable for students but serious enough for clinical use.

## Components
- **Buttons:** Primary buttons are solid Blue-800 with 8px rounding. The "Crisis Support" button is a persistent, high-contrast Red element, often floating or fixed in a utility bar.
- **Conversational UI:** User chat bubbles are Teal with white text, positioned on the right. System/Therapist bubbles are White with Dark Grey text, positioned on the left. Bubbles use a "Soft" 12px radius with a sharp corner on the tail side.
- **Data Visualization:** Mood tracking line charts use smooth "natural" curves rather than jagged angles. The line should be the Primary Blue, with a soft Secondary Teal gradient fill underneath.
- **Cards:** White backgrounds with a subtle 1px border (#E2E8F0). No shadows unless the card is hoverable/interactive.
- **Inputs:** Large, clear hit areas with a 2px focus ring in the Primary Blue color. Labels are always visible and positioned above the field.
- **Chips:** Used for mood tags or session categories; they use a low-opacity version of the Secondary Teal to remain subtle and non-distracting.