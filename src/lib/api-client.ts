export interface HevySet {
    index: number;
    type: string;
    weight_kg?: number;
    reps?: number;
    distance_meters?: number;
    duration_seconds?: number;
    rpe?: number;
}

export interface HevyExercise {
    title: string;
    notes?: string;
    sets: HevySet[];
}

export interface HevyWorkout {
    id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    exercises: HevyExercise[];
}

export interface SimplifiedWorkout {
    date: string;
    startTime: string;
    title: string;
    durationMinutes: number;
    exercises: {
        name: string;
        sets: string[];
    }[];
}

export interface AnalysisResponse {
    summary: string;
    trends: string[];
    neglect: string[];
    recommendations: string[];
}

export interface HevyExerciseTemplate {
    id: string;
    title: string;
    type: string;
    primary_muscle_group?: string;
}

export interface HevyRoutineFolder {
    id: string;
    title: string;
    index: number;
}

export interface GeneratedWorkout {
    title: string;
    exercises: {
        exercise_template_id: string; // inferred from name matching
        exercise_name: string; // for AI to output
        sets: {
            type: "normal" | "warmup" | "failure" | "dropset";
            weight_kg?: number;
            reps?: number;
            rpe?: number;
        }[];
    }[];
}

// Hevy Client
export async function fetchWorkouts(apiKey: string, page: number = 1, limit: number = 100) {
    console.log(`[HevyAPI] Fetching workouts page ${page} with limit ${limit}`);
    const response = await fetch(`https://api.hevyapp.com/v1/workouts?page=${page}&pageSize=${limit}`, {
        headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[HevyAPI] Error: ${response.status} ${response.statusText} - Body: ${errorText}`);
        if (response.status === 401) throw new Error("Invalid Hevy API Key");
        throw new Error(`Hevy API Error: ${response.statusText} (${errorText})`);
    }

    const json = await response.json();
    return json;
}

export async function getRoutineFolders(apiKey: string) {
    const response = await fetch('https://api.hevyapp.com/v1/routine_folders', {
        headers: { 'api-key': apiKey },
    });
    if (!response.ok) throw new Error("Failed to fetch folders");
    return await response.json();
}

export async function createRoutineFolder(apiKey: string, title: string) {
    const response = await fetch('https://api.hevyapp.com/v1/routine_folders', {
        method: 'POST',
        headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ routine_folder: { title } }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create folder: ${response.status} ${errorText}`);
    }
    return await response.json();
}

export async function getExerciseTemplates(apiKey: string, page: number = 1, pageSize: number = 100) {
    // For MVP we just fetch page 1 (most popular/recent). Full sync would be heavy.
    const response = await fetch(`https://api.hevyapp.com/v1/exercise_templates?page=${page}&pageSize=${pageSize}`, {
        headers: { 'api-key': apiKey },
    });
    if (!response.ok) throw new Error("Failed to fetch exercises");
    return await response.json();
}

export async function getTopExerciseTemplates(apiKey: string): Promise<HevyExerciseTemplate[]> {
    // Fetch first 3 pages (300 exercises) to give AI enough context
    try {
        const promises = [1, 2, 3].map(page =>
            getExerciseTemplates(apiKey, page, 100)
                .then(res => res.exercise_templates || [])
                .catch(err => {
                    console.warn(`Failed to fetch exercise page ${page}`, err);
                    return [];
                })
        );
        const results = await Promise.all(promises);
        return results.flat();
    } catch (e) {
        console.error("Error fetching top exercises", e);
        return [];
    }
}

