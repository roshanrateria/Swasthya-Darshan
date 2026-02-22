import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import HomePage from "@/pages/HomePage";
import ConsultationPage from "@/pages/ConsultationPage";
import DashboardPage from "@/pages/DashboardPage";
import TrendsPage from "@/pages/TrendsPage";
import RecordsPage from "@/pages/RecordsPage";
import HealthAssessmentPage from "@/pages/HealthAssessmentPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DiseasePredictionPage from "@/pages/DiseasePredictionPage";
import AyurvedicAdvicePage from "@/pages/AyurvedicAdvicePage";
import DietCoachPage from "@/pages/DietCoachPage";
import ShareCardPage from "@/pages/ShareCardPage";
import "@/App.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/consult" element={<ConsultationPage />} />
                            <Route path="/assessment" element={<HealthAssessmentPage />} />
                            <Route path="/disease" element={<DiseasePredictionPage />} />
                            <Route path="/advice" element={<AyurvedicAdvicePage />} />
                            <Route path="/diet" element={<DietCoachPage />} />
                            <Route path="/share" element={<ShareCardPage />} />
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/trends" element={<TrendsPage />} />
                            <Route path="/records" element={<RecordsPage />} />
                        </Routes>
                        <Toaster position="top-center" richColors />
                    </BrowserRouter>
                </AuthProvider>
            </LanguageProvider>
        </QueryClientProvider>
    );
}

export default App;
