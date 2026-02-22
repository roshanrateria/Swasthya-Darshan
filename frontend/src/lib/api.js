import axios from 'axios';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://ayushapp-backend.vercel.app';
const API = `${BACKEND_URL}/api`;

const getToken = () => localStorage.getItem('swasthya_token');

const api = axios.create({
    baseURL: API,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth APIs
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getProfile = () => api.get('/auth/profile');
export const updateProfile = (data) => api.put('/auth/profile', data);

// Bhashini APIs
export const getBhashiniAuth = () => api.get('/bhashini/auth');

export const speechToText = (audioBase64, sourceLanguage = 'hi', audioFormat = 'audio/wav') =>
    api.post('/bhashini/asr', {
        audio_base64: audioBase64,
        source_language: sourceLanguage,
        audio_format: audioFormat,
    });

export const textToSpeech = (text, targetLanguage = 'hi', gender = 'female') =>
    api.post('/bhashini/tts', {
        text,
        target_language: targetLanguage,
        gender,
    });

export const translateText = (text, sourceLanguage, targetLanguage) =>
    api.post('/bhashini/translate', {
        text,
        source_language: sourceLanguage,
        target_language: targetLanguage,
    });

// Health Prediction APIs
export const predictDisease = (symptoms) =>
    api.post('/predict/disease', { symptoms });

export const predictMentalHealth = (data) =>
    api.post('/predict/mental-health', data);

export const predictDiabetes = (data) =>
    api.post('/predict/diabetes', data);

export const predictHeartDisease = (data) =>
    api.post('/predict/heart', data);

export const predictEpidemic = (monthlyCases) =>
    api.post('/predict/epidemic', { monthly_cases: monthlyCases });

export const getAyurvedicTreatment = (symptomsText) =>
    api.post('/predict/treatment', { symptoms_text: symptomsText });

// Chat API
export const chatWithDoctor = (messages, language = 'hi', context = null, sessionId = null) =>
    api.post('/chat', { messages, language, context, session_id: sessionId });

// Explain API - Get detailed explanation of predictions
export const explainPrediction = (input, output, type) =>
    api.post('/explain', { input, output, type });

// Meal Logging APIs
export const logMeal = (mealData) => api.post('/meals', mealData);
export const getMeals = () => api.get('/meals');
export const getDailyMetrics = () => api.get('/daily-metrics');
export const updateDailyMetrics = (data) => api.put('/daily-metrics', data);

// Health Records APIs
export const createHealthRecord = (record) =>
    api.post('/health-records', record);

export const getHealthRecords = () =>
    api.get('/health-records');

export const getHealthRecord = (id) =>
    api.get(`/health-records/${id}`);

// Assessments APIs
export const getAssessments = () => api.get('/assessments');
export const deleteAssessment = (id) => api.delete(`/assessments/${id}`);

// Interactions APIs
export const getInteractions = () => api.get('/interactions');
export const deleteInteraction = (id) => api.delete(`/interactions/${id}`);

// Advices APIs
export const getAdvices = () => api.get('/advices');
export const deleteAdvice = (id) => api.delete(`/advices/${id}`);

// Languages API
export const getSupportedLanguages = () =>
    api.get('/languages');

// Status API
export const getStatus = () => api.get('/');

export default api;
