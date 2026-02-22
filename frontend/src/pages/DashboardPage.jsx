import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Header, Footer } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getAssessments, getAdvices, getInteractions, getDailyMetrics } from '@/lib/api';
import { toast } from 'sonner';
import { 
    Brain, Heart, Activity, Leaf, FileText, MessageSquare, 
    TrendingUp, AlertTriangle, ChevronRight, User, Scale,
    Droplets, Flame, Footprints, Moon, Sun, Target,
    Trophy, Star, Zap, Sparkles, Share2, Apple,
    Coffee, UtensilsCrossed, Timer, Calendar, RefreshCw
} from 'lucide-react';

function CircularProgress({ value, max, label, color, icon: Icon, size = 120 }) {
    const radius = (size - 16) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(value / max, 1);
    const strokeDashoffset = circumference - progress * circumference;
    
    return (
        <div className="relative flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size/2}
                    cy={size/2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                />
                <motion.circle
                    cx={size/2}
                    cy={size/2}
                    r={radius}
                    stroke={color}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{
                        strokeDasharray: circumference,
                    }}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <Icon className="w-6 h-6" style={{ color }} />
                <span className="text-2xl font-bold" style={{ color }}>{Math.round(progress * 100)}%</span>
            </div>
        </div>
    );
}

function StreakCounter({ streak, t }) {
    return (
        <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full"
        >
            <Flame className="w-5 h-5" />
            <span className="font-bold">{streak}</span>
            <span className="text-xs opacity-90">{t('dayStreak')}</span>
        </motion.div>
    );
}

