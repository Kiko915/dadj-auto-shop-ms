# NLP Features — DADJ Auto Shop Management System

This document describes the Natural Language Processing (NLP) features integrated into the system. Both features are powered by **Groq** running the **LLaMA 3.3 70B Versatile** model, chosen for its fast inference speed and strong instruction-following capability.

---

## Overview

| Feature | Input Method | Output | Where |
|---|---|---|---|
| Voice Order Assistant | Speech (microphone) | Customer name, vehicle, service items | New Service Order page |
| AI Diagnostic Advisor | Text (typed complaint) | Diagnoses, recommended service items | New Service Order page |

Both features share the same downstream effect: they pre-fill the service order items builder so staff spend less time typing and more time on actual work.

---

## Feature 1 — Voice Order Assistant

### What it does

Staff speak a service order description in natural language. The system transcribes the speech, sends it to the AI, and extracts structured data that is applied directly to the form.

### Example

> *"New job for Juan dela Cruz's Honda Civic. Replace brake pads, 4 sets at 500 pesos each. Two hours of labor at 350 pesos per hour."*

The AI returns:
```json
{
  "customerName": "Juan dela Cruz",
  "vehicleDescription": "Honda Civic",
  "items": [
    { "type": "PART",  "name": "Brake pads", "quantity": 4, "price": 500 },
    { "type": "LABOR", "name": "Labor",       "quantity": 2, "price": 350 }
  ]
}
```

After tapping **Apply to Form**:
- The system searches the customer database for "Juan dela Cruz" using a name-splitting algorithm (searches last name, then filters by first name)
- The best matching vehicle is selected using a scoring heuristic (make, model, plate, year)
- All items are pushed into the order builder

### How it works

```
Microphone (Capacitor SpeechRecognition)
  → partialResults events update live transcript
  → listeningState: stopped fires after final result
  → stopListening() calls POST /api/ai/parse-order
  → Groq LLaMA 3.3 extracts structured JSON
  → applyVoiceOrder() fills customer, vehicle, items
```

### Technical notes

- Uses `@capacitor-community/speech-recognition` for on-device speech capture on Android
- A `stoppingInProgress` mutex prevents double-stop race conditions
- All Capacitor calls are wrapped in `withTimeout()` to prevent hangs if Android stops recognition internally
- API requests use `?t=Date.now()` cache-busting to prevent Android WebView from serving stale cached responses
- Customer search handles Filipino name formats (e.g. "Juan Dela Cruz" → searches "Dela Cruz", filters by "Juan")

### API Endpoint

```
POST /api/ai/parse-order
Authorization: Bearer <token>

Body: { "transcript": "..." }

Response: {
  "parsed": {
    "customerName": "...",
    "vehicleDescription": "...",
    "items": [{ "type": "PART|LABOR", "name": "...", "quantity": 1, "price": 0 }]
  }
}
```

---

## Feature 2 — AI Diagnostic Advisor

### What it does

Staff type a customer's complaint in plain English. The AI analyzes the symptoms like an experienced mechanic and returns likely diagnoses ranked by confidence, plus a recommended list of service items (parts and labor) with estimated prices in PHP.

### Example

**Input:**
```
Vehicle: 2019 Toyota Vios
Complaint: Car vibrates at high speed and pulls to the left when braking.
           Grinding noise from the front wheels.
```

