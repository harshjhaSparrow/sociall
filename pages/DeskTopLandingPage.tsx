import {
    ArrowRight,
    ChevronDown,
    Globe,
    Heart,
    MapPin,
    Menu,
    MessageCircle,
    QrCode,
    Shield,
    Sparkles,
    Star,
    Users,
    X,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';
import Button from '../components/ui/Button';
import { MainLogo } from '../util/Images';

const DesktopLanding: React.FC = () => {
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleFaq = (index: number) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 overflow-x-hidden selection:bg-primary-500/30 font-sans">

            {/* Navigation */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center">
                        <img
                            src={MainLogo}
                            alt="Orbyt Logo"
                            className="h-12 w-auto object-contain hover:scale-105 transition-transform duration-200"
                        />
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex gap-8 text-slate-400 text-sm font-medium items-center">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
                        <a href="#safety" className="hover:text-white transition-colors">Safety</a>
                        <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
                        <Button variant="primary" className="rounded-full px-6 h-10 text-sm ml-4">
                            Get the App
                        </Button>
                    </div>

                    {/* Mobile Menu Button (Visible on tablet/small laptops that trigger desktop view but have narrow screens) */}
                    <button className="md:hidden text-slate-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[30%] right-[10%] w-96 h-96 bg-primary-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16 relative z-10">
                    <div className="flex-1 space-y-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-primary-400 text-xs font-bold uppercase tracking-wider animate-fade-in">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>The #1 Social Discovery App.</span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white">
                            Your World, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-pink-500 to-purple-500">
                                Connected Live
                            </span>
                        </h1>

                        <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                            Orbyt bridges the gap between digital interactions and real-world connections. Discover who's nearby, join local conversations, and make meaningful friendships instantly.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-4">
                            <div className="flex items-center gap-4 p-1 pr-6 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors group cursor-pointer">
                                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center">
                                    <QrCode className="w-10 h-10 text-slate-900" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Scan to Launch</p>
                                    <p className="font-bold text-white text-lg group-hover:text-primary-400 transition-colors">Open Web App</p>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center text-left space-y-2">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 overflow-hidden`}>
                                            <img src={`https://i.pravatar.cc/100?img=${10 + i}`} alt="User" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                    <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                                        +2k
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500">Join 2,000+ people exploring today</p>
                            </div>
                        </div>
                    </div>

                    {/* Phone Mockup with floating elements */}
                    <div className="flex-1 relative w-full max-w-[400px] lg:max-w-none">
                        <div className="relative mx-auto border-slate-800 bg-slate-950 border-[8px] rounded-[3rem] h-[700px] w-[350px] shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-700/50">
                            {/* Notch */}
                            <div className="absolute top-0 inset-x-0 h-6 bg-slate-950 z-20 rounded-b-xl w-40 mx-auto"></div>

                            <div className="rounded-[2.5rem] overflow-hidden w-full h-full bg-slate-900 relative">
                                {/* Mock Map UI */}
                                <div className="absolute inset-0 bg-slate-800">
                                    {/* Map Background Pattern */}
                                    <div className="w-full h-full opacity-30" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                                    {/* Mock Pins */}
                                    <div className="absolute top-1/4 left-1/4 animate-bounce duration-[3000ms]">
                                        <div className="w-12 h-12 rounded-full border-2 border-white bg-blue-500 overflow-hidden shadow-lg relative z-10">
                                            <img src="https://i.pravatar.cc/100?img=33" alt="User" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white"></div>
                                    </div>

                                    <div className="absolute top-1/2 right-1/3 animate-bounce duration-[2500ms]">
                                        <div className="w-12 h-12 rounded-full border-2 border-white bg-primary-500 overflow-hidden shadow-lg relative z-10">
                                            <img src="https://i.pravatar.cc/100?img=47" alt="User" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white"></div>
                                    </div>

                                    {/* Bottom Card Mock */}
                                    <div className="absolute bottom-6 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500">
                                                <MapPin className="w-5 h-5 fill-current" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">3 Friends Nearby</h4>
                                                <p className="text-xs text-slate-400">Within 2km range</p>
                                            </div>
                                            <div className="ml-auto px-3 py-1.5 bg-primary-600 rounded-lg text-xs font-bold text-white">
                                                View
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute top-20 -right-12 bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-xl animate-slide-up" style={{ animationDelay: '0.5s' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                    <MessageCircle className="w-5 h-5 fill-current" />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">New Message</p>
                                    <p className="text-xs text-slate-400">Sarah wants to connect</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="border-y border-slate-800 bg-slate-900/30">
                <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: "Active Users", value: "50k+", icon: Users },
                        { label: "Cities Covered", value: "120+", icon: Globe },
                        { label: "Daily Connections", value: "15k+", icon: Zap },
                        { label: "App Rating", value: "4.9/5", icon: Star },
                    ].map((stat, i) => (
                        <div key={i} className="flex items-center gap-4 justify-center md:justify-start">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{stat.value}</div>
                                <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-sm font-bold text-primary-500 uppercase tracking-wider mb-2">Why Orbyt?</h2>
                        <h3 className="text-3xl md:text-5xl font-bold text-white mb-6">Designed for real life.</h3>
                        <p className="text-slate-400 text-lg">Most social apps keep you glued to your screen. Orbyt uses technology to get you out into the world and meeting people face-to-face.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: MapPin,
                                title: "Live Location Map",
                                desc: "See who's hanging out at your favorite coffee shop or park in real-time. Privacy controls ensure you're only visible when you want to be."
                            },
                            {
                                icon: Users,
                                title: "Instant Connections",
                                desc: "Break the ice easily. Send a wave to someone nearby or join a public group chat based on your location."
                            },
                            {
                                icon: Shield,
                                title: "Verified Profiles",
                                desc: "Safety first. We use advanced verification to ensure everyone on the map is real, keeping the community authentic and safe."
                            },
                            {
                                icon: Heart,
                                title: "Interest Matching",
                                desc: "Find your tribe. Filter the map to show people who share your passion for hiking, photography, or gaming."
                            },
                            {
                                icon: MessageCircle,
                                title: "Ephemeral Chat",
                                desc: "Chats that encourage meeting up. Share your live location temporarily to meet up with friends easily."
                            },
                            {
                                icon: Globe,
                                title: "Local Events",
                                desc: "Discover impromptu gatherings and events happening right now around you. Never miss out on the action."
                            }
                        ].map((feat, i) => (
                            <div key={i} className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 hover:border-primary-500/30 transition-all hover:bg-slate-800 hover:-translate-y-1 group">
                                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 border border-slate-700 group-hover:bg-primary-500/10 group-hover:border-primary-500/50 transition-colors">
                                    <feat.icon className="w-7 h-7 text-slate-300 group-hover:text-primary-500 transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white">{feat.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="py-24 bg-slate-900 border-y border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1 space-y-12">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Start connecting in minutes</h2>
                                <p className="text-slate-400">No complicated setup. Just create a profile and start exploring your neighborhood.</p>
                            </div>

                            <div className="space-y-8">
                                {[
                                    { step: "01", title: "Create your profile", desc: "Sign up, add a photo, and select your interests." },
                                    { step: "02", title: "Enable location", desc: "Let us know where you are to find people nearby." },
                                    { step: "03", title: "Start exploring", desc: "Browse the map, send requests, and meet up!" }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center font-bold text-slate-500">
                                            {item.step}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                                            <p className="text-slate-400">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-500 rounded-3xl blur-2xl opacity-20 transform rotate-3"></div>
                            <img
                                src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1000&auto=format&fit=crop"
                                alt="Friends meeting"
                                className="relative rounded-3xl shadow-2xl border border-slate-700 grayscale hover:grayscale-0 transition-all duration-500"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-16">Loved by explorers everywhere</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                text: "I moved to a new city and didn't know anyone. Orbyt helped me find a hiking group within my first week!",
                                author: "Elena R.",
                                role: "Digital Nomad",
                                image: "https://i.pravatar.cc/100?img=5"
                            },
                            {
                                text: "Finally, a social app that actually gets you off your phone. The real-time map is a game changer for spontaneous meetups.",
                                author: "Marcus T.",
                                role: "Photographer",
                                image: "https://i.pravatar.cc/100?img=11"
                            },
                            {
                                text: "The safety features make me feel comfortable meeting new people. Verified profiles give peace of mind.",
                                author: "Sarah J.",
                                role: "Student",
                                image: "https://i.pravatar.cc/100?img=9"
                            }
                        ].map((t, i) => (
                            <div key={i} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 relative">
                                <div className="flex gap-1 mb-4 text-yellow-500">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                                </div>
                                <p className="text-slate-300 mb-6 leading-relaxed">"{t.text}"</p>
                                <div className="flex items-center gap-4">
                                    <img src={t.image} alt={t.author} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="font-bold text-white text-sm">{t.author}</p>
                                        <p className="text-xs text-slate-500">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-24 bg-slate-900 border-t border-slate-800">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {[
                            { q: "Is Orbyt free to use?", a: "Yes! Orbyt is completely free to download and use. We may introduce premium features in the future, but the core experience will always be free." },
                            { q: "How does the location privacy work?", a: "Your privacy is our priority. You can choose to be visible only to friends, or go into 'Ghost Mode' to be completely invisible on the map whenever you want." },
                            { q: "Is it available on iOS and Android?", a: "Currently, Orbyt is a Progressive Web App (PWA). This means you can add it to your home screen on both iOS and Android directly from your browser without visiting an app store." },
                            { q: "How do you verify users?", a: "We use a combination of email verification and community reporting. We are also rolling out photo verification to ensure profiles are authentic." }
                        ].map((item, i) => (
                            <div key={i} className="border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden">
                                <button
                                    className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-900 transition-colors"
                                    onClick={() => toggleFaq(i)}
                                >
                                    <span className="font-bold text-white">{item.q}</span>
                                    <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
                                </button>
                                {activeFaq === i && (
                                    <div className="px-6 pb-6 text-slate-400 leading-relaxed animate-fade-in">
                                        {item.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-primary-900/20"></div>
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to explore your world?</h2>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">Join the fastest growing social discovery community today. Your next adventure is just around the corner.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button variant="primary" className="rounded-full px-8 h-12 text-base shadow-xl shadow-primary-500/25">
                            Launch Web App
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                    <p className="mt-6 text-sm text-slate-500">No download required • Works on all devices</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 border-t border-slate-800 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-2 md:col-span-1">
                            {/* <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                    <Heart className="w-4 h-4 text-white fill-current" />
                                </div>
                                <span className="text-xl font-bold text-white">Orbyt</span>
                            </div> */}
                            <div className="flex py-4 items-center">
                                <img
                                    src={MainLogo}
                                    alt="Orbyt Logo"
                                    className="h-12 w-auto object-contain hover:scale-105 transition-transform duration-200"
                                />
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Connecting the world, one neighborhood at a time. Built for the mobile generation.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-6">Product</h4>
                            <ul className="space-y-4 text-sm text-slate-400">
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Safety</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Integrations</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Download</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-6">Company</h4>
                            <ul className="space-y-4 text-sm text-slate-400">
                                <li><a href="#" className="hover:text-primary-400 transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-6">Legal</h4>
                            <ul className="space-y-4 text-sm text-slate-400">
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Cookie Policy</a></li>
                                <li><a href="#" className="hover:text-primary-400 transition-colors">Guidelines</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
                        <p>&copy; {new Date().getFullYear()} Orbyt Inc. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-slate-400">Twitter</a>
                            <a href="#" className="hover:text-slate-400">Instagram</a>
                            <a href="#" className="hover:text-slate-400">LinkedIn</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default DesktopLanding;