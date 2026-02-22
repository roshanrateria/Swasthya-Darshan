const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const Groq = require('groq-sdk');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'swasthya-darshan-secret-key-2026';

const connectionString = process.env.DATABASE_URL;
const cleanConnectionString = connectionString
    .replace('&channel_binding=require', '')
    .replace('sslmode=require', 'sslmode=verify-full');

const pool = new Pool({
    connectionString: cleanConnectionString,
    ssl: { rejectUnauthorized: false }
});

let dbInitialized = false;
async function initDb() {
    if (dbInitialized) return;
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT,
                age INTEGER,
                gender TEXT,
                weight FLOAT,
                height FLOAT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS health_records (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                patient_id TEXT,
                created_at TIMESTAMP WITH TIME ZONE,
                chief_complaints TEXT,
                symptoms JSONB,
                diagnosis TEXT,
                confidence FLOAT,
                treatment JSONB,
                follow_up TEXT,
                language TEXT
            );
            
            CREATE TABLE IF NOT EXISTS status_checks (
                id TEXT PRIMARY KEY,
                client_name TEXT,
                timestamp TIMESTAMP WITH TIME ZONE
            );

            CREATE TABLE IF NOT EXISTS assessments (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                assessment_type TEXT NOT NULL,
                input_data JSONB NOT NULL,
                result JSONB,
                risk_level TEXT,
                risk_score FLOAT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS ai_interactions (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                session_id TEXT,
                messages JSONB NOT NULL,
                language TEXT DEFAULT 'hi',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS user_advice (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                advice_type TEXT NOT NULL,
                title TEXT,
                content TEXT NOT NULL,
                context JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS meal_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                food_name TEXT NOT NULL,
                calories INTEGER NOT NULL,
                meal_type TEXT,
                image_url TEXT,
                healthier_alternative TEXT,
                calories_saved INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS daily_metrics (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                date DATE NOT NULL,
                total_calories INTEGER DEFAULT 0,
                calories_saved INTEGER DEFAULT 0,
                steps INTEGER DEFAULT 0,
                water_glasses INTEGER DEFAULT 0,
                sleep_hours FLOAT DEFAULT 0,
                streak_days INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        dbInitialized = true;
        console.log("Database initialized successfully");
    } catch (err) {
        console.error("Failed to initialize database", err);
    } finally {
        client.release();
    }
}

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const BHASHINI_API_KEY = process.env.BHASHINI_ULCA_API_KEY || '';
const BHASHINI_USER_ID = process.env.BHASHINI_USER_ID || '';
const BHASHINI_PIPELINE_ID = process.env.BHASHINI_PIPELINE_ID || '64392f96daac500b55c543cd';
const HF_API_TOKEN = process.env.HF_API_TOKEN || '';
const HF_BASE_URL = process.env.HF_BASE_URL || 'https://roar777-health-train.hf.space';

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

let bhashiniAuthCache = { authorization: null, endpoint: null, expires_at: null };

async function getBhashiniAuth() {
    const now = new Date();
    if (bhashiniAuthCache.authorization && bhashiniAuthCache.expires_at && now < bhashiniAuthCache.expires_at) {
        return { auth: bhashiniAuthCache.authorization, endpoint: bhashiniAuthCache.endpoint };
    }

    const response = await axios.post("https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline", {
        pipelineTasks: [{ taskType: "asr" }, { taskType: "translation" }, { taskType: "tts" }],
        pipelineRequestConfig: { pipelineId: BHASHINI_PIPELINE_ID }
    }, {
        headers: { "ulcaApiKey": BHASHINI_API_KEY, "userID": BHASHINI_USER_ID, "Content-Type": "application/json" }
    });

    const data = response.data;
    const auth = data?.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value || "";
    const endpoint = data?.pipelineInferenceAPIEndPoint?.callbackUrl || "https://dhruva-api.bhashini.gov.in/services/inference/pipeline";

    bhashiniAuthCache = { authorization: auth, endpoint, expires_at: new Date(now.getTime() + 60 * 60 * 1000) };
    return { auth, endpoint };
}

const ASR_SERVICE_IDS = { "hi": "ai4bharat/conformer-hi-gpu--t4", "en": "ai4bharat/conformer-en-gpu--t4", "ta": "ai4bharat/conformer-ta-gpu--t4", "te": "ai4bharat/conformer-te-gpu--t4", "bn": "ai4bharat/conformer-bn-gpu--t4", "mr": "ai4bharat/conformer-mr-gpu--t4" };
const TTS_SERVICE_IDS = { "hi": "ai4bharat/indic-tts-coqui-indo_aryan-gpu--t4", "en": "ai4bharat/indic-tts-coqui-misc-gpu--t4", "ta": "ai4bharat/indic-tts-coqui-dravidian-gpu--t4", "te": "ai4bharat/indic-tts-coqui-dravidian-gpu--t4", "bn": "ai4bharat/indic-tts-coqui-indo_aryan-gpu--t4", "mr": "ai4bharat/indic-tts-coqui-indo_aryan-gpu--t4" };

const app = express();
const corsOptions = { origin: true, methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'], credentials: true, optionsSuccessStatus: 204 };

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

app.use(async (req, res, next) => {
    await initDb();
    next();
});

const apiRouter = express.Router();

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ detail: "Authentication required" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ detail: "Invalid token" });
        req.user = user;
        next();
    });
}

