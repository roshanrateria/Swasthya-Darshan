import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header, Footer } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/context/LanguageContext';
import { predictMentalHealth, predictHeartDisease, predictDiabetes } from '@/lib/api';
import { toast } from 'sonner';
import {
    Brain,
    Heart,
    Activity,
    AlertCircle,
    Leaf,
    Loader2,
    TrendingUp,
    Shield,
} from 'lucide-react';

function MentalHealthForm({ onSubmit, isLoading, t }) {
    const [formData, setFormData] = useState({
        age: 30,
        gender: 'Male',
        sleep_hours: 7,
        exercise_frequency: 'Sometimes',
        work_stress: 'Medium',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('age')}</label>
                    <Input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                        min="1"
                        max="120"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('gender')}</label>
                    <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Male">{t('male')}</SelectItem>
                            <SelectItem value="Female">{t('female')}</SelectItem>
                            <SelectItem value="Other">{t('other')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('sleepHours')}</label>
                    <Input
                        type="number"
                        value={formData.sleep_hours}
                        onChange={(e) => setFormData({ ...formData, sleep_hours: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="24"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('exerciseFrequency')}</label>
                    <Select value={formData.exercise_frequency} onValueChange={(v) => setFormData({ ...formData, exercise_frequency: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Never">{t('never')}</SelectItem>
                            <SelectItem value="Rarely">{t('rarely')}</SelectItem>
                            <SelectItem value="Sometimes">{t('sometimes')}</SelectItem>
                            <SelectItem value="Often">{t('often')}</SelectItem>
                            <SelectItem value="Daily">{t('daily')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">{t('workStressLevel')}</label>
                    <Select value={formData.work_stress} onValueChange={(v) => setFormData({ ...formData, work_stress: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Low">{t('low')}</SelectItem>
                            <SelectItem value="Medium">{t('medium')}</SelectItem>
                            <SelectItem value="High">{t('high')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                {t('assessMentalHealth')}
            </Button>
        </form>
    );
}

function HeartDiseaseForm({ onSubmit, isLoading, t }) {
    const [formData, setFormData] = useState({
        age: 45,
        gender: 'Male',
        cholesterol: 200,
        blood_pressure: 120,
        diabetes: 0,
        smoking: 0,
        bmi: 24,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('age')}</label>
                    <Input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })} min="1" max="120" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('gender')}</label>
                    <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Male">{t('male')}</SelectItem>
                            <SelectItem value="Female">{t('female')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('cholesterol')}</label>
                    <Input type="number" value={formData.cholesterol} onChange={(e) => setFormData({ ...formData, cholesterol: parseInt(e.target.value) || 0 })} min="0" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('bloodPressure')}</label>
                    <Input type="number" value={formData.blood_pressure} onChange={(e) => setFormData({ ...formData, blood_pressure: parseInt(e.target.value) || 0 })} min="0" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('bmi')}</label>
                    <Input type="number" step="0.1" value={formData.bmi} onChange={(e) => setFormData({ ...formData, bmi: parseFloat(e.target.value) || 0 })} min="0" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('diabetes')}</label>
                    <Select value={String(formData.diabetes)} onValueChange={(v) => setFormData({ ...formData, diabetes: parseInt(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">{t('no')}</SelectItem>
                            <SelectItem value="1">{t('yes')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">{t('smokingStatus')}</label>
                    <Select value={String(formData.smoking)} onValueChange={(v) => setFormData({ ...formData, smoking: parseInt(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">{t('nonSmoker')}</SelectItem>
                            <SelectItem value="1">{t('smoker')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                {t('predictHeartRisk')}
            </Button>
        </form>
    );
}

function DiabetesForm({ onSubmit, isLoading, t }) {
    const [formData, setFormData] = useState({
        gender: 'Male',
        age: 40,
        hypertension: 0,
        heart_disease: 0,
        smoking_history: 'never',
        bmi: 25,
        HbA1c_level: 5.5,
        blood_glucose_level: 100,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('age')}</label>
                    <Input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })} min="1" max="120" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('gender')}</label>
                    <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Male">{t('male')}</SelectItem>
                            <SelectItem value="Female">{t('female')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('bmi')}</label>
                    <Input type="number" step="0.1" value={formData.bmi} onChange={(e) => setFormData({ ...formData, bmi: parseFloat(e.target.value) || 0 })} min="0" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('hba1cLevel')}</label>
                    <Input type="number" step="0.1" value={formData.HbA1c_level} onChange={(e) => setFormData({ ...formData, HbA1c_level: parseFloat(e.target.value) || 0 })} min="0" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('bloodGlucoseLevel')}</label>
                    <Input type="number" value={formData.blood_glucose_level} onChange={(e) => setFormData({ ...formData, blood_glucose_level: parseInt(e.target.value) || 0 })} min="0" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('hypertension')}</label>
                    <Select value={String(formData.hypertension)} onValueChange={(v) => setFormData({ ...formData, hypertension: parseInt(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">{t('no')}</SelectItem>
                            <SelectItem value="1">{t('yes')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('heartDiseaseHistory')}</label>
                    <Select value={String(formData.heart_disease)} onValueChange={(v) => setFormData({ ...formData, heart_disease: parseInt(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">{t('no')}</SelectItem>
                            <SelectItem value="1">{t('yes')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('smokingHistory')}</label>
                    <Select value={formData.smoking_history} onValueChange={(v) => setFormData({ ...formData, smoking_history: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="never">{t('never')}</SelectItem>
                            <SelectItem value="former">{t('former')}</SelectItem>
                            <SelectItem value="current">{t('current')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                {t('predictDiabetesRisk')}
            </Button>
        </form>
    );
}

function MentalHealthResult({ result, t }) {
    if (!result) return null;

    const { risk_level, confidence, recommendations } = result;
    const riskColors = {
        Low: 'text-green-600 bg-green-50 border-green-200',
        Moderate: 'text-amber-600 bg-amber-50 border-amber-200',
        High: 'text-red-600 bg-red-50 border-red-200',
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className={`p-4 rounded-xl border-2 ${riskColors[risk_level] || riskColors.Low}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{t('riskLevel')}</span>
                    <Badge variant={risk_level === 'High' ? 'destructive' : risk_level === 'Moderate' ? 'secondary' : 'default'}>
                        {risk_level}
                    </Badge>
                </div>
                {confidence && (
                    <div className="mt-2">
                        <Progress value={confidence * 100} className="h-2" />
                        <p className="text-xs mt-1 opacity-70">{Math.round(confidence * 100)}% {t('confidence').toLowerCase()}</p>
                    </div>
                )}
            </div>

            {recommendations && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-primary" />
                            {t('ayushRecommendations')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recommendations.yoga && (
                            <div>
                                <p className="text-sm font-medium text-primary">{t('yoga')}</p>
                                <p className="text-sm text-muted-foreground">{recommendations.yoga}</p>
                            </div>
                        )}
                        {recommendations.pranayama && (
                            <div>
                                <p className="text-sm font-medium text-primary">{t('pranayama')}</p>
                                <p className="text-sm text-muted-foreground">{recommendations.pranayama}</p>
                            </div>
                        )}
                        {recommendations.meditation && (
                            <div>
                                <p className="text-sm font-medium text-primary">{t('meditation')}</p>
                                <p className="text-sm text-muted-foreground">{recommendations.meditation}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </motion.div>
    );
}

function HeartDiseaseResult({ result, t }) {
    if (!result) return null;

    const { risk_level, risk_score, risk_factors } = result;
    const isHighRisk = risk_level === 'HIGH RISK';

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className={`p-4 rounded-xl border-2 ${isHighRisk ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{t('riskAssessment')}</span>
                    <Badge variant={isHighRisk ? 'destructive' : 'default'}>{risk_level}</Badge>
                </div>
                {risk_score !== undefined && (
                    <div className="mt-2">
                        <Progress value={risk_score * 100} className="h-2" />
                        <p className="text-xs mt-1 opacity-70">{t('riskScore')}: {Math.round(risk_score * 100)}%</p>
                    </div>
                )}
            </div>

            {risk_factors && risk_factors.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            {t('identifiedRiskFactors')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {risk_factors.map((factor, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                    <TrendingUp className="w-3 h-3 text-amber-500" />
                                    {factor}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </motion.div>
    );
}

function DiabetesResult({ result, t }) {
    if (!result) return null;

    const { risk_level, risk_score, recommendations } = result;
    const isHighRisk = risk_level === 'HIGH';

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className={`p-4 rounded-xl border-2 ${isHighRisk ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{t('diabetesRisk')}</span>
                    <Badge variant={isHighRisk ? 'destructive' : 'default'}>{risk_level} {t('riskLevel').toUpperCase()}</Badge>
                </div>
                {risk_score !== undefined && (
                    <div className="mt-2">
                        <Progress value={risk_score * 100} className="h-2" />
                        <p className="text-xs mt-1 opacity-70">{t('riskScore')}: {Math.round(risk_score * 100)}%</p>
                    </div>
                )}
            </div>

            {recommendations && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-primary" />
                            {t('lifestyleRecommendations')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            {typeof recommendations === 'string' ? (
                                <p>{recommendations}</p>
                            ) : (
                                Object.entries(recommendations).map(([key, value]) => (
                                    <div key={key}>
                                        <span className="font-medium text-primary capitalize">{key}: </span>
                                        {Array.isArray(value) ? value.join(', ') : String(value)}
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </motion.div>
    );
}

export default function HealthAssessmentPage() {
    const { t } = useLanguage();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(() => {
        const tab = searchParams.get('tab');
        if (tab === 'mental-health' || tab === 'heart' || tab === 'diabetes') return tab;
        return 'mental-health';
    });
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState({
        mentalHealth: null,
        heartDisease: null,
        diabetes: null,
    });

    const handleMentalHealthSubmit = async (data) => {
        setIsLoading(true);
        try {
            const response = await predictMentalHealth(data);
            setResults(prev => ({ ...prev, mentalHealth: response.data }));
            toast.success('Mental health assessment completed');
        } catch (error) {
            console.error('Mental Health Error:', error);
            toast.error('Failed to assess mental health');
        } finally {
            setIsLoading(false);
        }
    };

    const handleHeartDiseaseSubmit = async (data) => {
        setIsLoading(true);
        try {
            const response = await predictHeartDisease(data);
            setResults(prev => ({ ...prev, heartDisease: response.data }));
            toast.success('Heart disease risk assessment completed');
        } catch (error) {
            console.error('Heart Disease Error:', error);
            toast.error('Failed to predict heart disease risk');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDiabetesSubmit = async (data) => {
        setIsLoading(true);
        try {
            const response = await predictDiabetes(data);
            setResults(prev => ({ ...prev, diabetes: response.data }));
            toast.success('Diabetes risk assessment completed');
        } catch (error) {
            console.error('Diabetes Error:', error);
            toast.error('Failed to predict diabetes risk');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />

            <main className="flex-1 py-6 md:py-8" data-testid="health-assessment-page">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8">
                        <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary mb-2">
                            {t('healthAssessment')}
                        </h1>
                        <p className="text-muted-foreground">{t('healthAssessmentDesc')}</p>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid grid-cols-3 w-full max-w-lg mx-auto">
                            <TabsTrigger value="mental-health" className="gap-2">
                                <Brain className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('mentalHealth')}</span>
                            </TabsTrigger>
                            <TabsTrigger value="heart" className="gap-2">
                                <Heart className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('heartHealth')}</span>
                            </TabsTrigger>
                            <TabsTrigger value="diabetes" className="gap-2">
                                <Activity className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('diabetesRisk')}</span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="bg-white/80 backdrop-blur-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {activeTab === 'mental-health' && <Brain className="w-5 h-5 text-purple-500" />}
                                        {activeTab === 'heart' && <Heart className="w-5 h-5 text-red-500" />}
                                        {activeTab === 'diabetes' && <Activity className="w-5 h-5 text-amber-500" />}
                                        {activeTab === 'mental-health' && t('mentalHealthAssessment')}
                                        {activeTab === 'heart' && t('heartDisease')}
                                        {activeTab === 'diabetes' && t('diabetesPrediction')}
                                    </CardTitle>
                                    <CardDescription>
                                        {activeTab === 'mental-health' && t('mentalHealthDesc')}
                                        {activeTab === 'heart' && t('heartDiseaseDesc')}
                                        {activeTab === 'diabetes' && t('diabetesDesc')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <TabsContent value="mental-health" className="mt-0">
                                        <MentalHealthForm onSubmit={handleMentalHealthSubmit} isLoading={isLoading} t={t} />
                                    </TabsContent>
                                    <TabsContent value="heart" className="mt-0">
                                        <HeartDiseaseForm onSubmit={handleHeartDiseaseSubmit} isLoading={isLoading} t={t} />
                                    </TabsContent>
                                    <TabsContent value="diabetes" className="mt-0">
                                        <DiabetesForm onSubmit={handleDiabetesSubmit} isLoading={isLoading} t={t} />
                                    </TabsContent>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/80 backdrop-blur-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-primary" />
                                        {t('assessmentResults')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {activeTab === 'mental-health' && (
                                        results.mentalHealth ? (
                                            <MentalHealthResult result={results.mentalHealth} t={t} />
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p>{t('completeAssessment')}</p>
                                            </div>
                                        )
                                    )}
                                    {activeTab === 'heart' && (
                                        results.heartDisease ? (
                                            <HeartDiseaseResult result={results.heartDisease} t={t} />
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p>{t('completeAssessment')}</p>
                                            </div>
                                        )
                                    )}
                                    {activeTab === 'diabetes' && (
                                        results.diabetes ? (
                                            <DiabetesResult result={results.diabetes} t={t} />
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p>{t('completeAssessment')}</p>
                                            </div>
                                        )
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </Tabs>

                    <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-amber-800">{t('importantDisclaimer')}</p>
                                <p className="text-sm text-amber-700 mt-1">{t('disclaimerText')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
