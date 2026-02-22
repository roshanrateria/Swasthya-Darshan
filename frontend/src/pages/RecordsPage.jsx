
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header, Footer } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getHealthRecords, getAssessments, deleteAssessment, getInteractions, deleteInteraction, getAdvices, deleteAdvice } from '@/lib/api';
import { toast } from 'sonner';
import {
    FileText,
    Calendar,
    User,
    Stethoscope,
    Pill,
    Clock,
    Download,
    Share2,
    CheckCircle,
    ChevronRight,
    Search,
    Filter,
    Brain,
    Heart,
    Activity,
    MessageSquare,
    Trash2,
    AlertTriangle,
    X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

function AssessmentCard({ assessment, onDelete, t }) {
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const typeIcons = { mental_health: Brain, heart_disease: Heart, diabetes: Activity, disease_prediction: Stethoscope };
    const TypeIcon = typeIcons[assessment.assessment_type] || Activity;

    const riskColors = {
        'Low': 'bg-green-50 text-green-700 border-green-200',
        'HIGH RISK': 'bg-red-50 text-red-700 border-red-200',
        'HIGH': 'bg-red-50 text-red-700 border-red-200',
        'Moderate': 'bg-amber-50 text-amber-700 border-amber-200',
    };

    const needsReassessment = assessment.risk_score && assessment.risk_score < 0.7;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border p-4 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <TypeIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-medium text-sm capitalize">{assessment.assessment_type.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(assessment.created_at)}</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onDelete(assessment.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
            {assessment.risk_level && (
                <Badge className={`mt-3 ${riskColors[assessment.risk_level] || 'bg-gray-50'}`}>
                    {assessment.risk_level} ({Math.round((assessment.risk_score || 0) * 100)}%)
                </Badge>
            )}
            {needsReassessment && (
                <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {t('reassessmentReminder')}
                </div>
            )}
        </motion.div>
    );
}

function InteractionCard({ interaction, onDelete, t }) {
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const messages = typeof interaction.messages === 'string' ? JSON.parse(interaction.messages) : interaction.messages || [];
    const msgCount = messages.length;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border p-4 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <p className="font-medium text-sm">Consultation Session</p>
                        <p className="text-xs text-muted-foreground">{formatDate(interaction.created_at)}</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onDelete(interaction.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{msgCount} messages exchanged</p>
        </motion.div>
    );
}

function AdviceCard({ advice, onDelete, t }) {
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const content = typeof advice.content === 'string' ? JSON.parse(advice.content) : advice.content || {};

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border p-4 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Pill className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="font-medium text-sm">{advice.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(advice.created_at)}</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onDelete(advice.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
            {content.primary_treatment && (
                <Badge className="mt-2 bg-green-50 text-green-700">{content.primary_treatment}</Badge>
            )}
        </motion.div>
    );
}

