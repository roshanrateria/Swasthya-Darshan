
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header, Footer } from '@/components/layout/Layout';
import { DoctorAvatar } from '@/components/avatar/DoctorAvatar';
import { VoiceRecorder } from '@/components/voice/VoiceComponents';
import { DiagnosisResults, TreatmentPlan, SymptomsChips } from '@/components/health/HealthComponents';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
    speechToText,
    textToSpeech,
    predictDisease,
    getAyurvedicTreatment,
    chatWithDoctor,
} from '@/lib/api';
import { toast } from 'sonner';
import {
    RefreshCw,
    MessageSquare,
    Stethoscope,
    Leaf,
    ChevronRight,
    User,
    Bot,
} from 'lucide-react';

// Consultation Stages
const STAGES = {
    GREETING: 'greeting',
    LISTENING: 'listening',
    PROCESSING: 'processing',
    DIAGNOSIS: 'diagnosis',
    TREATMENT: 'treatment',
};

// Chat Message Component
function ChatMessage({ message, isUser }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-secondary' : 'bg-primary'
                }`}>
                {isUser ? (
                    <User className="w-4 h-4 text-white" />
                ) : (
                    <Bot className="w-4 h-4 text-white" />
                )}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser
                ? 'bg-secondary/10 text-foreground'
                : 'bg-primary/10 text-foreground'
                }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
            </div>
        </motion.div>
    );
}

export default function ConsultationPage() {
    const { t, language } = useLanguage();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [stage, setStage] = useState(STAGES.GREETING);
    const [avatarState, setAvatarState] = useState(DoctorAvatar.STATES.IDLE);
    const [audioLevel, setAudioLevel] = useState(0);
    const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    // Chat state
    const [messages, setMessages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Diagnosis state
    const [symptoms, setSymptoms] = useState([]);
    const [diagnosis, setDiagnosis] = useState(null);
    const [treatment, setTreatment] = useState(null);    const chatScrollRef = useRef(null);
    const audioRef = useRef(null);
    const audioContextRef = useRef(null);
    const animationFrameRef = useRef(null);
    const speakingIdRef = useRef(0);

    const stopCurrentPlayback = useCallback(async () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (audioRef.current) {
            audioRef.current.onplay = null;
            audioRef.current.onended = null;
            audioRef.current.onpause = null;
            audioRef.current.onerror = null;
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            await audioContextRef.current.close().catch(console.error);
        }
        audioContextRef.current = null;

        setAudioLevel(0);
        setIsSpeakingAudio(false);
    }, []);

    useEffect(() => {
        return () => {
            stopCurrentPlayback().catch(console.error);
        };
    }, [stopCurrentPlayback]);

    // Scroll chat to bottom
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [messages]);    // Text to Speech — useCallback so it can be a stable dep for other callbacks.
    // speakingIdRef provides a cheap concurrency guard: each call claims an ID and
    // aborts after every await if a newer call has superseded it.
    const speakText = useCallback(async (text) => {
        const myId = ++speakingIdRef.current;

        try {
            await stopCurrentPlayback();
            if (myId !== speakingIdRef.current) return; // superseded

            setAvatarState(DoctorAvatar.STATES.SPEAKING);

            const response = await textToSpeech(text, language);
            if (myId !== speakingIdRef.current) return; // superseded

            const audioBase64 = response.data.audio_base64;

            const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
            audioRef.current = audio;

            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContextClass();
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaElementSource(audio);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateLevel = () => {
                if (audioRef.current && !audioRef.current.paused) {
                    analyser.getByteFrequencyData(dataArray);
                    const sum = dataArray.reduce((acc, curr) => acc + curr, 0);
                    const average = dataArray.length > 0 ? sum / dataArray.length : 0;
                    setAudioLevel(Number.isFinite(average) ? Math.min(average / 128, 1) : 0);
                    animationFrameRef.current = requestAnimationFrame(updateLevel);
                } else {
                    setAudioLevel(0);
                }
            };

            const cleanupPlayback = () => {
                setIsSpeakingAudio(false);
                setAvatarState(DoctorAvatar.STATES.IDLE);
                setAudioLevel(0);
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }
                if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                    audioContextRef.current.close().catch(console.error);
                }
                audioContextRef.current = null;
                audioRef.current = null;
            };

            audio.onplay = () => {
                // If another speakText call won the race, abort immediately
                if (myId !== speakingIdRef.current) { audio.pause(); return; }
                if (audioContext.state === 'suspended') audioContext.resume();
                setIsSpeakingAudio(true);
                setAvatarState(DoctorAvatar.STATES.SPEAKING);
                updateLevel();
            };

            audio.onended = cleanupPlayback;
            audio.onerror = cleanupPlayback;

            audio.play().catch((error) => {
                cleanupPlayback();
                console.error(error);
            });
        } catch (error) {
            if (myId !== speakingIdRef.current) return;
            console.error('TTS Error:', error);
            setAvatarState(DoctorAvatar.STATES.IDLE);
            setIsSpeakingAudio(false);
        }
    }, [language, stopCurrentPlayback]);

    // Initial greeting — re-runs on language change; cleanup cancels in-flight TTS
    useEffect(() => {
        const greeting = t('doctorGreeting');
        setMessages([{ role: 'assistant', content: greeting }]);
        speakText(greeting);

        return () => {
            // Invalidate any in-flight speakText that belongs to this effect
            speakingIdRef.current++;
            stopCurrentPlayback().catch(console.error);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language]);

    // Handle voice recording completion
    const handleRecordingComplete = useCallback(async (audioBase64, lang, textInput = null) => {
        setIsProcessing(true);
        setAvatarState(DoctorAvatar.STATES.THINKING);
        setStage(STAGES.PROCESSING);

        let userText = textInput;

        try {
            // If audio was recorded, convert to text
            if (audioBase64 && !textInput) {
                try {
                    const asrResponse = await speechToText(audioBase64, lang);
                    userText = asrResponse.data.text;

                    if (!userText) {
                        toast.error('No speech detected. Please try again.');
                        setIsProcessing(false);
                        setAvatarState(DoctorAvatar.STATES.IDLE);
                        setStage(STAGES.LISTENING);
                        return;
                    }
                } catch (asrError) {
                    console.error('ASR Error:', asrError);
                    toast.error('Speech recognition failed. Please try typing instead.');
                    setIsProcessing(false);
                    setAvatarState(DoctorAvatar.STATES.IDLE);
                    setStage(STAGES.LISTENING);
                    return;
                }
            }

            // Add user message to chat
            const newMessages = [...messages, { role: 'user', content: userText }];
            setMessages(newMessages);

            // Extract symptoms from text (basic extraction)
            const newSymptoms = extractSymptoms(userText);
            if (newSymptoms.length > 0) {
                setSymptoms(prev => [...new Set([...prev, ...newSymptoms])]);
            }

            // Get AI response
            const chatResponse = await chatWithDoctor(
                newMessages.map(m => ({ role: m.role, content: m.content })),
                lang
            );

            const assistantMessage = chatResponse.data.response;
            setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);

            // Speak the response
            await speakText(assistantMessage);            setStage(STAGES.LISTENING);

        } catch (error) {
            console.error('Processing Error:', error);
            toast.error('Failed to process. Please try again.');
            setStage(STAGES.LISTENING);
            setAvatarState(DoctorAvatar.STATES.IDLE);
        } finally {
            setIsProcessing(false);
        }
    }, [messages, speakText]);// Basic symptom extraction
    const extractSymptoms = (text) => {
        if (!text || typeof text !== 'string') return [];
        const symptomKeywords = [
            'fever', 'headache', 'pain', 'cough', 'cold', 'fatigue', 'nausea',
            'vomiting', 'diarrhea', 'weakness', 'dizziness', 'sore throat',
            'body ache', 'joint pain', 'stomach pain', 'chest pain',
            'बुखार', 'सिरदर्द', 'दर्द', 'खांसी', 'जुकाम', 'थकान', 'मतली',
            'उल्टी', 'दस्त', 'कमजोरी', 'चक्कर', 'गले में दर्द',
        ];

        const lowerText = text.toLowerCase();
        return symptomKeywords.filter(s => lowerText.includes(s.toLowerCase()));
    };

    // Get diagnosis
    const handleGetDiagnosis = async () => {
        if (symptoms.length === 0) {
            toast.info('Please describe your symptoms first');
            return;
        }

        setIsProcessing(true);
        setStage(STAGES.DIAGNOSIS);
        setAvatarState(DoctorAvatar.STATES.THINKING);

        try {
            const response = await predictDisease(symptoms);
            setDiagnosis(response.data);

            // Announce diagnosis
            const diagnosisText = `Based on your symptoms, the most likely condition is ${response.data.top_disease} with ${Math.round(response.data.confidence * 100)}% confidence.`;
            setMessages(prev => [...prev, { role: 'assistant', content: diagnosisText }]);
            await speakText(diagnosisText);

        } catch (error) {
            console.error('Diagnosis Error:', error);
            toast.error('Failed to get diagnosis. Please try again.');
            setStage(STAGES.LISTENING);
            setAvatarState(DoctorAvatar.STATES.IDLE);
        } finally {
            setIsProcessing(false);
        }
    };

    // Get treatment
    const handleGetTreatment = async () => {
        if (!diagnosis) {
            toast.info('Please get a diagnosis first');
            return;
        }

        setIsProcessing(true);
        setStage(STAGES.TREATMENT);
        setAvatarState(DoctorAvatar.STATES.THINKING);

        try {
            const symptomsText = symptoms.join(' ') + ' ' + diagnosis.top_disease;
            const response = await getAyurvedicTreatment(symptomsText);
            setTreatment(response.data);

            // Announce treatment
            const treatmentText = 'I have prepared a personalized Ayurvedic treatment plan for you. Please review the Aushadha, Ahara, and Vihara recommendations.';
            setMessages(prev => [...prev, { role: 'assistant', content: treatmentText }]);
            await speakText(treatmentText);

        } catch (error) {
            console.error('Treatment Error:', error);
            toast.error('Failed to get treatment recommendations. Please try again.');
            setAvatarState(DoctorAvatar.STATES.IDLE);
        } finally {
            setIsProcessing(false);
        }
    };

    // Reset consultation
    const handleReset = () => {
        setStage(STAGES.GREETING);
        setMessages([{ role: 'assistant', content: t('doctorGreeting') }]);
        setSymptoms([]);
        setDiagnosis(null);
        setTreatment(null);
        setAvatarState(DoctorAvatar.STATES.IDLE);
        speakText(t('doctorGreeting'));
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />

            <main className="flex-1 py-6 md:py-8" data-testid="consultation-page">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Panel - Avatar & Voice */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* Avatar Card */}
                            <Card className="bg-white/80 backdrop-blur-md shadow-lg overflow-hidden">
                                <CardContent className="p-6">
                                    <DoctorAvatar
                                        state={avatarState}
                                        audioLevel={audioLevel}
                                        className="mb-6"
                                    />

                                    {/* Voice Recorder */}
                                    <VoiceRecorder
                                        onRecordingComplete={handleRecordingComplete}
                                        onRecordingStateChange={(isRecording) => {
                                            if (isRecording) {
                                                stopCurrentPlayback().catch(console.error);
                                                setAvatarState(DoctorAvatar.STATES.LISTENING);
                                                setStage(STAGES.LISTENING);
                                            } else if (!isProcessing && !isSpeakingAudio) {
                                                setAvatarState(DoctorAvatar.STATES.IDLE);
                                            }
                                        }}
                                        isDisabled={isProcessing || isSpeakingAudio}
                                    />
                                </CardContent>
                            </Card>

                            {/* Symptoms Chips */}
                            {symptoms.length > 0 && (
                                <Card className="bg-white/80 backdrop-blur-md">
                                    <CardContent className="p-4">
                                        <p className="text-sm font-medium text-muted-foreground mb-3">
                                            Detected Symptoms:
                                        </p>
                                        <SymptomsChips
                                            symptoms={symptoms}
                                            onRemove={(s) => setSymptoms(prev => prev.filter(x => x !== s))}
                                        />
                                    </CardContent>
                                </Card>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <Button
                                    className="flex-1 gap-2"
                                    onClick={handleGetDiagnosis}
                                    disabled={isProcessing || symptoms.length === 0}
                                    data-testid="get-diagnosis-btn"
                                >
                                    <Stethoscope className="w-4 h-4" />
                                    {t('diagnosisResults')}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={handleReset}
                                    data-testid="reset-btn"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                            </div>

                            {diagnosis && (
                                <Button
                                    className="w-full gap-2 bg-secondary hover:bg-secondary/90"
                                    onClick={handleGetTreatment}
                                    disabled={isProcessing}
                                    data-testid="get-treatment-btn"
                                >
                                    <Leaf className="w-4 h-4" />
                                    {t('treatmentPlan')}
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

                        {/* Right Panel - Chat & Results */}
                        <div className="lg:col-span-7 space-y-6">
                            {/* Chat Messages */}
                            <Card className="bg-white/80 backdrop-blur-md shadow-lg">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <MessageSquare className="w-5 h-5 text-primary" />
                                        <h3 className="font-medium">Consultation</h3>
                                        <Badge variant="outline" className="ml-auto">
                                            {language.toUpperCase()}
                                        </Badge>
                                    </div>

                                    <ScrollArea
                                        className="h-[300px] pr-4"
                                        ref={chatScrollRef}
                                    >
                                        <div className="space-y-4">
                                            <AnimatePresence>
                                                {messages.map((msg, idx) => (
                                                    <ChatMessage
                                                        key={idx}
                                                        message={msg.content}
                                                        isUser={msg.role === 'user'}
                                                    />
                                                ))}
                                            </AnimatePresence>

                                            {isProcessing && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex gap-2 items-center text-muted-foreground"
                                                >
                                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                                </motion.div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>

                            {/* Diagnosis Results */}
                            <AnimatePresence>
                                {(stage === STAGES.DIAGNOSIS || diagnosis) && (
                                    <DiagnosisResults
                                        diagnosis={diagnosis}
                                        isLoading={stage === STAGES.DIAGNOSIS && !diagnosis}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Treatment Plan */}
                            <AnimatePresence>
                                {(stage === STAGES.TREATMENT || treatment) && (
                                    <TreatmentPlan
                                        treatment={treatment}
                                        isLoading={stage === STAGES.TREATMENT && !treatment}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
