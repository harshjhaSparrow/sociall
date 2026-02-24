import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
            {/* Header */}
            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-3 shadow-sm z-30 sticky top-0 border-b border-slate-800 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="font-bold text-white text-lg">Privacy Policy</span>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 animate-fade-in">
                <div className="text-center mb-8 mt-4">
                    <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary-500/20">
                        <Shield className="w-8 h-8 text-primary-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
                    <p className="text-slate-400 text-sm border-b border-slate-800 pb-6 inline-block">Last Updated: {new Date().toLocaleDateString()}</p>
                </div>

                <section className="space-y-4 text-slate-300 leading-relaxed text-sm">
                    <h2 className="text-xl font-bold text-white text-left">1. Introduction</h2>
                    <p>Welcome to Orbyt ("We", "Us", or "Our"). We are committed to protecting your privacy and ensuring your personal data is handled securely and responsibly. This Privacy Policy explains how we collect, use, and share information when you use the Orbyt application (the "Service").</p>

                    <h2 className="text-xl font-bold text-white text-left pt-4">2. Information We Collect</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Account Information:</strong> When you register, we collect your email address, profile picture (optional), display name, and date of birth to ensure you meet our minimum age requirement (18+).</li>
                        <li><strong>Location Data:</strong> To provide core features like the map and finding nearby users, we collect your precise geographic location. You can pause discoverability or enter "Ghost Mode" at any time to restrict this access.</li>
                        <li><strong>User Generated Content:</strong> We collect and store text, images, and other data you choose to post, comment, or message through the Service.</li>
                        <li><strong>Usage Data:</strong> We automatically log interactions with the app, device information, and IP addresses to improve performance and prevent abuse.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-white text-left pt-4">3. How We Use Your Information</h2>
                    <p>We use your data to:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Provide, personalize, and improve the Orbyt experience.</li>
                        <li>Calculate distances between you and other users for local discovery.</li>
                        <li>Enforce our Terms of Service and protect the community from abusive behavior.</li>
                        <li>Send essential notifications regarding updates or security.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-white text-left pt-4">4. Sharing Your Information</h2>
                    <p>We do not sell your personal data. We may share information:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>With other users:</strong> Depending on your privacy settings, your profile and location data may be visible to users in your vicinity.</li>
                        <li><strong>For legal reasons:</strong> If requested by law enforcement or to protect the rights, property, or safety of Orbyt and our users.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-white text-left pt-4">5. Data Retention and Deletion</h2>
                    <p>We retain your data as long as your account is active. You have the right to request deletion of your account and all associated data at any time via the "Settings" page. Upon deletion, your profile, posts, messages, and location history are permanently removed from our active databases.</p>

                    <h2 className="text-xl font-bold text-white text-left pt-4">6. Security</h2>
                    <p>We implement industry-standard security measures to protect your data. However, no electronic transmission or storage is 100% secure. You use the Service at your own risk.</p>

                    <h2 className="text-xl font-bold text-white text-left pt-4">7. Contact Us</h2>
                    <p>If you have questions about this Privacy Policy, please contact us at privacy@orbyt.app.</p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