function AchievementBadge({ icon: Icon, label, earned, color }) {
    return (
        <motion.div 
            whileHover={{ scale: 1.1 }}
            className={`flex flex-col items-center gap-1 ${earned ? '' : 'opacity-30'}`}
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${earned ? color : 'bg-gray-200'}`}>
                <Icon className={`w-6 h-6 ${earned ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <span className="text-xs text-center">{label}</span>
        </motion.div>
    );
}

function QuickLogCard({ icon: Icon, label, value, unit, color, onClick }) {
    return (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="bg-white/80 backdrop-blur-md cursor-pointer hover:shadow-lg transition-all" onClick={onClick}>
                <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-xl font-bold">{value} <span className="text-xs font-normal text-muted-foreground">{unit}</span></p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function HealthRingCard({ title, value, target, icon: Icon, color, subtitle }) {
    return (
        <motion.div whileHover={{ scale: 1.02 }}>
            <Card className="bg-white/80 backdrop-blur-md overflow-hidden">
                <CardContent className="p-4 flex items-center gap-4">
                    <CircularProgress value={value} max={target} label={title} color={color} icon={Icon} size={80} />
                    <div className="flex-1">
                        <p className="font-semibold">{title}</p>
                        <p className="text-sm text-muted-foreground">{subtitle}</p>
                        <p className="text-xs mt-1">{value} / {target} today</p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function DailyTipCard({ tip, onRefresh, t }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary/10 to-green-50 rounded-xl p-4 border border-primary/20"
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                    <p className="font-medium text-sm">{t('dailyTip')}</p>
                    <p className="text-sm text-muted-foreground mt-1">{tip}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={onRefresh}>
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>
        </motion.div>
    );
}

function generateHealthTip() {
    const tips = [
        "Start your day with warm water and lemon to boost metabolism.",
        "Practice 10 minutes of pranayama breathing for mental clarity.",
        "Include turmeric in your diet for its anti-inflammatory properties.",
        "Take a 15-minute walk after meals to aid digestion.",
        "Sleep before 10 PM for optimal Ayurvedic Rituucharya.",
        "Drink ginger tea to boost immunity during monsoons.",
        "Practice mindful eating - chew your food properly.",
        "Include seasonal fruits in your diet for natural vitamins.",
        "Abhyanga (oil massage) improves circulation and reduces stress.",
        "Yoga asanas like Bhujangasana strengthen the spine.",
    ];
    return tips[Math.floor(Math.random() * tips.length)];
}

function QuickActionButton({ icon: Icon, label, to, color }) {
    return (
        <Link to={to}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <div className={`${color} w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                </div>
                <p className="text-xs text-center mt-2 font-medium">{label}</p>
            </motion.div>
        </Link>
    );
}

export default function DashboardPage() {
    const { t } = useLanguage();
    const { user, isAuthenticated } = useAuth();
    const [assessments, setAssessments] = useState([]);
    const [advices, setAdvices] = useState([]);
    const [interactions, setInteractions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dailyTip, setDailyTip] = useState(generateHealthTip);
    const [streak] = useState(7); // Mock streak for now
    const [healthMetrics, setHealthMetrics] = useState({
        calories: { current: 0, target: 2000, saved: 0 },
        steps: { current: 0, target: 10000 },
        water: { current: 0, target: 8 },
        sleep: { current: 0, target: 8 },
    });

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    const fetchData = async () => {
        try {
            const [assessRes, advicesRes, interRes, metricsRes] = await Promise.all([
                getAssessments(),
                getAdvices(),
                getInteractions(),
                getDailyMetrics()
            ]);
            setAssessments(assessRes.data || []);
            setAdvices(advicesRes.data || []);
            setInteractions(interRes.data || []);
            
            if (metricsRes.data) {
                setHealthMetrics({
                    calories: { current: metricsRes.data.total_calories || 0, target: 2000, saved: metricsRes.data.calories_saved || 0 },
                    steps: { current: metricsRes.data.steps || 0, target: 10000 },
                    water: { current: metricsRes.data.water_glasses || 0, target: 8 },
                    sleep: { current: metricsRes.data.sleep_hours || 0, target: 8 },
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshTip = () => setDailyTip(generateHealthTip());

    const mentalHealthCount = assessments.filter(a => a.assessment_type === 'mental_health').length;
    const heartCount = assessments.filter(a => a.assessment_type === 'heart_disease').length;
    const diabetesCount = assessments.filter(a => a.assessment_type === 'diabetes').length;
    const highRiskCount = assessments.filter(a => a.risk_level === 'HIGH' || a.risk_level === 'HIGH RISK').length;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-stone-50 to-green-50">
            <Header />
            <main className="flex-1 py-6 md:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Welcome Section with Streak */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <motion.h1 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="font-heading text-2xl md:text-3xl font-bold text-primary"
                            >
                                {isAuthenticated ? `Namaste, ${user?.name || 'User'}! 👋` : t('welcomeToSwasthya')}
                            </motion.h1>
                            <p className="text-muted-foreground mt-1">
                                {isAuthenticated ? t('yourHealthJourney') : t('tagline')}
                            </p>
                        </div>
                        {isAuthenticated && <StreakCounter streak={streak} t={t} />}
                    </div>

                    {isAuthenticated ? (
                        <>
                            {/* Health Rings */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                                <HealthRingCard 
                                    title={t('calories')} 
                                    value={healthMetrics.calories.current} 
                                    target={healthMetrics.calories.target}
                                    icon={Flame}
                                    color="#EF4444"
                                    subtitle={t('consumedToday')}
                                    saved={healthMetrics.calories.saved}
                                />
                                <HealthRingCard 
                                    title={t('steps')} 
                                    value={healthMetrics.steps.current} 
                                    target={healthMetrics.steps.target}
                                    icon={Footprints}
                                    color="#8B5CF6"
                                    subtitle={t('walkedToday')}
                                />
                                <HealthRingCard 
                                    title={t('water')} 
                                    value={healthMetrics.water.current} 
                                    target={healthMetrics.water.target}
                                    icon={Droplets}
                                    color="#3B82F6"
                                    subtitle={t('glasses')}
                                />
                                <HealthRingCard 
                                    title={t('sleep')} 
                                    value={healthMetrics.sleep.current} 
                                    target={healthMetrics.sleep.target}
                                    icon={Moon}
                                    color="#6366F1"
                                    subtitle={t('hoursLastNight')}
                                />
                                <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                                    <CardContent className="p-4 flex flex-col items-center justify-center">
                                        <Sparkles className="w-8 h-8 mb-2" />
                                        <p className="text-2xl font-bold">{healthMetrics.calories.saved}</p>
                                        <p className="text-xs text-green-100">{t('calSaved')}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Quick Actions */}
                            <div className="mb-6">
                                <h2 className="font-semibold mb-3">{t('quickActions')}</h2>
                                <div className="flex justify-around">
                                    <QuickActionButton icon={Brain} label={t('mental')} to="/assessment?tab=mental-health" color="bg-purple-500" />
                                    <QuickActionButton icon={Heart} label={t('heart')} to="/assessment?tab=heart" color="bg-red-500" />
                                    <QuickActionButton icon={Activity} label={t('diabetes')} to="/assessment?tab=diabetes" color="bg-amber-500" />
                                    <QuickActionButton icon={Leaf} label={t('disease')} to="/disease" color="bg-green-500" />
                                    <QuickActionButton icon={UtensilsCrossed} label={t('diet')} to="/diet" color="bg-teal-500" />
                                    <QuickActionButton icon={MessageSquare} label={t('consult')} to="/consult" color="bg-blue-500" />
                                </div>
                            </div>

                            {/* Daily Tip */}
                            <div className="mb-6">
                                <DailyTipCard tip={dailyTip} onRefresh={refreshTip} t={t} />
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <Card className="bg-white/80 backdrop-blur-md">
                                    <CardContent className="p-4 text-center">
                                        <Brain className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                                        <p className="text-2xl font-bold">{mentalHealthCount}</p>
                                        <p className="text-xs text-muted-foreground">{t('mentalChecks')}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white/80 backdrop-blur-md">
                                    <CardContent className="p-4 text-center">
                                        <Heart className="w-8 h-8 mx-auto text-red-500 mb-2" />
                                        <p className="text-2xl font-bold">{heartCount}</p>
                                        <p className="text-xs text-muted-foreground">{t('heartChecks')}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white/80 backdrop-blur-md">
                                    <CardContent className="p-4 text-center">
                                        <Activity className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                                        <p className="text-2xl font-bold">{diabetesCount}</p>
                                        <p className="text-xs text-muted-foreground">{t('diabetesTests')}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white/80 backdrop-blur-md">
                                    <CardContent className="p-4 text-center">
                                        <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
                                        <p className="text-2xl font-bold">{highRiskCount}</p>
                                        <p className="text-xs text-muted-foreground">{t('highRisk')}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Achievements */}
                            <div className="mb-6">
                                <h2 className="font-semibold mb-3">{t('achievements')}</h2>
                                <Card className="bg-white/80 backdrop-blur-md">
                                    <CardContent className="p-4">
                                        <div className="flex justify-around">
                                            <AchievementBadge icon={Trophy} label={t('firstCheck')} earned={assessments.length > 0} color="bg-yellow-500" />
                                            <AchievementBadge icon={Flame} label={`7 ${t('dayStreak')}`} earned={streak >= 7} color="bg-orange-500" />
                                            <AchievementBadge icon={Brain} label={t('mindMaster')} earned={mentalHealthCount >= 3} color="bg-purple-500" />
                                            <AchievementBadge icon={Heart} label={t('healthyHeart')} earned={heartCount >= 3} color="bg-red-500" />
                                            <AchievementBadge icon={Star} label={t('consultPro')} earned={interactions.length >= 5} color="bg-blue-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Quick Log */}
                            <div className="mb-6">
                                <h2 className="font-semibold mb-3">{t('dailyLog')}</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <QuickLogCard icon={Flame} label={t('calories')} value={healthMetrics.calories.current} unit="kcal" color="bg-red-500" />
                                    <QuickLogCard icon={Footprints} label={t('steps')} value={healthMetrics.steps.current} unit="steps" color="bg-purple-500" />
                                    <QuickLogCard icon={Droplets} label={t('water')} value={healthMetrics.water.current} unit="glasses" color="bg-blue-500" />
                                    <QuickLogCard icon={Moon} label={t('sleep')} value={healthMetrics.sleep.current} unit="hrs" color="bg-indigo-500" />
                                </div>
                            </div>

                            {/* Share Card CTA */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6"
                            >
                                <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">{t('shareYourJourney')}</h3>
                                            <p className="text-purple-100 text-sm">{t('generateHealthCard')}</p>
                                        </div>
                                        <Link to="/share">
                                            <Button variant="secondary" size="lg" className="gap-2">
                                                <Share2 className="w-4 h-4" />
                                                {t('share')}
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </>
                    ) : (
                        <div className="mb-8 p-8 bg-white/80 backdrop-blur-md rounded-2xl border border-primary/10 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                            >
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-green-500 flex items-center justify-center">
                                    <Leaf className="w-12 h-12 text-white" />
                                </div>
                            </motion.div>
                            <h3 className="font-heading text-xl font-bold mb-2">{t('startYourHealthJourney')}</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                {t('trackHealth')}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Link to="/login">
                                    <Button size="lg" className="gap-2">
                                        <User className="w-4 h-4" />
                                        {t('login')}
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button size="lg" variant="outline" className="gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        {t('getStarted')}
                                    </Button>
                                </Link>
                            </div>
                            
                            {/* Features Preview */}
                            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t">
                                <div>
                                    <Activity className="w-8 h-8 mx-auto text-primary mb-2" />
                                    <p className="text-sm font-medium">{t('healthTracking')}</p>
                                    <p className="text-xs text-muted-foreground">{t('monitorDailyMetrics')}</p>
                                </div>
                                <div>
                                    <Brain className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                                    <p className="text-sm font-medium">{t('aiDoctor')}</p>
                                    <p className="text-xs text-muted-foreground">{t('personalizedAdvice')}</p>
                                </div>
                                <div>
                                    <Trophy className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                                    <p className="text-sm font-medium">{t('achievements')}</p>
                                    <p className="text-xs text-muted-foreground">{t('earnRewards')}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Public Quick Actions */}
                    <h2 className="font-heading text-xl font-semibold mb-4">{t('exploreFeatures')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Link to="/assessment">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                                    <CardContent className="p-6">
                                        <Brain className="w-10 h-10 mb-3" />
                                        <h3 className="font-bold text-lg">{t('healthAssessments')}</h3>
                                        <p className="text-purple-100 text-sm mt-1">{t('checkMentalHeartDiabetes')}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Link>
                        
                        <Link to="/disease">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                                    <CardContent className="p-6">
                                        <Leaf className="w-10 h-10 mb-3" />
                                        <h3 className="font-bold text-lg">{t('diseasePrediction')}</h3>
                                        <p className="text-green-100 text-sm mt-1">{t('aiPoweredSymptomAnalysis')}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Link>
                        
                        <Link to="/dashboard">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                                    <CardContent className="p-6">
                                        <Activity className="w-10 h-10 mb-3" />
                                        <h3 className="font-bold text-lg">{t('trends')}</h3>
                                        <p className="text-blue-100 text-sm mt-1">{t('epidemicForecasting')}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