function authenticateTokenOptional(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (!err) req.user = user;
            next();
        });
    } else {
        next();
    }
}

apiRouter.get("/", (req, res) => {
    res.json({ message: "SWASTHYA DARSHAN API - AI-Powered AYUSH Healthcare Platform" });
});

apiRouter.post("/auth/register", async (req, res) => {
    try {
        const { email, password, name, age, gender, weight, height } = req.body;
        if (!email || !password) return res.status(400).json({ detail: "Email and password required" });

        const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) return res.status(400).json({ detail: "Email already registered" });

        const password_hash = await bcrypt.hash(password, 10);
        const id = uuidv4();

        await pool.query(
            `INSERT INTO users (id, email, password_hash, name, age, gender, weight, height) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [id, email, password_hash, name, age, gender, weight, height]
        );

        const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id, email, name, age, gender, weight, height } });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ detail: "Registration failed" });
    }
});

apiRouter.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ detail: "Email and password required" });

        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) return res.status(401).json({ detail: "Invalid credentials" });

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ detail: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, age: user.age, gender: user.gender, weight: user.weight, height: user.height }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ detail: "Login failed" });
    }
});

apiRouter.get("/auth/profile", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT id, email, name, age, gender, weight, height, created_at FROM users WHERE id = $1", [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ detail: "User not found" });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ detail: "Failed to get profile" });
    }
});

apiRouter.put("/auth/profile", authenticateToken, async (req, res) => {
    try {
        const { name, age, gender, weight, height } = req.body;
        await pool.query(
            `UPDATE users SET name = $1, age = $2, gender = $3, weight = $4, height = $5, updated_at = NOW() WHERE id = $6`,
            [name, age, gender, weight, height, req.user.id]
        );
        res.json({ message: "Profile updated" });
    } catch (error) {
        res.status(500).json({ detail: "Failed to update profile" });
    }
});

apiRouter.get("/bhashini/auth", async (req, res) => {
    try {
        const { auth, endpoint } = await getBhashiniAuth();
        res.json({ authorization: auth, inference_endpoint: endpoint });
    } catch (error) {
        res.status(500).json({ detail: "Failed to get Bhashini authorization" });
    }
});

apiRouter.post("/bhashini/asr", async (req, res) => {
    try {
        const { auth, endpoint } = await getBhashiniAuth();
        const sourceLanguage = req.body.source_language || "hi";
        const serviceId = ASR_SERVICE_IDS[sourceLanguage] || "ai4bharat/conformer-hi-gpu--t4";
        const audioBase64 = req.body.audio_base64;

        const response = await axios.post(endpoint, {
            pipelineTasks: [{ taskType: "asr", config: { language: { sourceLanguage }, serviceId, audioFormat: "wav", samplingRate: 16000 } }],
            inputData: { audio: [{ audioContent: audioBase64 }] }
        }, { headers: { "Authorization": auth, "Content-Type": "application/json" } });

        const text = response.data?.pipelineResponse?.[0]?.output?.[0]?.source || "";
        res.json({ text, language: sourceLanguage });
    } catch (error) {
        res.status(500).json({ detail: "Speech recognition failed" });
    }
});

apiRouter.post("/bhashini/tts", async (req, res) => {
    try {
        const { auth, endpoint } = await getBhashiniAuth();
        const targetLanguage = req.body.target_language || "hi";
        const serviceId = TTS_SERVICE_IDS[targetLanguage] || "ai4bharat/indic-tts-coqui-indo_aryan-gpu--t4";
        const text = req.body.text;

        const response = await axios.post(endpoint, {
            pipelineTasks: [{ taskType: "tts", config: { language: { sourceLanguage: targetLanguage }, serviceId, gender: req.body.gender || "female" } }],
            inputData: { input: [{ source: text }] }
        }, { headers: { "Authorization": auth, "Content-Type": "application/json" }, timeout: 25000 });

        const audioContent = response.data?.pipelineResponse?.[0]?.audio?.[0]?.audioContent;
        if (!audioContent) throw new Error("Audio content missing");
        res.json({ audio_base64: audioContent, language: targetLanguage });
    } catch (error) {
        res.status(500).json({ detail: "Text to speech failed" });
    }
});

apiRouter.post("/bhashini/translate", async (req, res) => {
    try {
        const { auth, endpoint } = await getBhashiniAuth();
        const { source_language, target_language, text } = req.body;

        const response = await axios.post(endpoint, {
            pipelineTasks: [{ taskType: "translation", config: { language: { sourceLanguage: source_language, targetLanguage: target_language }, serviceId: "ai4bharat/indictrans-v2-all-gpu--t4" } }],
            inputData: { input: [{ source: text }] }
        }, { headers: { "Authorization": auth, "Content-Type": "application/json" } });

        const translated = response.data?.pipelineResponse?.[0]?.output?.[0]?.target || "";
        res.json({ original: text, translated, source_language, target_language });
    } catch (error) {
        res.status(500).json({ detail: "Translation failed" });
    }
});

async function callHuggingFaceApi(endpoint, payload) {
    const response = await axios.post(`${HF_BASE_URL}${endpoint}`, payload, {
        headers: { "Authorization": `Bearer ${HF_API_TOKEN}`, "Content-Type": "application/json" },
        timeout: 60000
    });
    return response.data;
}

async function saveAssessment(userId, assessmentType, inputData, result) {
    const id = uuidv4();
    const riskLevel = result?.risk_level || null;
    const riskScore = result?.risk_score || result?.confidence || null;

    await pool.query(
        `INSERT INTO assessments (id, user_id, assessment_type, input_data, result, risk_level, risk_score) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, userId, assessmentType, JSON.stringify(inputData), JSON.stringify(result), riskLevel, riskScore]
    );
    return id;
}