**Output:**
```json
{
  "diagnoses": [
    {
      "issue": "Worn brake pads / warped rotor",
      "confidence": "high",
      "explanation": "Grinding noise + pulling under braking is a classic sign of metal-on-metal contact and uneven rotor wear."
    },
    {
      "issue": "Wheel imbalance",
      "confidence": "medium",
      "explanation": "High-speed vibration that disappears at lower speeds typically points to an out-of-balance wheel."
    },
    {
      "issue": "Loose or worn wheel bearing",
      "confidence": "low",
      "explanation": "A rumbling/grinding that changes with steering input can indicate a failing wheel bearing."
    }
  ],
  "items": [
    { "type": "LABOR", "name": "Brake inspection",          "description": "Full front/rear check", "quantity": 1, "price": 300 },
    { "type": "PART",  "name": "Brake pads (front)",        "description": "Semi-metallic",         "quantity": 1, "price": 900 },
    { "type": "LABOR", "name": "Brake pad replacement",     "description": "Front axle",            "quantity": 2, "price": 400 },
    { "type": "LABOR", "name": "Wheel balancing & rotation","description": "All four wheels",       "quantity": 1, "price": 500 }
  ]
}
```

The diagnoses are displayed as expandable cards ordered by confidence. Staff can review them and tap **Apply to Order** to push the suggested items directly into the order builder, then adjust prices and quantities as needed.

### How it works

```
Staff types complaint + optional vehicle info
  → POST /api/ai/diagnose
  → Groq LLaMA 3.3 reasons about symptoms as a mechanic
  → Returns diagnoses[] + items[] as JSON
  → DiagnosticAdvisor.vue renders results in expandable cards
  → Apply to Order emits items into EstimateItemBuilder
```

### Why LLM for this task

Symptom-to-diagnosis mapping is not a keyword search problem. The same symptom ("grinding noise") can indicate brake pads, CV joints, wheel bearings, or a loose heat shield depending on context (speed, steering input, brake application). An LLM can reason across these conditions in natural language the same way an experienced mechanic would, without requiring a hand-crafted decision tree.

### API Endpoint

```
POST /api/ai/diagnose
Authorization: Bearer <token>

Body: {
  "complaint": "Car vibrates at high speed...",
  "vehicleInfo": "2019 Toyota Vios"   (optional)
}

Response: {
  "result": {
    "diagnoses": [
      { "issue": "...", "confidence": "high|medium|low", "explanation": "..." }
    ],
    "items": [
      { "type": "PART|LABOR", "name": "...", "description": "...", "quantity": 1, "price": 0 }
    ]
  }
}
```

---

## Shared Infrastructure

### AI Provider

Both features use **Groq** (`groq-sdk`) with the `llama-3.3-70b-versatile` model.

- Groq was chosen over Google Gemini due to superior availability (Gemini returns 503 errors under high demand)
- `response_format: { type: 'json_object' }` enforces structured JSON output — no markdown fences or prose to strip
- Temperature is kept low (0.1–0.2) so outputs are deterministic and consistent

### Server setup (`server/routes/ai.js`)

```js
import Groq from 'groq-sdk'

const groqClient = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null
```

The client is instantiated once at module load. If `GROQ_API_KEY` is missing, all endpoints return `503 AI service unavailable` immediately without attempting a network call.

### Environment variables required

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Required for Voice Order Assistant and Diagnostic Advisor |
| `GEMINI_API_KEY` | Required for the Dashboard AI Insight card only |

---

## UI/UX Design Decisions

- Both features use a **bottom sheet** pattern on mobile — consistent with native app conventions and avoids covering the form content
- The Diagnostic Advisor uses an **amber color scheme** to visually distinguish it from the Voice Assistant (blue/primary)
- Diagnoses are **expandable accordion cards** so the most important information (issue name + confidence) is always visible without cluttering the screen
- Prices from the Diagnostic Advisor are labelled as *AI estimates* — the system never writes them as final without staff review
- Example prompts are provided in the Diagnostic Advisor UI so users understand what kind of input produces good results

---

## Limitations and Known Behaviors

- AI price estimates are based on general Philippine auto shop market rates trained into the model. They should always be reviewed before submitting an order.
- The Voice Order Assistant requires an active microphone permission on the device. On Android, this is requested on first use via Capacitor.
- The name-matching algorithm for customers works best when the spoken name matches the database spelling closely. If no match is found, the user is prompted to select manually.
- Both features require an internet connection (Groq API calls are server-side).