export async function createRoutine(apiKey: string, routine: any) {
    const response = await fetch('https://api.hevyapp.com/v1/routines', {
        method: 'POST',
        headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ routine: routine }),
    });
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to create routine: ${err}`);
    }
    return await response.json();
}

/**
 * Fetches all user workouts recursively.
 * Note: Uses sequential paging to respect API limits.
 */
export async function fetchAllWorkouts(apiKey: string): Promise<any[]> {
    let allWorkouts: any[] = [];
    let page = 1;
    const pageSize = 10;
    let hasMore = true;

    while (hasMore) {
        try {
            const data = await fetchWorkouts(apiKey, page, pageSize);
            const workouts = data.workouts || [];

            allWorkouts = allWorkouts.concat(workouts);

            if (workouts.length < pageSize) {
                hasMore = false;
            } else {
                page++;
            }
        } catch (e) {
            console.error("[HevyAPI] fetchAll loop failed:", e);
            throw e;
        }
    }

    return allWorkouts;
}

// Data Transformer
export function transformWorkouts(data: any): SimplifiedWorkout[] {
    // If data is array (from fetchAll), use it directly. If object (from single fetch), use .workouts
    const workouts = Array.isArray(data) ? data : (data.workouts || []);

    return workouts.map((workout: any) => {
        const start = new Date(workout.start_time).getTime();
        const end = new Date(workout.end_time).getTime();
        const minutes = Math.round((end - start) / 1000 / 60);

        return {
            date: new Date(workout.start_time).toISOString().split('T')[0],
            startTime: workout.start_time,
            title: workout.title,
            durationMinutes: minutes > 0 ? minutes : 0,
            exercises: workout.exercises.map((ex: any) => ({
                name: ex.title,
                sets: ex.sets.map((s: any) => {
                    const parts = [];
                    if (s.weight_kg) parts.push(`${s.weight_kg}kg`);
                    if (s.reps) parts.push(`${s.reps} reps`);
                    if (s.distance_meters) parts.push(`${s.distance_meters}m`);
                    if (s.duration_seconds) parts.push(`${s.duration_seconds}s`);
                    if (s.rpe) parts.push(`@RPE${s.rpe}`);
                    return parts.join(' x ');
                }),
            })),
        };
    });
}

// OpenAI Client
export async function analyzeWorkouts(apiKey: string, workouts: SimplifiedWorkout[], philosophy?: string, coachPrompt?: string): Promise<AnalysisResponse> {
    const prompt = `
    Analyze the following recent workout history (last ${workouts.length} sessions).
    
    Data Format:
    List of workouts with Date, Title, and Exercises (Name + Sets).
    
    ${philosophy ? `
    TRAINING CONTEXT / PHILOSOPHY:
    The user is following this specific plan or philosophy. Ensure your analysis evaluates progress based on THESE specific principles:
    "${philosophy}"
    ` : ''}

    Your Goal:
    Act as the specific coach described in the system prompt. Provide specific, actionable, and data-backed analysis.
    Avoid generic advice like "sleep more" or "eat protein" unless specifically relevant to a crash in performance.
    
    Output Format:
    Return strictly a JSON object with this schema:
    {
      "summary": "A 1-2 sentence high-level summary of recent performance. Match the persona's tone.",
      "trends": ["List of 2-3 specific progressive overload observations. CITE DATA (e.g. 'Bench Press increased from 80kg to 85kg')."],
      "neglect": ["List of 2-3 muscle groups or movement patterns missing. BE SPECIFIC (e.g. 'No vertical pulling logic found')."],
      "recommendations": ["List of 2-3 actionable tips. INCLUDE EXAMPLES (e.g. 'Add Romanian Deadlifts 3x10 to address hamstring neglect')."]
    }
    
    CRITICAL RULES:
    1. SPECIFICITY: Never say "work on legs". Say "Add Squats or Lunges".
    2. EXAMPLES: If you recommend an exercise, give a suggested set/rep range (e.g. "3x12").
    3. DATA: When mentioning trends, quote the exact numbers from the history to prove you read it.
    4. CONTEXT: If the user is only doing upper body, assume they might be skipping legs, but don't hallucinate if the history is short.
    5. PHILOSOPHY: If a philosophy is provided above, frame ALL recommendations within that style.
    
    Do NOT include markdown formatting. Just the raw JSON string.

    Workouts:
    ${JSON.stringify(workouts.slice(0, 20), null, 2)} 
  `;

    const systemPrompt = coachPrompt || 'You are HevySpotter, an elite AI strength coach. You only speak in JSON.';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt + " You must return valid JSON." },
                { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" },
            max_tokens: 1000,
        }),
    });

    if (!response.ok) {
        if (response.status === 401) throw new Error("Invalid OpenAI API Key");
        throw new Error(`OpenAI API Error: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    try {
        return JSON.parse(content);
    } catch (e) {
        throw new Error("Failed to parse AI analysis response");
    }
}



export async function generateAIWorkout(apiKey: string, analysis: AnalysisResponse, availableExercises: HevyExerciseTemplate[], philosophy?: string): Promise<GeneratedWorkout> {

    // Create a simplified list of exercises for the AI to choose from
    const exerciseList = availableExercises.map(e => ({ id: e.id, name: e.title })).slice(0, 300); // Limit context

    const prompt = `
    Based on the following training analysis, design a COMPLETE structured workout routine.
    
    ANALYSIS SUMMARY: "${analysis.summary}"
    NEGLECTED AREAS: ${JSON.stringify(analysis.neglect)}
    RECOMMENDATIONS: ${JSON.stringify(analysis.recommendations)}
    ${philosophy ? `USER CONTEXT / PHILOSOPHY: "${philosophy}"` : ''}
    
    Your Task:
    Create a workout that specifically target these neglected areas and implements the recommendations.
    
    Constraints:
    1. You MUST select exercises from the PROVIDED LIST of available exercises below. Do not invent exercises.
    2. SETS & REPS:
       - If USER CONTEXT mentions a style, match it.
       - OTHERWISE: Default to 3-4 sets of 8-12 reps.
       - IMPORTANT: The 'sets' array in your JSON output MUST contain 3 separate objects (e.g. [{}, {}, {}]). Do NOT output a single object with "3 sets" text.
    3. Give the workout a cool, descriptive title (e.g. "Leg Destruction AI").
    
    AVAILABLE EXERCISES (JSON map):
    ${JSON.stringify(exerciseList)}
    
    Output Format (JSON):
    {
      "title": "Workout Title",
      "exercises": [
        {
          "exercise_template_id": "Must match 'id' from available list",
          "exercise_name": "Must match 'name' from available list",
          "sets": [
             { "type": "normal", "reps": 10, "weight_kg": 20 } 
          ]
        }
      ]
    }
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are an expert workout programmer. Return JSON only.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" },
        }),
    });

    if (!response.ok) throw new Error(`OpenAI API Error: ${response.statusText}`);

    const result = await response.json();
    try {
        return JSON.parse(result.choices[0].message.content);
    } catch (e) {
        throw new Error("Failed to parse AI workout");
    }
}
