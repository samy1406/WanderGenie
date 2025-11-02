# WanderGenie Application Flowchart

This document outlines the architecture and data flow of the WanderGenie application, a personalized travel itinerary planner powered by AI.
<img width="8105" height="2602" alt="Flowchart" src="https://github.com/user-attachments/assets/0668bc8e-2040-481f-8b6c-f507ed69d9ee" />

### Explanation of Components

1.  **Client-Side (React & Next.js)**
    *   **`TripPlanner`**: The main UI component that manages the overall state.
    *   **`ItineraryForm`**: Collects user input for the destination, duration, interests, travel preferences, and departure/arrival times.
    *   **`Display Area`**: The right-hand side of the UI that shows the generated plan. It renders either a placeholder or the `ItineraryDisplay` and `TravelOptions` components.
    *   **`ItineraryDisplay`**: Renders the structured trip plan, including the daily accordion, weather, estimated cost, and the "Start/End Journey" button.
    *   **`SuggestionModal`**: An interactive dialog for the "Smart Suggestion" feature. It takes user feedback and presents AI-generated alternatives with options to accept or decline.

2.  **Server Actions (Backend Logic)**
    *   These are server-side functions that are securely called from the client. They act as the bridge between the UI and the AI flows.
    *   **`handleGenerateItinerary` & `handleGetTravelOptions`**: These are called in parallel when the form is submitted to speed up the response time.
    *   **`handleAdjustItinerary`**: This action is called by the `SuggestionModal` and passes user feedback to the AI.
    *   **`handleGetCurrentWeather`**: A specific action to fetch weather data for the destination to display on the UI.

3.  **Genkit AI Flows (AI Core)**
    *   These flows define the AI's tasks and prompts. They are responsible for communicating with the underlying language model (e.g., Gemini).
    *   **`Generate Itinerary Flow`**: Instructs the AI to create a detailed, structured JSON output for the trip plan, including a new `estimatedCost` object based on the user's travel preference.
    *   **`Get Travel Options Flow`**: Prompts the AI to generate realistic travel options.
    *   **`Adjust Itinerary Flow`**: The "smartest" flow. It uses the `Weather Tool` to get real-time data and combines it with user feedback to suggest relevant alternatives.

4.  **Genkit Tools (External Data)**
    *   **`Weather Tool`**: A custom tool that allows the AI to fetch external data (in this case, simulated real-time weather). This is crucial for making context-aware, intelligent suggestions. This tool makes the AI an "agent" that can do more than just respond to text.

This architecture ensures a clean separation of concerns, making the application scalable, maintainable, and highly interactive.
