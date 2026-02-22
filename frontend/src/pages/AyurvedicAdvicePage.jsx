import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header, Footer } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/context/LanguageContext';
import { getAyurvedicTreatment } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Leaf, Pill, Utensils, Activity, Info } from 'lucide-react';

export default function AyurvedicAdvicePage() {
    const { t } = useLanguage();
    const [symptomsText, setSymptomsText] = useState('');
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGetAdvice = async () => {
        if (!symptomsText.trim()) {
            toast.error(t('describeYourSymptomsFirst'));
            return;
        }
        setIsLoading(true);
        try {
            const response = await getAyurvedicTreatment(symptomsText);
            setResult(response.data);
            toast.success(t('ayurvedicTreatmentGenerated'));
        } catch (error) {
            console.error('Treatment Error:', error);
            toast.error(t('failedToGetTreatment'));
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
                            {t('ayurvedicTreatmentAdvice')}
                        </h1>
                        <p className="text-muted-foreground">
                            {t('getPersonalizedAyurvedic')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-white/80 backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Leaf className="w-5 h-5 text-primary" />
                                    {t('describeYourSymptoms')}
                                </CardTitle>
                                <CardDescription>
                                    {t('explainExperiencing')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <textarea
                                    placeholder={t('symptomsPlaceholder')}
                                    value={symptomsText}
                                    onChange={(e) => setSymptomsText(e.target.value)}
                                    className="min-h-[150px] w-full p-3 border rounded-lg text-sm resize-none"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t('includeDurationSeverity')}
                                </p>
                                <Button onClick={handleGetAdvice} disabled={isLoading || !symptomsText.trim()} className="w-full gap-2">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Leaf className="w-4 h-4" />}
                                    {t('getAyurvedicTreatment')}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/80 backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Pill className="w-5 h-5 text-primary" />
                                    {t('treatmentPlan')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {result ? (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                        {result.primary_treatment && (
                                            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 mb-4">
                                                <p className="text-sm text-muted-foreground mb-1">{t('primaryTreatment')}</p>
                                                <p className="font-medium text-primary">{result.primary_treatment}</p>
                                            </div>
                                        )}

                                        <ScrollArea className="h-[400px] pr-4">
                                            <div className="space-y-4">
                                                {result.aushadha && Array.isArray(result.aushadha) && result.aushadha.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                                            <Pill className="w-4 h-4 text-blue-500" />
                                                            {t('aushadhaMedicines')}
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {result.aushadha.map((item, idx) => (
                                                                <div key={idx} className="p-2 bg-blue-50 rounded-lg text-sm">
                                                                    {typeof item === 'object' ? (
                                                                        <div>
                                                                            <span className="font-medium">{item.name || item.medicine || item}</span>
                                                                            {item.dosage && <span className="text-xs ml-2 opacity-70">- {item.dosage}</span>}
                                                                        </div>
                                                                    ) : item}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {result.ahara && (
                                                    <>
                                                        <Separator />
                                                        <div>
                                                            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                                                <Utensils className="w-4 h-4 text-green-500" />
                                                                {t('aharaDiet')}
                                                            </h4>
                                                            {typeof result.ahara === 'object' ? (
                                                                <div className="space-y-2">
                                                                    {result.ahara.recommended && Array.isArray(result.ahara.recommended) && result.ahara.recommended.length > 0 && (
                                                                        <div>
                                                                            <p className="text-xs text-green-600 font-medium">{t('recommended')}:</p>
                                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                                {result.ahara.recommended.map((item, idx) => (
                                                                                    <Badge key={idx} variant="outline" className="bg-green-50 text-green-700">{item}</Badge>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {result.ahara.avoid && Array.isArray(result.ahara.avoid) && result.ahara.avoid.length > 0 && (
                                                                        <div className="mt-2">
                                                                            <p className="text-xs text-red-600 font-medium">{t('avoid')}:</p>
                                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                                {result.ahara.avoid.map((item, idx) => (
                                                                                    <Badge key={idx} variant="outline" className="bg-red-50 text-red-700">{item}</Badge>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground">{result.ahara}</p>
                                                            )}
                                                        </div>
                                                    </>
                                                )}

                                                {result.vihara && Array.isArray(result.vihara) && result.vihara.length > 0 && (
                                                    <>
                                                        <Separator />
                                                        <div>
                                                            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                                                <Activity className="w-4 h-4 text-purple-500" />
                                                                {t('viharaLifestyle')}
                                                            </h4>
                                                            <div className="space-y-1">
                                                                {Array.isArray(result.vihara) && result.vihara.map((item, idx) => (
                                                                    <div key={idx} className="p-2 bg-purple-50 rounded-lg text-sm flex items-center gap-2">
                                                                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                                                                        {item}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {result.classical_reference && (
                                                    <>
                                                        <Separator />
                                                        <div className="p-3 bg-stone-50 rounded-lg">
                                                            <p className="text-xs text-muted-foreground mb-1">{t('classicalReference')}</p>
                                                            <p className="text-sm italic">"{result.classical_reference}"</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </ScrollArea>

                                        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                                            <div className="flex items-start gap-2">
                                                <Info className="w-4 h-4 mt-0.5" />
                                                <p>{t('consultPractitionerBeforeTreatment')}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Leaf className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p>{t('describeSymptomsForAdvice')}</p>
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
