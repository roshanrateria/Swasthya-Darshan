import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header, Footer } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { chatWithDoctor, explainPrediction, logMeal } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, UtensilsCrossed, Apple, Coffee, Flame, Droplets, Leaf, Send, Sparkles, Info, ChevronDown, Camera, Image, X, Check, FastForward, CheckCircle } from 'lucide-react';

function MessageBubble({ message, isUser }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser
                ? 'bg-primary text-white'
                : 'bg-white border shadow-sm'
                }`}>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{message}</div>
            </div>
        </motion.div>
    );
}

export default function DietCoachPage() {
    const { t, language } = useLanguage();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const QUICK_CHOICES = [
        { icon: Apple, label: t('fruits'), prompt: 'What fruits are best for my health?' },
        { icon: Coffee, label: t('breakfast'), prompt: 'Give me a healthy breakfast suggestion' },
        { icon: Flame, label: t('weightLoss'), prompt: 'Suggest a weight loss meal plan' },
        { icon: Droplets, label: t('hydration'), prompt: 'How much water should I drink daily?' },
        { icon: Leaf, label: t('vegetarian'), prompt: 'Give me a balanced vegetarian diet' },
        { icon: UtensilsCrossed, label: t('general'), prompt: 'What is a balanced Indian diet?' },
    ];

    const [messages, setMessages] = useState([
        { role: 'assistant', content: `Namaste! I'm your AI Diet Coach. 🍎\n\nI can help you with:\n• Meal suggestions (rice bowl vs pizza)\n• Calorie-conscious choices\n• Upload food images for calorie estimation\n• Healthy eating tips\n\nWhat would you like to know today?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showChoices, setShowChoices] = useState(true);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [analyzingImage, setAnalyzingImage] = useState(false);
    const [calorieResult, setCalorieResult] = useState(null);
    const [pendingFoodChoice, setPendingFoodChoice] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setUploadedImage(e.target.result);
                analyzeFoodImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeFoodImage = async (imageData) => {
        setAnalyzingImage(true);
        try {
            // Simulate AI analysis - in production this would call the backend
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockResult = {
                food: 'Mixed Indian meal',
                calories: Math.floor(Math.random() * 500) + 300,
                healthier: Math.random() > 0.5,
                alternatives: [
                    { name: 'Grilled chicken salad', calories: 250, saved: 200 },
                    { name: 'Vegetable dal', calories: 180, saved: 150 },
                ]
            };
            setCalorieResult(mockResult);

            const analysisMsg = `📸 *Food Analysis*\n\nDetected: ${mockResult.food}\nEstimated Calories: ${mockResult.calories} kcal\n\n${mockResult.healthier ? '✅ Good choice! This is relatively healthy.' : '💡 Tip: Consider these lower-calorie alternatives:'}`;

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: analysisMsg,
                options: !mockResult.healthier ? mockResult.alternatives.map(a => ({
                    label: `${a.name} - ${a.calories} kcal (Save ${a.saved} kcal)`,
                    action: 'choose_alternative',
                    data: a
                })) : []
            }]);
            setShowChoices(false);
        } catch (error) {
            toast.error('Failed to analyze image');
        } finally {
            setAnalyzingImage(false);
        }
    };

    const clearImage = () => {
        setUploadedImage(null);
        setCalorieResult(null);
    };

    const sendMessage = async (userInput) => {
        if (!userInput.trim() || isLoading) return;

        const newMessages = [...messages, { role: 'user', content: userInput }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        setShowChoices(false);

        try {
            const formattedMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
            const response = await chatWithDoctor(formattedMessages, language, 'diet_coaching');

            // Parse structured JSON response
            let aiData;
            try {
                // Remove markdown formatting if any escaped through the API
                let rawRes = response.data.response.replace(/```json/g, '').replace(/```/g, '').trim();
                aiData = JSON.parse(rawRes);
            } catch (e) {
                console.error("Failed to parse JSON", e);
                aiData = { response_type: 'general', analysis: response.data.response };
            }

            const analysisMsg = aiData.analysis;

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: analysisMsg
            }]);

            if (aiData.response_type === 'comparison' && aiData.options) {
                setPendingFoodChoice(aiData);
            }

        } catch (error) {
            console.error('Chat Error:', error);
            toast.error('Failed to get response');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickChoice = (prompt) => {
        sendMessage(prompt);
    };

    const handleOptionSelect = async (optIdx) => {
        if (!pendingFoodChoice) return;

        const options = pendingFoodChoice.options;
        const alt = options[optIdx];

        let saved = 0;
        if (alt.is_healthier && options.length === 2) {
            const otherIdx = optIdx === 0 ? 1 : 0;
            saved = options[otherIdx].calories - alt.calories;
        }

        try {
            await logMeal({
                food_name: alt.name,
                calories: alt.calories,
                meal_type: 'AI Compared',
                calories_saved: saved > 0 ? saved : 0
            });

            if (saved > 0) {
                toast.success(`Logged ${alt.name}. You saved ${saved} kcal!`);
            } else {
                toast.success(`Logged ${alt.name}.`);
            }

            setMessages(prev => [
                ...prev,
                { role: 'user', content: `I chose ${alt.name}` },
                { role: 'assistant', content: saved > 0 ? `Great choice! You just saved ${saved} kcal. Keep it up! 👏` : `Noted! ${alt.name} logged into your diary.` }
            ]);

            setPendingFoodChoice(null); // hide dashboard block
        } catch (error) {
            toast.error('Failed to log meal');
        }
    };


    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-green-50">
            <Header />
            <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-6"
                >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-green-500 flex items-center justify-center shadow-lg">
                        <UtensilsCrossed className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary">
                        {t('aiDietCoach')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('personalizedNutritionAi')}
                    </p>
                </motion.div>

                {/* Quick Choices */}
                {showChoices && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-6"
                    >
                        <p className="text-sm text-muted-foreground mb-3 text-center">{t('tryThese')}</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {QUICK_CHOICES.map((choice, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuickChoice(choice.prompt)}
                                        className="text-xs"
                                    >
                                        <choice.icon className="w-3 h-3 mr-1" />
                                        {choice.label}
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Chat Area */}
                <Card className="flex-1 flex flex-col bg-white/80 backdrop-blur-md border-0 shadow-xl overflow-hidden">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] max-h-[500px]">
                        {messages.map((msg, idx) => (
                            <MessageBubble
                                key={idx}
                                message={msg.content}
                                isUser={msg.role === 'user'}
                            />
                        ))}
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex justify-start"
                            >
                                <div className="bg-white border rounded-2xl px-4 py-3">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Pending Food Choice Comparison Panel below Chat Box */}
                    <AnimatePresence>
                        {pendingFoodChoice && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 30 }}
                                className="bg-green-50/90 border-t-2 border-green-200 shadow-xl px-4 py-3 z-10"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-green-800 text-sm">{t('whatDidYouEat') || 'What did you eat?'}</h4>
                                    <button
                                        onClick={() => setPendingFoodChoice(null)}
                                        className="text-stone-400 hover:text-stone-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex gap-3">
                                    {pendingFoodChoice.options?.map((opt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleOptionSelect(idx)}
                                            className={`flex-1 flex flex-col items-center p-3 rounded-xl text-white shadow-sm transition-transform hover:scale-105 active:scale-95 ${opt.is_healthier ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}`}
                                        >
                                            {opt.is_healthier ? <CheckCircle className="w-5 h-5 mb-1" /> : <UtensilsCrossed className="w-5 h-5 mb-1" />}
                                            <span className="font-bold text-sm tracking-tight text-center truncate w-full">{opt.name}</span>
                                            <span className="text-[11px] font-medium opacity-90">{opt.calories} cal</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Input */}
                    <div className="p-4 border-t bg-white relative z-20">
                        {/* Image Preview */}
                        {uploadedImage && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mb-3 relative"
                            >
                                <img
                                    src={uploadedImage}
                                    alt="Uploaded food"
                                    className="w-24 h-24 object-cover rounded-lg border-2 border-purple-300"
                                />
                                <button
                                    onClick={clearImage}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                {analyzingImage && (
                                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    </div>
                                )}
                            </motion.div>
                        )}

                        <div className="flex gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded-full"
                            >
                                <Camera className="w-5 h-5" />
                            </Button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
                                placeholder={t('askAboutFood')}
                                className="flex-1 px-4 py-3 rounded-full border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <Button
                                onClick={() => sendMessage(input)}
                                disabled={isLoading || !input.trim()}
                                size="icon"
                                className="rounded-full w-12 h-12"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 p-4 bg-white/60 rounded-xl border"
                >
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-purple-500 mt-0.5" />
                        <div>
                            <p className="font-medium text-sm">{t('exampleQuestions')}</p>
                            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                                <li>• "{t('healthierRicePizza')}"</li>
                                <li>• "{t('lowCalorieIndianDinner')}"</li>
                                <li>• "{t('betterDigestion')}"</li>
                                <li>• "{t('breakfastUnder300')}"</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </main>
            <Footer />
        </div>
    );
}
