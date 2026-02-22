import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header, Footer } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/context/LanguageContext';
import { predictEpidemic } from '@/lib/api';
import { toast } from 'sonner';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';
import {
    AlertTriangle,
    TrendingUp,
    MapPin,
    Bell,
    Download,
    Send,
    Activity,
    Thermometer,
    Droplets,
    Wind,
    Calendar,
    Leaf,
} from 'lucide-react';

// Sample India state data with coordinates
const INDIA_STATES = [
    { name: 'Maharashtra', code: 'MH', risk: 'high', cases: 2450, trend: '+34%' },
    { name: 'Karnataka', code: 'KA', risk: 'medium', cases: 890, trend: '+12%' },
    { name: 'Tamil Nadu', code: 'TN', risk: 'medium', cases: 720, trend: '+8%' },
    { name: 'Kerala', code: 'KL', risk: 'low', cases: 340, trend: '-5%' },
    { name: 'Delhi', code: 'DL', risk: 'high', cases: 1890, trend: '+28%' },
    { name: 'Uttar Pradesh', code: 'UP', risk: 'medium', cases: 1200, trend: '+15%' },
    { name: 'West Bengal', code: 'WB', risk: 'medium', cases: 650, trend: '+10%' },
    { name: 'Gujarat', code: 'GJ', risk: 'low', cases: 420, trend: '-2%' },
];

// Sample historical data for charts
const generateHistoricalData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, idx) => ({
        month,
        dengue: Math.floor(50 + Math.random() * 400 + (idx > 5 && idx < 10 ? 200 : 0)),
        malaria: Math.floor(30 + Math.random() * 200),
        chikungunya: Math.floor(20 + Math.random() * 150),
    }));
};

