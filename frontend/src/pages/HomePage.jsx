import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
    Mic,
    BarChart3,
    FileText,
    Shield,
    Leaf,
    Heart,
    Brain,
    Activity,
    ChevronRight,
    CheckCircle,
    UtensilsCrossed,
    Stethoscope,
} from 'lucide-react';

// Animated Counter Component
function AnimatedCounter({ end, duration = 2000, suffix = '' }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [end, duration]);

    return <span>{count.toLocaleString()}{suffix}</span>;
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, color }) {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ duration: 0.2 }}
        >
            <Card className="h-full bg-white/80 backdrop-blur-md border-stone-200/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function HomePage() {
    const { t } = useLanguage();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

const features = [
        {
            icon: Mic,
            title: t('voiceFirst'),
            description: t('voiceFirstDesc'),
            color: 'bg-primary',
        },
        {
            icon: Leaf,
            title: t('ayurvedicAI'),
            description: t('ayurvedicAIDesc'),
            color: 'bg-green-500',
        },
        {
            icon: BarChart3,
            title: t('publicHealthAI'),
            description: t('publicHealthAIDesc'),
            color: 'bg-blue-500',
        },
    ];

    const healthServices = [
        { icon: Brain, label: t('mentalHealthLabel'), color: 'bg-purple-500', tab: 'mental-health', path: '/assessment' },
        { icon: Heart, label: t('heartHealth'), color: 'bg-red-500', tab: 'heart', path: '/assessment' },
        { icon: Activity, label: t('diabetesRisk'), color: 'bg-amber-500', tab: 'diabetes', path: '/assessment' },
        { icon: Stethoscope, label: t('diseasePredict'), color: 'bg-blue-500', path: '/disease' },
        { icon: Leaf, label: t('ayurvedicCare'), color: 'bg-green-500', path: '/advice' },
        { icon: UtensilsCrossed, label: t('aiDietCoachLabel'), color: 'bg-teal-500', path: '/diet' },
        { icon: FileText, label: t('myRecords'), color: 'bg-indigo-500', path: '/records', auth: true },
        { icon: Mic, label: t('consultAi'), color: 'bg-pink-500', path: '/consult', auth: true },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative bg-hero-gradient py-16 md:py-24 overflow-hidden" data-testid="hero-section">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-30">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#2D5F3F" strokeWidth="0.1" />
                                </pattern>
                            </defs>
                            <rect width="100" height="100" fill="url(#grid)" />
                        </svg>
                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* Left Content */}
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                className="text-center lg:text-left"
                            >
                                <Badge className="mb-4 bg-primary/10 text-primary border-0 px-4 py-1">
                                    IndiaAI Innovation Challenge 2026
                                </Badge>

                                <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-primary mb-6 tracking-tight">
                                    {t('appName')}
                                </h1>

                                <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
                                    {t('tagline')}
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <Button
                                        size="lg"
                                        className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                                        onClick={() => navigate('/consult')}
                                        data-testid="start-consultation-btn"
                                    >
                                        <Mic className="w-5 h-5 mr-2" />
                                        {t('startConsultation')}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="rounded-full px-8 py-6 text-lg border-2 border-primary text-primary hover:bg-primary/5"
                                        onClick={() => navigate('/dashboard')}
                                        data-testid="view-dashboard-btn"
                                    >
                                        <BarChart3 className="w-5 h-5 mr-2" />
                                        {t('viewDashboard')}
                                    </Button>
                                </div>

                                {/* Trust Badges */}
                                <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Shield className="w-4 h-4 text-primary" />
                                        {t('privacyNote')}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        {t('ministryRecognized')}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Right Content - Avatar Preview */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="relative"
                            >
                                <div className="relative mx-auto w-72 h-72 md:w-96 md:h-96">
                                    {/* Animated Ring */}
                                    <motion.div
                                        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    />

                                    {/* Doctor Image */}
                                    <div className="absolute inset-4 rounded-full overflow-hidden bg-white shadow-2xl">
                                        <img
                                            src="https://images.unsplash.com/photo-1659353888906-adb3e0041693?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBmZW1hbGUlMjBkb2N0b3IlMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbCUyMHdoaXRlJTIwY29hdHxlbnwwfHx8fDE3NzE1OTc3NzV8MA&ixlib=rb-4.1.0&q=85"
                                            alt="Dr. AYUSH - AI Consultant"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Floating Badges */}
                                    <motion.div
                                        className="absolute -right-4 top-1/4 bg-white rounded-xl shadow-lg p-3"
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    >
                                        <Leaf className="w-6 h-6 text-primary" />
                                    </motion.div>

                                    <motion.div
                                        className="absolute -left-4 bottom-1/4 bg-white rounded-xl shadow-lg p-3"
                                        animate={{ y: [0, 10, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                                    >
                                        <Heart className="w-6 h-6 text-red-500" />
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-12 bg-primary text-white" data-testid="stats-section">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            <div>
                                <p className="text-3xl md:text-4xl font-bold font-heading">
                                    <AnimatedCounter end={12000} suffix="+" />
                                </p>
                                <p className="text-sm text-white/80 mt-1">{t('ayushCentersReady')}</p>
                            </div>
                            <div>
                                <p className="text-3xl md:text-4xl font-bold font-heading">
                                    <AnimatedCounter end={22} />
                                </p>
                                <p className="text-sm text-white/80 mt-1">{t('languagesSupported')}</p>
                            </div>
                            <div>
                                <p className="text-3xl md:text-4xl font-bold font-heading">
                                    <AnimatedCounter end={50} suffix="+" />
                                </p>
                                <p className="text-sm text-white/80 mt-1">{t('diseasesDetected')}</p>
                            </div>
                            <div>
                                <p className="text-3xl md:text-4xl font-bold font-heading">
                                    <AnimatedCounter end={100} suffix="K+" />
                                </p>
                                <p className="text-sm text-white/80 mt-1">{t('livesImpacted')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-16 md:py-24 bg-stone-50" data-testid="features-section">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-4">
                                {t('features')}
                            </h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                {t('voiceFirstDesc')}
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <FeatureCard {...feature} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Health Services Grid */}
                <section className="py-16 md:py-24" data-testid="services-section">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                        <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-4">
                                {t('comprehensiveHealthAssessment')}
                            </h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                {t('mentalWellnessToChronicDisease')}
                            </p>
                        </motion.div>

<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {healthServices.map((service, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.05 }}
                                    className="cursor-pointer"
                                    onClick={() => {
                                        if (service.auth && !isAuthenticated) {
                                            navigate('/login');
                                        } else {
                                            navigate(service.path + (service.tab ? `?tab=${service.tab}` : ''));
                                        }
                                    }}
                                >
                                    <Card className="text-center p-6 hover:shadow-lg transition-shadow bg-white/80 border-0">
                                        <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl ${service.color} flex items-center justify-center`}>
                                            <service.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <p className="font-medium text-sm">{service.label}</p>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 bg-gradient-to-br from-primary to-primary/80 text-white" data-testid="cta-section">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
                                {t('readyToExperienceAi')}
                            </h2>
                            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                                {t('simplySpeakInLanguage')}
                            </p>
                            <Button
                                size="lg"
                                className="bg-white text-primary hover:bg-white/90 rounded-full px-8 py-6 text-lg shadow-lg"
                                onClick={() => navigate('/consult')}
                                data-testid="cta-start-btn"
                            >
                                {t('startConsultation')}
                                <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}