apiRouter.post('/predict/disease', authenticateTokenOptional, async (req, res) => {
    try {
        const userId = req.user?.id;
        const result = await callHuggingFaceApi('/disease_symptom', req.body.symptoms);

        if (userId && req.body.symptoms) {
            await saveAssessment(userId, 'disease_prediction', { symptoms: req.body.symptoms }, result);
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ detail: "Prediction service error" });
    }
});

apiRouter.post('/predict/mental-health', authenticateTokenOptional, async (req, res) => {
    try {
        const userId = req.user?.id;
        const result = await callHuggingFaceApi('/mental_health', req.body);

        if (userId) {
            await saveAssessment(userId, 'mental_health', req.body, result);
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ detail: "Prediction service error" });
    }
});

apiRouter.post('/predict/diabetes', authenticateTokenOptional, async (req, res) => {
    try {
        const userId = req.user?.id;
        const result = await callHuggingFaceApi('/diabetes', req.body);

        if (userId) {
            await saveAssessment(userId, 'diabetes', req.body, result);
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ detail: "Prediction service error" });
    }
});

apiRouter.post('/predict/heart', authenticateTokenOptional, async (req, res) => {
    try {
        const userId = req.user?.id;
        const result = await callHuggingFaceApi('/heart_disease', req.body);

        if (userId) {
            await saveAssessment(userId, 'heart_disease', req.body, result);
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ detail: "Prediction service error" });
    }
});