function HealthRecordCard({ record, onClick }) {
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01 }} className="cursor-pointer" onClick={onClick}>
            <Card className="bg-white/80 backdrop-blur-md hover:shadow-lg transition-all">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">{record.patient_id}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(record.created_at)}
                                </p>
                            </div>
                        </div>
                        <Badge variant="outline" className={`text-xs ${record.confidence > 0.8 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {Math.round(record.confidence * 100)}% confidence
                        </Badge>
                    </div>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">{record.diagnosis}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{record.chief_complaints}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {record.symptoms?.slice(0, 3).map((symptom, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs px-2 py-0">{symptom}</Badge>
                            ))}
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>Follow-up: {record.follow_up}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function RecordDetailView({ record, onClose }) {
    const { t } = useLanguage();
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="bg-primary text-white p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-heading text-xl font-semibold">{t('healthRecord')}</h2>
                            <p className="text-white/80 text-sm mt-1">{record.patient_id}</p>
                        </div>
                        <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/20"><X className="w-5 h-5" /></Button>
                    </div>
                </div>
                <ScrollArea className="h-[calc(90vh-200px)] p-6">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl">
                            <div><p className="text-xs text-muted-foreground">{t('patientId')}</p><p className="font-mono font-medium">{record.patient_id}</p></div>
                            <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{formatDate(record.created_at)}</p></div>
                        </div>
                        <div><h3 className="font-medium flex items-center gap-2 mb-2"><User className="w-4 h-4 text-primary" />{t('chiefComplaints')}</h3><p className="text-sm bg-stone-50 p-3 rounded-lg italic">"{record.chief_complaints}"</p></div>
                        <div><h3 className="font-medium flex items-center gap-2 mb-2"><Stethoscope className="w-4 h-4 text-primary" />{t('symptomsExtracted')}</h3><div className="flex flex-wrap gap-2">{record.symptoms?.map((s, i) => <Badge key={i} variant="outline" className="bg-primary/5">{s}</Badge>)}</div></div>
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                            <h3 className="font-medium mb-2">Diagnosis</h3>
                            <div className="flex items-center justify-between"><span className="text-lg font-heading font-semibold text-primary">{record.diagnosis}</span><Badge className="bg-primary">{Math.round(record.confidence * 100)}% confidence</Badge></div>
                        </div>
                        <div><h3 className="font-medium flex items-center gap-2 mb-3"><Pill className="w-4 h-4 text-primary" />{t('treatment')}</h3>{record.treatment && <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">{JSON.stringify(record.treatment, null, 2)}</pre>}</div>
                    </div>
                </ScrollArea>
                <div className="p-4 border-t flex gap-3">
                    <Button variant="outline" className="flex-1 gap-2"><Download className="w-4 h-4" />Download</Button>
                    <Button onClick={onClose}>Close</Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function RecordsPage() {
    const { t } = useLanguage();
    const { isAuthenticated } = useAuth();
    const [records, setRecords] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [interactions, setInteractions] = useState([]);
    const [advices, setAdvices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, [isAuthenticated]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [recordsRes] = await Promise.all([getHealthRecords()]);
            setRecords(recordsRes.data || []);

            if (isAuthenticated) {
                const [assessRes, interRes, advicesRes] = await Promise.all([
                    getAssessments(),
                    getInteractions(),
                    getAdvices()
                ]);
                setAssessments(assessRes.data || []);
                setInteractions(interRes.data || []);
                setAdvices(advicesRes.data || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAssessment = async (id) => {
        try {
            await deleteAssessment(id);
            setAssessments(prev => prev.filter(a => a.id !== id));
            toast.success('Assessment deleted');
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const handleDeleteInteraction = async (id) => {
        try {
            await deleteInteraction(id);
            setInteractions(prev => prev.filter(i => i.id !== id));
            toast.success('Consultation deleted');
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const handleDeleteAdvice = async (id) => {
        try {
            await deleteAdvice(id);
            setAdvices(prev => prev.filter(a => a.id !== id));
            toast.success('Advice deleted');
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const filteredRecords = records.filter(r =>
        r.patient_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.chief_complaints?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 py-6 md:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary">{t('viewRecords')}</h1>
                            <p className="text-muted-foreground mt-1">Your health history and assessments</p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64" />
                        </div>
                    </div>

                    <Tabs defaultValue="records" className="space-y-6 w-full">
                        <div className="w-full overflow-x-auto pb-2 scrollbar-none">
                            <TabsList className="w-max inline-flex">
                                <TabsTrigger value="records" className="gap-2"><FileText className="w-4 h-4" />Health Records</TabsTrigger>
                                {isAuthenticated && (
                                    <>
                                        <TabsTrigger value="assessments" className="gap-2"><Activity className="w-4 h-4" />{t('myAssessments')}</TabsTrigger>
                                        <TabsTrigger value="consultations" className="gap-2"><MessageSquare className="w-4 h-4" />{t('myInteractions')}</TabsTrigger>
                                        <TabsTrigger value="advices" className="gap-2"><Pill className="w-4 h-4" />{t('myAdvices')}</TabsTrigger>
                                    </>
                                )}
                            </TabsList>
                        </div>

                        <TabsContent value="records">
                            {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[1, 2, 3, 4, 5, 6].map(i => <Card key={i} className="h-48"><CardContent className="p-4"><div className="animate-pulse space-y-3"><div className="h-10 bg-muted rounded" /><div className="h-4 bg-muted rounded w-3/4" /><div className="h-8 bg-muted rounded" /></div></CardContent></Card>)}
                                </div>
                            ) : filteredRecords.length === 0 ? (
                                <Card className="p-12 text-center"><FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><h3 className="font-medium text-lg mb-2">No Records Found</h3><p className="text-muted-foreground">Start a consultation to create your first health record</p></Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredRecords.map((record, idx) => <HealthRecordCard key={record.id || idx} record={record} onClick={() => setSelectedRecord(record)} />)}
                                </div>
                            )}
                        </TabsContent>

                        {isAuthenticated && (
                            <>
                                <TabsContent value="assessments">
                                    {assessments.length === 0 ? (
                                        <Card className="p-12 text-center"><Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p>No assessments yet. Take a health assessment to see results here.</p></Card>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {assessments.map(a => <AssessmentCard key={a.id} assessment={a} onDelete={handleDeleteAssessment} t={t} />)}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="consultations">
                                    {interactions.length === 0 ? (
                                        <Card className="p-12 text-center"><MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p>No consultations yet. Start a chat with Dr. AYUSH.</p></Card>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {interactions.map(i => <InteractionCard key={i.id} interaction={i} onDelete={handleDeleteInteraction} t={t} />)}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="advices">
                                    {advices.length === 0 ? (
                                        <Card className="p-12 text-center"><Pill className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p>No advices yet. Get Ayurvedic treatment recommendations.</p></Card>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {advices.map(a => <AdviceCard key={a.id} advice={a} onDelete={handleDeleteAdvice} t={t} />)}
                                        </div>
                                    )}
                                </TabsContent>
                            </>
                        )}
                    </Tabs>
                </div>
            </main>

            <AnimatePresence>
                {selectedRecord && <RecordDetailView record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
            </AnimatePresence>

            <Footer />
        </div>
    );
}
