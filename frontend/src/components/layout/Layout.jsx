
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Home, Stethoscope, BarChart3, FileText, Globe, Activity, User, LogOut,
    Stethoscope as DiseaseIcon, Leaf, UtensilsCrossed, Menu, X
} from 'lucide-react';

export function Header() {
    const { t, language, setLanguage, languages } = useLanguage();
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = [
        { path: '/', label: t('home'), icon: Home },
        { path: '/dashboard', label: t('dashboard'), icon: BarChart3 },
        { path: '/disease', label: t('disease'), icon: DiseaseIcon, group: 'Predict' },
        { path: '/advice', label: t('ayurvedic'), icon: Leaf, group: 'Predict' },
        { path: '/assessment', label: t('assessment'), icon: Activity, group: 'Predict', authRequired: false },
        { path: '/diet', label: 'Diet', icon: UtensilsCrossed, group: 'Predict', authRequired: true },
        { path: '/trends', label: t('epidemicForecasting'), icon: Globe, group: 'Predict', authRequired: false },
        { path: '/records', label: t('records'), icon: FileText, authRequired: true },
        { path: '/consult', label: t('consult'), icon: Stethoscope, authRequired: true },
    ];

    const handleNavClick = (item) => {
        if (item.authRequired && !isAuthenticated) {
            navigate('/login');
        }
        setMobileMenuOpen(false);
    };

    const visibleNavItems = navItems.filter(item => !item.authRequired || isAuthenticated);

    // Show only main items on mobile bottom nav
    const mobileMainItems = visibleNavItems.filter(item =>
        ['/', '/consult', '/records'].includes(item.path)
    );

    return (
        <header className="sticky top-0 z-50 glass border-b border-stone-200/50" data-testid="header">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                            <span className="text-xl text-white font-heading">स्व</span>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="font-heading text-lg font-semibold text-primary">
                                {t('appName')}
                            </h1>
                        </div>
                    </Link>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1" data-testid="nav-menu">
                        {visibleNavItems.filter(item => !item.group).map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link key={item.path} to={item.path} onClick={() => handleNavClick(item)}>
                                    <Button
                                        variant={isActive ? 'default' : 'ghost'}
                                        size="sm"
                                        className={`gap-2 ${isActive ? 'bg-primary text-white' : 'text-muted-foreground hover:text-primary'}`}
                                        data-testid={`nav-${item.path.replace('/', '') || 'home'}`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.label}
                                    </Button>
                                </Link>
                            );
                        })}

                        {/* grouped tools dropdown */}
                        {visibleNavItems.some(item => item.group === 'Predict') && (
                            <div className="relative group/dropdown">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`gap-2 text-muted-foreground hover:text-primary focus:bg-transparent ${visibleNavItems.some(i => i.group === 'Predict' && location.pathname === i.path) ? 'text-primary' : ''
                                        }`}
                                >
                                    <Activity className="w-4 h-4" />
                                    AI Tools
                                </Button>
                                <div className="absolute top-full left-0 mt-1 w-56 rounded-xl bg-white shadow-xl border p-2 opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-50">
                                    <div className="flex flex-col gap-1">
                                        {visibleNavItems.filter(item => item.group === 'Predict').map((item) => {
                                            const Icon = item.icon;
                                            const isActive = location.pathname === item.path;
                                            return (
                                                <Link
                                                    key={item.path}
                                                    to={item.path}
                                                    onClick={() => handleNavClick(item)}
                                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-stone-50 hover:text-primary'}`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    {item.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </nav>

                    {/* Auth / Language - Desktop */}
                    <div className="hidden md:flex items-center gap-2" data-testid="language-selector">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
                                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1">
                                    <LogOut className="w-4 h-4" />
                                    {t('logout')}
                                </Button>
                            </div>
                        ) : (
                            <Link to="/login">
                                <Button variant="outline" size="sm" className="gap-1">
                                    <User className="w-4 h-4" />
                                    {t('login')}
                                </Button>
                            </Link>
                        )}
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-[120px] border-stone-200 bg-white/80" data-testid="language-select-trigger">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent data-testid="language-select-content">
                                {languages.map((lang) => (
                                    <SelectItem
                                        key={lang.code}
                                        value={lang.code}
                                        data-testid={`language-option-${lang.code}`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span>{lang.name}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-stone-200 shadow-lg z-50">
                    <div className="p-4 space-y-2">
                        {visibleNavItems.filter(item => !item.group).map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => handleNavClick(item)}
                                    className={`flex items-center gap-3 p-3 rounded-lg ${isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-stone-50'}`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}

                        {/* Mobile AI Tools Group */}
                        {visibleNavItems.some(item => item.group === 'Predict') && (
                            <div className="pt-2">
                                <p className="px-3 py-1 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                    AI Tools
                                </p>
                                {visibleNavItems.filter(item => item.group === 'Predict').map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => handleNavClick(item)}
                                            className={`flex items-center gap-3 p-3 rounded-lg ${isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-stone-50'}`}
                                        >
                                            <Icon className="w-5 h-5 text-primary/70" />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                        <div className="pt-2 border-t mt-2">
                            {isAuthenticated ? (
                                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-2">
                                    <LogOut className="w-4 h-4" />
                                    {t('logout')}
                                </Button>
                            ) : (
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                                    <Button variant="outline" className="w-full gap-2">
                                        <User className="w-4 h-4" />
                                        {t('login')}
                                    </Button>
                                </Link>
                            )}
                            <div className="mt-2 flex items-center gap-2 p-2">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <Select value={language} onValueChange={setLanguage}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {languages.map((lang) => (
                                            <SelectItem key={lang.code} value={lang.code}>
                                                {lang.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden border-t border-stone-200/50 px-2 py-1 flex justify-around" data-testid="mobile-nav">
                {mobileMainItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link key={item.path} to={item.path} onClick={() => handleNavClick(item)}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`flex-col h-auto py-2 px-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                                data-testid={`mobile-nav-${item.path.replace('/', '') || 'home'}`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[10px] mt-0.5">{item.label}</span>
                            </Button>
                        </Link>
                    );
                })}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="flex-col h-auto py-2 px-2 text-muted-foreground"
                >
                    <Menu className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">More</span>
                </Button>
            </nav>
        </header>
    );
}

export function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="bg-primary text-white py-8" data-testid="footer">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            <span className="text-sm font-heading">स्व</span>
                        </div>
                        <span className="font-heading text-lg">{t('appName')}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-white/80">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                            {t('privacyNote')}
                        </span>
                        <span className="hidden sm:block">•</span>
                        <span>{t('ministryRecognized')}</span>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/20 text-center text-sm text-white/60">
                    © 2026 SWASTHYA DARSHAN | IndiaAI Innovation Challenge
                </div>
            </div>
        </footer>
    );
}