apiRouter.post('/predict/epidemic', authenticateTokenOptional, async (req, res) => {
    try {
        const result = await callHuggingFaceApi('/dengue', req.body.monthly_cases);
        res.json(result);
    } catch (error) {
        res.status(500).json({ detail: "Prediction service error" });
    }
});

apiRouter.post('/predict/treatment', authenticateTokenOptional, async (req, res) => {
    try {
        const userId = req.user?.id;
        const result = await callHuggingFaceApi('/ayurvedic_treatment', { symptoms_text: req.body.symptoms_text });

        if (userId && result) {
            const id = uuidv4();
            await pool.query(
                `INSERT INTO user_advice (id, user_id, advice_type, title, content, context) VALUES ($1, $2, $3, $4, $5, $6)`,
                [id, userId, 'treatment', result.primary_treatment || 'Ayurvedic Treatment', JSON.stringify(result), JSON.stringify({ symptoms_text: req.body.symptoms_text })]
            );
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ detail: "Prediction service error" });
    }
});

apiRouter.post('/explain', async (req, res) => {
    if (!groq) return res.status(500).json({ detail: "Chat service not configured" });

    const { input, output, type } = req.body;

    const prompt = `You are a health explainer for the SWASTHYA DARSHAN platform. 

The user has provided the following input to a health prediction system:
${JSON.stringify(input, null, 2)}

And received the following output:
${JSON.stringify(output, null, 2)}

Please explain this in simple, easy-to-understand language. Include:
1. What the result means
2. Why this is important
3. What the user should do next
4. Any lifestyle changes that might help

Keep it conversational and empathetic. Use the language requested (default: English).`;

    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: prompt }],
            temperature: 0.7,
            max_tokens: 500,
        });

        res.json({ explanation: completion.choices[0]?.message?.content || "" });
    } catch (error) {
        console.error("Explain Error:", error);
        res.status(500).json({ detail: "Failed to generate explanation" });
    }
});

const DOCTOR_SYSTEM_PROMPT = `You are Dr. AYUSH, an AI-powered Ayurvedic health consultant for the SWASTHYA DARSHAN platform. You are compassionate, knowledgeable, and speak naturally in the user's preferred language.

Your personality:
- Warm and empathetic, always greeting with "Namaste" (नमस्ते)
- Expert in Ayurveda, traditional Indian medicine, and modern healthcare
- Asks clarifying questions to understand symptoms better
- Explains medical concepts in simple terms
- References classical Ayurvedic texts when appropriate
- Always recommends consulting a real doctor for serious conditions

IMPORTANT - User Context:
- Always consider the user's profile information (age, gender, weight) when giving advice
- Ask about their medical history if relevant to the symptoms
- Consider any previous health assessments they've taken
- Tailor recommendations based on their body type (BMI) and age

Response guidelines:
- Keep responses concise but helpful (2-4 sentences typically)
- Use the language specified by the user
- Include Ayurvedic terms with translations in parentheses
- Show empathy for patient concerns
- End serious consultations with follow-up advice

If symptoms suggest a serious condition, clearly advise seeking immediate medical attention.`;

