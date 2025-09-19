# WanderGenie Application Flowchart

This document outlines the architecture and data flow of the WanderGenie application, a personalized travel itinerary planner powered by AI.

```mermaid
graph TD
    subgraph Client-Side (React & Next.js)
        A[TripPlanner Component] --> B[ItineraryForm];
        A --> C{Display Area};
        B -- User Input --> D[Submit Button];
    end

    subgraph Server Actions
        E[handleGenerateItinerary];
        F[handleGetTravelOptions];
        G[handleAdjustItinerary];
        H[handleGetCurrentWeather];
    end

    subgraph Genkit AI Flows
        I[Generate Itinerary Flow];
        J[Get Travel Options Flow];
        K[Adjust Itinerary Flow];
    end
    
    subgraph Genkit Tools
        L[Weather Tool];
    end

    D -- Form Data --> E;
    D -- Form Data --> F;

    E --> I;
    F --> J;

    I -- Structured JSON (Plan + Cost) --> M[ItineraryDisplay];
    J -- Travel Options JSON --> N[TravelOptions Display];

    subgraph Itinerary Display
        M -- Renders --> O[Accordion Plan];
        M -- Renders --> P[Start/End Journey Button];
        M -- Fetches Weather --> H;
        H --> L;
        L -- Weather Data --> H;
        H -- Weather Data --> M;
        M -- Displays --> Q[Weather Info & Map];
        M -- Renders --> V[Estimated Cost];
    end

    P -- on click --> R{Journey Started?};
    R -- Yes --> S[Show SuggestionModal Button];

    S -- on click --> T[SuggestionModal];
    T -- User Feedback --> G;
    G -- Itinerary & Feedback --> K;
    K -- uses --> L;
    L -- Real-time Weather --> K;
    K -- AI Suggestion --> T;
    
    T -- Displays --> U[Accept/Decline Buttons];
    U -- on Accept --> M;


    C --> M;
    C --> N;

    style A fill:#D6EAF8,stroke:#3498DB,stroke-width:2px
    style B fill:#E8DAEF,stroke:#8E44AD,stroke-width:2px
    style C fill:#D1F2EB,stroke:#1ABC9C,stroke-width:2px
    style D fill:#FDEDEC,stroke:#E74C3C,stroke-width:2px

    style E fill:#FEF9E7,stroke:#F1C40F,stroke-width:2px
    style F fill:#FEF9E7,stroke:#F1C40F,stroke-width:2px
    style G fill:#FEF9E7,stroke:#F1C40F,stroke-width:2px
    style H fill:#FEF9E7,stroke:#F1C40F,stroke-width:2px

    style I fill:#FADBD8,stroke:#C0392B,stroke-width:2px
    style J fill:#FADBD8,stroke:#C0392B,stroke-width:2px
    style K fill:#FADBD8,stroke:#C0392B,stroke-width:2px
    style L fill:#D2B4DE,stroke:#7D3C98,stroke-width:2px
    
    style M fill:#D5F5E3,stroke:#2ECC71,stroke-width:2px
    style N fill:#D5F5E3,stroke:#2ECC71,stroke-width:2px
    style T fill:#F5CBA7,stroke:#E67E22,stroke-width:2px
    style V fill:#D5F5E3,stroke:#2ECC71,stroke-width:2px
```

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
