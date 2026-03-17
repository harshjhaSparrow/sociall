import React, { useEffect, useState } from 'react';
import { api, CURRENT_APP_VERSION } from '../services/api';
import { RefreshCw, Download } from 'lucide-react';

interface VersionGuardProps {
    children: React.ReactNode;
}

export default function VersionGuard({ children }: VersionGuardProps) {
    const [isOutdated, setIsOutdated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updateUrl, setUpdateUrl] = useState('https://orbyt.strangerchat.space');

    useEffect(() => {
        const checkVersion = async () => {
            try {
                const config = await api.config.getVersion();
                if (config && config.minAppVersion) {
                    setUpdateUrl(config.updateUrl || 'https://orbyt.strangerchat.space');
                    
                    const currentParts = CURRENT_APP_VERSION.split('.').map(Number);
                    const minParts = config.minAppVersion.split('.').map(Number);
                    
                    let outdated = false;
                    for (let i = 0; i < 3; i++) {
                        if (currentParts[i] < (minParts[i] || 0)) {
                            outdated = true;
                            break;
                        } else if (currentParts[i] > (minParts[i] || 0)) {
                            break;
                        }
                    }
                    setIsOutdated(outdated);
                }
            } catch (error) {
                console.error("Failed to check version:", error);
            } finally {
                setLoading(false);
            }
        };

        checkVersion();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (isOutdated) {
        return (
            <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <RefreshCw className="w-10 h-10 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Update Required</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        A new version of Orbyt is available with important updates and features. Please update to continue using the app.
                    </p>
                    <a 
                        href={updateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-blue-600/20"
                    >
                        <Download size={20} />
                        Update Now
                    </a>
                    <div className="mt-8 text-xs text-slate-600">
                        Current Version: {CURRENT_APP_VERSION}
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