const LANGUAGE_INSTRUCTIONS = {
    "hi": "Respond in Hindi (हिंदी). Use Devanagari script.",
    "en": "Respond in English.",
    "ta": "Respond in Tamil (தமிழ்). Use Tamil script.",
    "te": "Respond in Telugu (తెలుగు). Use Telugu script.",
    "bn": "Respond in Bengali (বাংলা). Use Bengali script.",
    "mr": "Respond in Marathi (मराठी). Use Devanagari script."
};

apiRouter.post('/chat', authenticateTokenOptional, async (req, res) => {
    if (!groq) return res.status(500).json({ detail: "Chat service not configured" });

    const userId = req.user?.id;
    const sessionId = req.body.session_id || uuidv4();
    const langInstruction = LANGUAGE_INSTRUCTIONS[req.body.language] || LANGUAGE_INSTRUCTIONS["hi"];

    let userContext = "";
    if (userId) {
        const userResult = await pool.query("SELECT name, age, gender, weight, height FROM users WHERE id = $1", [userId]);
        if (userResult.rows.length > 0) {
            const u = userResult.rows[0];
            userContext = `\nCurrent User Profile:\n- Name: ${u.name || 'Not set'}\n- Age: ${u.age || 'Not set'}\n- Gender: ${u.gender || 'Not set'}\n- Weight: ${u.weight || 'Not set'} kg\n- Height: ${u.height || 'Not set'} cm`;
        }

        const assessmentsResult = await pool.query("SELECT assessment_type, risk_level, risk_score, created_at FROM assessments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5", [userId]);
        if (assessmentsResult.rows.length > 0) {
            userContext += "\nRecent Health Assessments:\n";
            assessmentsResult.rows.forEach(a => {
                userContext += `- ${a.assessment_type}: ${a.risk_level} (${Math.round((a.risk_score || 0) * 100)}%) on ${new Date(a.created_at).toLocaleDateString()}\n`;
            });
        }
    }

    let systemPrompt = `${DOCTOR_SYSTEM_PROMPT}\n\n${userContext}\n\nIMPORTANT: ${langInstruction}`;

    if (req.body.context && req.body.context !== 'diet_coaching') {
        systemPrompt += `\n\nContext from previous diagnosis:\n${req.body.context}`;
    } else if (req.body.context === 'diet_coaching') {
        systemPrompt = `You are an AI Dietician inside Swasthya Darshan.
${userContext}
IMPORTANT: ${langInstruction}

IMPORTANT: When the user asks to compare food options (e.g., "Should I eat X or Y?"), respond with VALID JSON in this EXACT format:
{
  "response_type": "comparison",
  "analysis": "Your detailed analysis here comparing both options in the user's language...",
  "options": [
    {
      "name": "First Food",
      "calories": 300,
      "is_healthier": true,
      "reason": "Why this is healthier"
    },
    {
      "name": "Second Food", 
      "calories": 500,
      "is_healthier": false,
      "reason": "Why this is less healthy"
    }
  ]
}

For general nutrition questions (not comparisons), respond with:
{
  "response_type": "general",
  "analysis": "Your helpful response here in the user's language..."
}

CRITICAL: Return ONLY valid JSON, no markdown code blocks, no extra text.`;
    }

    const messages = [{ role: "system", content: systemPrompt }];
    if (req.body.messages) {
        req.body.messages.forEach(m => messages.push({ role: m.role, content: m.content }));
    }

    const groqParams = {
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
    };
    if (req.body.context === 'diet_coaching') {
        groqParams.response_format = { type: 'json_object' };
    }

    try {
        const completion = await groq.chat.completions.create(groqParams);

        const responseText = completion.choices[0]?.message?.content || "";

        if (userId) {
            const id = uuidv4();
            await pool.query(
                `INSERT INTO ai_interactions (id, user_id, session_id, messages, language) VALUES ($1, $2, $3, $4, $5)`,
                [id, userId, sessionId, JSON.stringify(req.body.messages || []), req.body.language || 'hi']
            );
        }

        res.json({ response: responseText, language: req.body.language || "hi", session_id: sessionId });
    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(500).json({ detail: "Chat service error" });
    }
});

