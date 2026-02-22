
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/context/LanguageContext';
import {
    AlertCircle,
    Pill,
    Utensils,
    Activity,
    BookOpen,
    Download,
    Share2,
    Leaf,
    CheckCircle,
    XCircle,
} from 'lucide-react';

// Diagnosis Results Component
export function DiagnosisResults({ diagnosis, isLoading }) {
    const { t } = useLanguage();

    if (isLoading) {
        return (
            <Card className="w-full" data-testid="diagnosis-loading">
                < CardHeader >
                    <CardTitle className="flex items-center gap-2">
                        < div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                        {t('processing')}
                    </CardTitle >
                </CardHeader >
                <CardContent>
                    <div className="space-y-4">
                        <div className="h-8 bg-muted rounded animate-pulse" />
                        <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                        <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                    </div>
                </CardContent >
            </Card >
        );
    }

    if (!diagnosis) return null;

    // Robust parsing and strict DESCENDING sort to fix "least probable displayed" bug if API ever inverts order
    let sortedDiseases = [];
    if (diagnosis.top5_diseases && Array.isArray(diagnosis.top5_diseases)) {
        sortedDiseases = [...diagnosis.top5_diseases].map(item => ({
            disease: Array.isArray(item) ? item[0] : item.disease,
            probability: Array.isArray(item) ? item[1] : (item.probability || 0)
        })).sort((a, b) => b.probability - a.probability);
    }

    // Fallback to diagnosis.top_disease if sortedDiseases array is empty
    const topDiseaseName = sortedDiseases.length > 0 ? sortedDiseases[0].disease : diagnosis.top_disease;
    const topDiseaseProb = sortedDiseases.length > 0 ? sortedDiseases[0].probability : (diagnosis.confidence || 0);
    const confidencePercent = Math.round(topDiseaseProb * 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            data-testid="diagnosis-results"
        >
            <Card className="w-full bg-white/80 backdrop-blur-md shadow-lg">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertCircle className="w-5 h-5 text-primary" />
                        {t('diagnosisResults')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Primary Diagnosis */}
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 bg-white">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                            {t('primaryDiagnosis') || 'Primary Diagnosis'}
                        </p>
                        <h3 className="text-2xl font-heading font-semibold text-primary mb-3 capitalize">
                            {topDiseaseName}
                        </h3>
                        <div className="flex items-center gap-3">
                            <Progress value={confidencePercent} className="flex-1 h-3" />
                            <span className="text-sm font-bold text-primary">{confidencePercent}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{t('confidence') || 'Confidence Score'}</p>
                    </div>

                    {/* Differential Diagnoses */}
                    {sortedDiseases.length > 1 && (
                        <div>
                            <h4 className="text-sm font-medium mb-3">{t('differentialDiagnoses') || 'Differential Diagnoses'}</h4>
                            <div className="space-y-2">
                                {sortedDiseases.slice(1, 5).map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center justify-between p-3 bg-stone-50 border rounded-lg"
                                    >
                                        <span className="text-sm font-medium capitalize">{item.disease}</span>
                                        <Badge variant="outline" className="text-xs font-bold text-primary/80 border-primary/30">
                                            {Math.round(item.probability * 100)}%
                                        </Badge>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

// Treatment Plan Component
export function TreatmentPlan({ treatment, isLoading }) {
    const { t } = useLanguage();

    if (isLoading) {
        return (
            <Card className="w-full" data-testid="treatment-loading">
                < CardHeader >
                    <CardTitle className="flex items-center gap-2">
                        < Leaf className="w-5 h-5 text-primary animate-pulse" />
                        {t('processing')}
                    </CardTitle >
                </CardHeader >
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
                        ))}
                    </div>
                </CardContent >
            </Card >
        );
    }

    if (!treatment) return null;

    const {
        primary_treatment,
        ahara = [],
        vihara = [],
        aushadha = [],
        classical_reference,
        contraindications = [],
        panchakarma = [],
    } = treatment;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            data-testid="treatment-plan"
        >
            <Card className="w-full bg-white/80 backdrop-blur-md shadow-lg">
                < CardHeader className="pb-4">
                    < CardTitle className="flex items-center gap-2 text-lg font-heading">
                        < Leaf className="w-5 h-5 text-primary" />
                        {t('treatmentPlan')}
                    </CardTitle >
                    {primary_treatment && (
                        <Badge className="w-fit bg-primary/10 text-primary border-0">
                            {primary_treatment}
                        </Badge >
                    )
                    }
                </CardHeader >

                <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-6">
                            {/* Aushadha (Medicines) */}
                            {aushadha && aushadha.length > 0 && (
                                <TreatmentSection
                                    icon={<Pill className="w-5 h-5" />}
                                    title={t('aushadha')}
                                    items={aushadha}
                                    variant="medicine"
                                />
                            )}

                            <Separator />

                            {/* Ahara (Diet) */}
                            {ahara && (typeof ahara === 'object') && (
                                <TreatmentSection
                                    icon={<Utensils className="w-5 h-5" />}
                                    title={t('ahara')}
                                    items={ahara}
                                    variant="diet"
                                />
                            )}

                            <Separator />

                            {/* Vihara (Lifestyle) */}
                            {vihara && vihara.length > 0 && (
                                <TreatmentSection
                                    icon={<Activity className="w-5 h-5" />}
                                    title={t('vihara')}
                                    items={vihara}
                                    variant="lifestyle"
                                />
                            )}

                            {/* Panchakarma */}
                            {panchakarma && panchakarma.length > 0 && (
                                <>
                                    <Separator />
                                    <div className="space-y-3">
                                        <h4 className="font-medium flex items-center gap-2 text-amber-700">
                                            <Activity className="w-5 h-5" />
                                            Panchakarma (Cleansing Therapies)
                                        </h4>
                                        <div className="grid gap-2">
                                            {panchakarma.map((item, idx) => (
                                                <div key={idx} className="p-3 bg-amber-50 rounded-lg text-sm">
                                                    {item}
                                                </div>
                                            ))}
                                        </div >
                                    </div >
                                </>
                            )}

                            {/* Contraindications */}
                            {
                                contraindications && contraindications.length > 0 && (
                                    <>
                                        <Separator />
                                        <div className="space-y-3">
                                            <h4 className="font-medium flex items-center gap-2 text-red-600">
                                                <XCircle className="w-5 h-5" />
                                                Contraindications
                                            </h4 >
                                            <div className="grid gap-2">
                                                {
                                                    contraindications.map((item, idx) => (
                                                        <div key={idx} className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
                                                            {item}
                                                        </div >
                                                    ))
                                                }
                                            </div >
                                        </div >
                                    </>
                                )
                            }

                            {/* Classical Reference */}
                            {
                                classical_reference && (
                                    <>
                                        <Separator />
                                        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                                            <div className="flex items-start gap-3">
                                                <BookOpen className="w-5 h-5 text-stone-600 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-stone-700">{t('classicalReference')}</p>
                                                    <p className="text-sm text-stone-600 mt-1 italic font-heading">
                                                        "{classical_reference}"
                                                    </p >
                                                </div >
                                            </div >
                                        </div >
                                    </>
                                )
                            }
                        </div >
                    </ScrollArea >

                    {/* Actions */}
                    < div className="flex gap-3 mt-6 pt-4 border-t">
                        < Button variant="outline" className="flex-1 gap-2" data-testid="download-report">
                            < Download className="w-4 h-4" />
                            {t('downloadReport')}
                        </Button >
                        <Button variant="outline" className="flex-1 gap-2" data-testid="share-report">
                            < Share2 className="w-4 h-4" />
                            {t('share')}
                        </Button >
                    </div >
                </CardContent >
            </Card >
        </motion.div >
    );
}

// Treatment Section Component
function TreatmentSection({ icon, title, items, variant }) {
    const renderItems = () => {
        if (variant === 'diet' && typeof items === 'object' && !Array.isArray(items)) {
            const { recommended = [], avoid = [] } = items;
            return (
                <div className="space-y-3">
                    {
                        recommended.length > 0 && (
                            <div className="space-y-2">
                                < p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                    < CheckCircle className="w-3 h-3" /> Recommended
                                </p >
                                <div className="flex flex-wrap gap-2">
                                    {
                                        recommended.map((item, idx) => (
                                            <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                {item}
                                            </Badge >
                                        ))
                                    }
                                </div >
                            </div >
                        )
                    }
                    {
                        avoid.length > 0 && (
                            <div className="space-y-2">
                                < p className="text-xs text-red-600 font-medium flex items-center gap-1">
                                    < XCircle className="w-3 h-3" /> Avoid
                                </p >
                                <div className="flex flex-wrap gap-2">
                                    {
                                        avoid.map((item, idx) => (
                                            <Badge key={idx} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                {item}
                                            </Badge >
                                        ))
                                    }
                                </div >
                            </div >
                        )
                    }
                </div >
            );
        }

        if (Array.isArray(items)) {
            return (
                <div className="grid gap-2">
                    {
                        items.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`p-3 rounded-lg text-sm ${variant === 'medicine' ? 'bg-blue-50 text-blue-800' :
                                    variant === 'lifestyle' ? 'bg-purple-50 text-purple-800' :
                                        'bg-green-50 text-green-800'
                                    }`}
                            >
                                {typeof item === 'object' ? (
                                    <div>
                                        <span className="font-medium">{item.name || item.medicine}</span>
                                        {item.dosage && <span className="text-xs ml-2 opacity-75">{item.dosage}</span>}
                                    </div >
                                ) : (
                                    item
                                )
                                }
                            </motion.div >
                        ))}
                </div >
            );
        }

        return null;
    };

    return (
        <div className="space-y-3">
            < h4 className="font-medium flex items-center gap-2 text-primary">
                {icon}
                {title}
            </h4 >
            {renderItems()}
        </div >
    );
}

// Symptoms Chips Component
export function SymptomsChips({ symptoms, onRemove }) {
    if (!symptoms || symptoms.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2" data-testid="symptoms-chips">
            {
                symptoms.map((symptom, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        <Badge
                            variant="secondary"
                            className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                            onClick={() => onRemove?.(symptom)}
                        >
                            {symptom}
                            {onRemove && <XCircle className="w-3 h-3 ml-1" />}
                        </Badge>
                    </motion.div >
                ))
            }
        </div >
    );
}