import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header, Footer } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/LanguageContext';
import { predictDisease } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Stethoscope, AlertCircle, Info } from 'lucide-react';

const COMMON_SYMPTOMS = [
    'fever', 'headache', 'cough', 'cold', 'fatigue', 'nausea', 'vomiting',
    'diarrhea', 'body pain', 'joint pain', 'stomach pain', 'chest pain',
    'dizziness', 'sore throat', 'rash', 'itching', 'breathing difficulty'
];

export default function DiseasePredictionPage() {
    const { t } = useLanguage();
    const [symptoms, setSymptoms] = useState([]);
    const [customSymptom, setCustomSymptom] = useState('');
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const addSymptom = (symptom) => {
        if (symptom && !symptoms.includes(symptom.toLowerCase())) {
            setSymptoms([...symptoms, symptom.toLowerCase()]);
            setCustomSymptom('');
        }
    };

    const removeSymptom = (symptom) => {
        setSymptoms(symptoms.filter(s => s !== symptom));
    };

    const handlePredict = async () => {
        if (symptoms.length === 0) {
            toast.error(t('addAtLeastOneSymptom'));
            return;
        }
        setIsLoading(true);
        try {
            const response = await predictDisease(symptoms);
            setResult(response.data);
            toast.success(t('diseasePredictionCompleted'));
        } catch (error) {
            console.error('Prediction Error:', error);
            toast.error(t('failedToPredictDisease'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 py-6 md:py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8">
                        <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary mb-2">
                            {t('diseasePredictionPage')}
                        </h1>
                        <p className="text-muted-foreground">
                            {t('enterSymptomsToPredict')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-white/80 backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Stethoscope className="w-5 h-5 text-primary" />
                                    {t('enterSymptomsToPredict')}
                                </CardTitle>
                                <CardDescription>
                                    {t('selectOrTypeSymptoms')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={t('selectOrTypeSymptoms')}
                                        value={customSymptom}
                                        onChange={(e) => setCustomSymptom(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addSymptom(customSymptom)}
                                    />
                                    <Button onClick={() => addSymptom(customSymptom)}>{t('add')}</Button>
                                </div>

                                <div>
                                    <p className="text-sm font-medium mb-2">{t('commonSymptoms')}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {COMMON_SYMPTOMS.map(symptom => (
                                            <Button
                                                key={symptom}
                                                variant={symptoms.includes(symptom) ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => symptoms.includes(symptom) ? removeSymptom(symptom) : addSymptom(symptom)}
                                            >
                                                {symptom}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {symptoms.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">{t('selectedSymptoms')}:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {symptoms.map(symptom => (
                                                <Badge key={symptom} variant="secondary" className="px-3 py-1">
                                                    {symptom}
                                                    <button onClick={() => removeSymptom(symptom)} className="ml-2 text-xs">×</button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <Button onClick={handlePredict} disabled={isLoading || symptoms.length === 0} className="w-full gap-2">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4" />}
                                    {t('predictDiseaseBtn')}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/80 backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-primary" />
                                    {t('predictionResults')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {result ? (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                                            <p className="text-sm text-muted-foreground mb-1">{t('mostLikelyCondition')}</p>
                                            <h3 className="text-xl font-heading font-semibold text-primary">
                                                {result.top_disease}
                                            </h3>
                                            <p className="text-sm mt-2">
                                                {t('confidence')}: <span className="font-medium">{Math.round((result.confidence || 0) * 100)}%</span>
                                            </p>
                                        </div>

                                        {result.top5_diseases && result.top5_diseases.length > 1 && (
                                            <div>
                                                <p className="text-sm font-medium mb-2">{t('otherPossibilities')}:</p>
                                                <div className="space-y-2">
                                                    {result.top5_diseases.slice(1).map((item, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                                            <span className="text-sm">{Array.isArray(item) ? item[0] : item.disease}</span>
                                                            <Badge variant="outline">{Math.round((Array.isArray(item) ? item[1] : item.probability || 0) * 100)}%</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                                            <div className="flex items-start gap-2">
                                                <Info className="w-4 h-4 mt-0.5" />
                                                <p>{t('aiPredictionConsultDoctor')}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p>{t('addSymptomsToSeeResults')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