apiRouter.get('/assessments', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM assessments WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ detail: "Failed to get assessments" });
    }
});

apiRouter.delete('/assessments/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query("DELETE FROM assessments WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
        res.json({ message: "Assessment deleted" });
    } catch (error) {
        res.status(500).json({ detail: "Failed to delete assessment" });
    }
});

apiRouter.get('/interactions', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM ai_interactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", [req.user.id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ detail: "Failed to get interactions" });
    }
});

apiRouter.delete('/interactions/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query("DELETE FROM ai_interactions WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
        res.json({ message: "Interaction deleted" });
    } catch (error) {
        res.status(500).json({ detail: "Failed to delete interaction" });
    }
});

apiRouter.get('/advices', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM user_advice WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ detail: "Failed to get advices" });
    }
});

apiRouter.delete('/advices/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query("DELETE FROM user_advice WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
        res.json({ message: "Advice deleted" });
    } catch (error) {
        res.status(500).json({ detail: "Failed to delete advice" });
    }
});

apiRouter.post('/health-records', authenticateTokenOptional, async (req, res) => {
    try {
        const doc = {
            id: uuidv4(),
            user_id: req.user?.id,
            patient_id: `ABHA-${uuidv4().replace(/-/g, '').substring(0, 10).toUpperCase()}`,
            created_at: new Date().toISOString(),
            chief_complaints: req.body.chief_complaints,
            symptoms: req.body.symptoms || [],
            diagnosis: req.body.diagnosis,
            confidence: req.body.confidence || 0.0,
            treatment: req.body.treatment || {},
            follow_up: req.body.follow_up || "3 days or if symptoms worsen",
            language: req.body.language || "hi"
        };

        await pool.query(
            `INSERT INTO health_records (id, user_id, patient_id, created_at, chief_complaints, symptoms, diagnosis, confidence, treatment, follow_up, language) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [doc.id, doc.user_id, doc.patient_id, doc.created_at, doc.chief_complaints, JSON.stringify(doc.symptoms), doc.diagnosis, doc.confidence, JSON.stringify(doc.treatment), doc.follow_up, doc.language]
        );
        res.json(doc);
    } catch (error) {
        res.status(500).json({ detail: "Database error" });
    }
});

apiRouter.get('/health-records', authenticateTokenOptional, async (req, res) => {
    try {
        let query = "SELECT * FROM health_records";
        let params = [];

        if (req.user?.id) {
            query = "SELECT * FROM health_records WHERE user_id = $1 ORDER BY created_at DESC";
            params = [req.user.id];
        } else {
            query += " ORDER BY created_at DESC LIMIT 100";
        }

        const result = await pool.query(query, params);
        const records = result.rows.map(r => ({
            ...r,
            symptoms: typeof r.symptoms === 'string' ? JSON.parse(r.symptoms) : r.symptoms || [],
            treatment: typeof r.treatment === 'string' ? JSON.parse(r.treatment) : r.treatment || {}
        }));
        res.json(records);
    } catch (error) {
        res.status(500).json({ detail: "Database error" });
    }
});

apiRouter.get('/health-records/:record_id', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM health_records WHERE id = $1", [req.params.record_id]);
        if (result.rows.length === 0) return res.status(404).json({ detail: "Health record not found" });
        const r = result.rows[0];
        r.symptoms = typeof r.symptoms === 'string' ? JSON.parse(r.symptoms) : r.symptoms || [];
        r.treatment = typeof r.treatment === 'string' ? JSON.parse(r.treatment) : r.treatment || {};
        res.json(r);
    } catch (error) {
        res.status(500).json({ detail: "Database error" });
    }
});

apiRouter.post('/status', async (req, res) => {
    try {
        const doc = { id: uuidv4(), client_name: req.body.client_name, timestamp: new Date().toISOString() };
        await pool.query("INSERT INTO status_checks (id, client_name, timestamp) VALUES ($1, $2, $3)", [doc.id, doc.client_name, doc.timestamp]);
        res.json(doc);
    } catch (error) {
        res.status(500).json({ detail: "Database error" });
    }
});

apiRouter.get('/status', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM status_checks ORDER BY timestamp DESC LIMIT 1000");
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ detail: "Database error" });
    }
});

apiRouter.get('/languages', (req, res) => {
    res.json({
        languages: [
            { code: "hi", name: "हिंदी", english_name: "Hindi" },
            { code: "en", name: "English", english_name: "English" },
            { code: "ta", name: "தமிழ்", english_name: "Tamil" },
            { code: "te", name: "తెలుగు", english_name: "Telugu" },
            { code: "bn", name: "বাংলা", english_name: "Bengali" },
            { code: "mr", name: "मराठी", english_name: "Marathi" }
        ]
    });
});

// Meal Logging APIs
apiRouter.post('/meals', authenticateToken, async (req, res) => {
    try {
        const { food_name, calories, meal_type, image_url, healthier_alternative, calories_saved } = req.body;
        const id = uuidv4();

        await pool.query(
            `INSERT INTO meal_logs (id, user_id, food_name, calories, meal_type, image_url, healthier_alternative, calories_saved) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [id, req.user.id, food_name, calories, meal_type, image_url, healthier_alternative, calories_saved]
        );

        // Update daily metrics with BOTH consumed calories and saved calories
        const today = new Date().toISOString().split('T')[0];
        const dmId = uuidv4();
        await pool.query(`
            INSERT INTO daily_metrics (id, user_id, date, calories_saved, total_calories, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (user_id, date) DO UPDATE SET
                calories_saved = daily_metrics.calories_saved + $4,
                total_calories = COALESCE(daily_metrics.total_calories, 0) + $5,
                updated_at = NOW()
        `, [dmId, req.user.id, today, calories_saved || 0, calories || 0]);

        res.json({ id, food_name, calories, meal_type, calories_saved });
    } catch (error) {
        console.error("Meal Log Error:", error);
        res.status(500).json({ detail: "Failed to log meal" });
    }
});

