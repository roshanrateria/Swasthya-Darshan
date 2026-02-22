import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header, Footer } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getAssessments, getAdvices, getDailyMetrics, explainPrediction } from '@/lib/api';
import { toast } from 'sonner';
import { Share2, Download, Sparkles, Trophy, Flame, Heart, Brain, Activity, Leaf, Copy, Check } from 'lucide-react';

function ShareableCard({ stats, userName, aiMessage, t }) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'My Health Journey',
                    text: aiMessage,
                });
            } else {
                setCopied(true);
                await navigator.clipboard.writeText(aiMessage);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (error) {
            console.log('Share error:', error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-sm mx-auto"
        >
            <div className="bg-gradient-to-br from-purple-600 via-primary to-green-500 rounded-3xl p-6 text-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <span className="text-2xl">🧘</span>
                        </div>
                        <div>
                            <p className="font-bold text-lg">{userName || 'Health Warrior'}</p>
                            <p className="text-xs text-white/70">Swasthya Darshan</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold">{stats.totalAssessments}</p>
                        <p className="text-xs text-white/70">{t('assessments')}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white/10 rounded-2xl p-3 text-center">
                        <Brain className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-xl font-bold">{stats.mentalHealth}</p>
                        <p className="text-xs text-white/70">{t('mental')}</p>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3 text-center">
                        <Heart className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-xl font-bold">{stats.heart}</p>
                        <p className="text-xs text-white/70">{t('heart')}</p>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3 text-center">
                        <Activity className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-xl font-bold">{stats.diabetes}</p>
                        <p className="text-xs text-white/70">{t('diabetes')}</p>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3 text-center">
                        <Flame className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-xl font-bold">{stats.caloriesSaved}</p>
                        <p className="text-xs text-white/70">{t('calSaved')}</p>
                    </div>
                </div>

                {/* Achievement */}
                {stats.streak > 0 && (
                    <div className="bg-white/10 rounded-2xl p-3 flex items-center justify-center gap-2 mb-4">
                        <Trophy className="w-5 h-5 text-yellow-300" />
                        <span className="font-bold">{stats.streak} {t('dayStreakLabel')}! 🔥</span>
                    </div>
                )}

                {/* AI Message */}
                <div className="bg-white/10 rounded-2xl p-3 text-center">
                    <p className="text-sm italic">"{aiMessage}"</p>
                </div>

                {/* Footer */}
                <div className="mt-4 text-center">
                    <p className="text-xs text-white/50">Join me on Swasthya Darshan</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
                <Button onClick={handleShare} className="flex-1 gap-2">
                    {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    {copied ? t('copied') : t('share')}
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
                    <Download className="w-4 h-4" />
                    {t('download')}
                </Button>
            </div>
        </motion.div>
    );
}

export default function ShareCardPage() {
    const { t, language } = useLanguage();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalAssessments: 0,
        mentalHealth: 0,
        heart: 0,
        diabetes: 0,
        caloriesSaved: 0,
        streak: 0,
    });
    const [aiMessage, setAiMessage] = useState('Starting my health journey with AI-powered guidance!');
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchStats();
    }, [isAuthenticated, navigate]);

    const fetchStats = async () => {
        try {
            const [assessRes, metricsRes] = await Promise.all([
                getAssessments(),
                getDailyMetrics()
            ]);

            const assessments = assessRes.data || [];
            const metrics = metricsRes.data || {};

            const mentalHealth = assessments.filter(a => a.assessment_type === 'mental_health').length;
            const heart = assessments.filter(a => a.assessment_type === 'heart_disease').length;
            const diabetes = assessments.filter(a => a.assessment_type === 'diabetes').length;

            setStats({
                totalAssessments: assessments.length,
                mentalHealth,
                heart,
                diabetes,
                caloriesSaved: metrics.calories_saved || 0,
                streak: metrics.streak_days || 7,
            });

            // Generate AI message
            await generateAIMessage({
                assessments: assessments.length,
                mentalHealth,
                heart,
                diabetes,
                caloriesSaved: metrics.calories_saved || 0,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateAIMessage = async (stats) => {
        setIsGenerating(true);
        try {
            const prompt = `Generate a short, inspiring health journey share message for someone who has:
- ${stats.assessments} health assessments
- ${stats.mentalHealth} mental health checks
- ${stats.heart} heart checks
- ${stats.diabetes} diabetes tests
- saved ${stats.caloriesSaved} calories by eating healthy

Make it sound proud and motivating! Use emojis sparingly.
CRITICAL: Your response MUST be a maximum of 4 lines long. Do not exceed 4 short lines.`;

            const response = await explainPrediction(
                { type: 'share_card', stats },
                { message: prompt },
                'share_card'
            );

            if (response.data?.explanation) {
                setAiMessage(response.data.explanation);
            }
        } catch (error) {
            console.error('Error generating message:', error);
            // Keep default message
        } finally {
            setIsGenerating(false);
        }
    };

    const regenerateMessage = () => {
        generateAIMessage(stats);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-green-50">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <p>{t('generatingYourCard')}</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-green-50">
            <Header />
            <main className="flex-1 py-6 md:py-8">
                <div className="max-w-md mx-auto px-4">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-green-500 flex items-center justify-center shadow-lg">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary">
                            {t('shareYourHealthJourney')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {t('generateAiPoweredCard')}
                        </p>
                    </motion.div>

                    {/* Card */}
                    <ShareableCard
                        stats={stats}
                        userName={user?.name}
                        aiMessage={aiMessage}
                        t={t}
                    />

                    {/* Regenerate Button */}
                    <div className="mt-6 text-center">
                        <Button variant="outline" onClick={regenerateMessage} disabled={isGenerating} className="gap-2">
                            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                            {isGenerating ? t('generating') : t('regenerateMessage')}
                        </Button>
                    </div>

                    {/* Stats Summary */}
                    <Card className="mt-8 bg-white/60 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-base">{t('yourStatsSummary')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-primary">{stats.totalAssessments}</p>
                                    <p className="text-xs text-muted-foreground">{t('assessments')}</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-600">{stats.caloriesSaved}</p>
                                    <p className="text-xs text-muted-foreground">{t('caloriesSaved')}</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-orange-500">{stats.streak}</p>
                                    <p className="text-xs text-muted-foreground">{t('dayStreakLabel')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tips */}
                    <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-sm text-amber-800">
                            <strong>💡 {t('tipShareInspire')}</strong>
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