// Alert Card Component
function AlertCard({ alert }) {
    const riskColors = {
        high: 'bg-red-100 border-red-300 text-red-800',
        medium: 'bg-amber-100 border-amber-300 text-amber-800',
        low: 'bg-green-100 border-green-300 text-green-800',
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-4 rounded-xl border-2 ${riskColors[alert.risk]}`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">{alert.disease}</span>
                    </div>
                    <p className="text-sm opacity-80">{alert.location}</p>
                </div>
                <Badge variant={alert.risk === 'high' ? 'destructive' : 'secondary'}>
                    {alert.risk.toUpperCase()}
                </Badge>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {alert.cases} cases
                </span>
                <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {alert.trend}
                </span>
            </div>
        </motion.div>
    );
}

// State Risk Card
function StateRiskCard({ state }) {
    const riskColors = {
        high: 'border-red-400 bg-red-50',
        medium: 'border-amber-400 bg-amber-50',
        low: 'border-green-400 bg-green-50',
    };

    return (
        <Card className={`border-2 ${riskColors[state.risk]}`}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{state.name}</span>
                    <Badge variant="outline" className="text-xs">{state.code}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span>{state.cases.toLocaleString()} cases</span>
                    <span className={state.trend.startsWith('+') ? 'text-red-600' : 'text-green-600'}>
                        {state.trend}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

// Ritucharya Advisory Component
function RitucharaAdvisory() {
    const getCurrentSeason = () => {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 5) return { season: 'Grishma (Summer)', icon: Thermometer };
        if (month >= 6 && month <= 9) return { season: 'Varsha (Monsoon)', icon: Droplets };
        return { season: 'Shishira (Winter)', icon: Wind };
    };

    const { season, icon: SeasonIcon } = getCurrentSeason();

    const recommendations = [
        'Distribute Giloy (Guduchi) tablets to high-risk areas',
        'Conduct community awareness on water storage hygiene',
        'Deploy fogging operations in identified hotspots',
        'Activate PHC surveillance teams in affected districts',
        'Stock up on ORS and antipyretics at all centers',
    ];

    return (
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-heading">
                    <Leaf className="w-5 h-5 text-primary" />
                    Ritucharya Advisory
                </CardTitle>
                <div className="flex items-center gap-2">
                    <SeasonIcon className="w-4 h-4 text-secondary" />
                    <span className="text-sm text-muted-foreground">{season}</span>
                </div>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {recommendations.map((rec, idx) => (
                        <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-2 text-sm"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                            <span>{rec}</span>
                        </motion.li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

export default function TrendsPage() {
    const { t } = useLanguage();
    const [historicalData] = useState(generateHistoricalData());
    const [forecastData, setForecastData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDisease, setSelectedDisease] = useState('dengue');

    // Sample alerts
    const alerts = [
        { disease: 'Dengue', location: 'Mumbai Ward 23', risk: 'high', cases: 450, trend: '+45%' },
        { disease: 'Dengue', location: 'Pune District', risk: 'medium', cases: 120, trend: '+18%' },
        { disease: 'Malaria', location: 'Kolkata South', risk: 'medium', cases: 85, trend: '+12%' },
        { disease: 'Chikungunya', location: 'Chennai Zone 4', risk: 'low', cases: 35, trend: '-5%' },
    ];

    // Get epidemic forecast
    const handleGetForecast = async () => {
        setIsLoading(true);
        try {
            // Use historical data for prediction
            const monthlyCases = historicalData.map(d => d[selectedDisease]);
            const response = await predictEpidemic(monthlyCases);
            setForecastData(response.data);
            toast.success('Forecast updated successfully');
        } catch (error) {
            console.error('Forecast Error:', error);
            toast.error('Failed to get forecast');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />

            <main className="flex-1 py-6 md:py-8" data-testid="dashboard-page">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary">
                                {t('publicHealth')}
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Real-time epidemic surveillance and forecasting
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="gap-2" data-testid="download-report-btn">
                                <Download className="w-4 h-4" />
                                {t('downloadReport')}
                            </Button>
                            <Button className="gap-2" data-testid="send-alert-btn">
                                <Send className="w-4 h-4" />
                                {t('sendAlert')}
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Active Outbreaks', value: '12', icon: AlertTriangle, color: 'text-red-500' },
                            { label: 'States Affected', value: '8', icon: MapPin, color: 'text-amber-500' },
                            { label: 'Total Cases (7d)', value: '4,250', icon: Activity, color: 'text-blue-500' },
                            { label: 'Alerts Sent', value: '156', icon: Bell, color: 'text-green-500' },
                        ].map((stat, idx) => (
                            <Card key={idx}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-bold font-heading">{stat.value}</p>
                                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                                        </div>
                                        <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Chart Area */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Disease Trends Chart */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">Disease Trends (2025-2026)</CardTitle>
                                        <Tabs value={selectedDisease} onValueChange={setSelectedDisease}>
                                            <TabsList className="h-8">
                                                <TabsTrigger value="dengue" className="text-xs">Dengue</TabsTrigger>
                                                <TabsTrigger value="malaria" className="text-xs">Malaria</TabsTrigger>
                                                <TabsTrigger value="chikungunya" className="text-xs">Chikungunya</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={historicalData}>
                                                <defs>
                                                    <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#2D5F3F" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#2D5F3F" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip />
                                                <Area
                                                    type="monotone"
                                                    dataKey={selectedDisease}
                                                    stroke="#2D5F3F"
                                                    strokeWidth={2}
                                                    fillOpacity={1}
                                                    fill="url(#colorCases)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between">
                                        <Button
                                            onClick={handleGetForecast}
                                            disabled={isLoading}
                                            className="gap-2"
                                            data-testid="get-forecast-btn"
                                        >
                                            <Calendar className="w-4 h-4" />
                                            {isLoading ? 'Predicting...' : 'Predict Next Month'}
                                        </Button>

                                        {forecastData && (
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Predicted Cases</p>
                                                    <p className="font-bold text-lg">{Math.round(forecastData.forecast_cases)}</p>
                                                </div>
                                                <Badge variant={forecastData.risk_level === 'HIGH' ? 'destructive' : 'secondary'}>
                                                    {forecastData.risk_level} RISK
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* State-wise Distribution */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">State-wise Distribution</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {INDIA_STATES.map((state, idx) => (
                                            <motion.div
                                                key={state.code}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                            >
                                                <StateRiskCard state={state} />
                                            </motion.div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Active Alerts */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                        {t('activeAlerts')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {alerts.map((alert, idx) => (
                                        <AlertCard key={idx} alert={alert} />
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Ritucharya Advisory */}
                            <RitucharaAdvisory />
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