apiRouter.get('/meals', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM meal_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ detail: "Failed to get meals" });
    }
});

apiRouter.get('/daily-metrics', authenticateToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const result = await pool.query(
            "SELECT * FROM daily_metrics WHERE user_id = $1 AND date = $2",
            [req.user.id, today]
        );

        if (result.rows.length === 0) {
            // Create new daily metrics
            const id = uuidv4();
            await pool.query(
                "INSERT INTO daily_metrics (id, user_id, date) VALUES ($1, $2, $3)",
                [id, req.user.id, today]
            );
            return res.json({ date: today, total_calories: 0, calories_saved: 0, steps: 0, water_glasses: 0, sleep_hours: 0, streak_days: 0 });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ detail: "Failed to get daily metrics" });
    }
});

apiRouter.put('/daily-metrics', authenticateToken, async (req, res) => {
    try {
        const { steps, water_glasses, sleep_hours, total_calories } = req.body;
        const today = new Date().toISOString().split('T')[0];

        await pool.query(`
            INSERT INTO daily_metrics (user_id, date, steps, water_glasses, sleep_hours, total_calories, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (user_id, date) DO UPDATE SET
                steps = COALESCE($3, daily_metrics.steps),
                water_glasses = COALESCE($4, daily_metrics.water_glasses),
                sleep_hours = COALESCE($5, daily_metrics.sleep_hours),
                total_calories = COALESCE($6, daily_metrics.total_calories),
                updated_at = NOW()
        `, [req.user.id, today, steps, water_glasses, sleep_hours, total_calories]);

        res.json({ message: "Daily metrics updated" });
    } catch (error) {
        res.status(500).json({ detail: "Failed to update daily metrics" });
    }
});

app.use('/api', apiRouter);

const PORT = process.env.PORT || 8000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

module.exports = app;
