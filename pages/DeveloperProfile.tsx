import { ArrowLeft, Briefcase, Code, Coffee, Heart, Instagram, Linkedin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DeveloperProfile() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center gap-4 py-4 mb-4 border-b border-slate-800">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-400" />
        </button>
        <h1 className="text-xl font-bold">Developer Profile</h1>
      </div>

      <div className="max-w-2xl mx-auto w-full space-y-6 pb-24">
        
        {/* Profile Card */}
        <div className="flex flex-col items-center py-6 text-center">
          <div className="w-32 h-32 rounded-full border-4 border-primary-500 bg-slate-800 mb-4 overflow-hidden shadow-[0_4px_16px_rgba(59,130,246,0.3)]">
            <img 
                src="https://via.placeholder.com/150" 
                alt="Harsh Jha" 
                className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-3xl font-bold mb-2">Harsh Jha</h2>
          
          <div className="inline-flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700 mb-4">
            <Briefcase className="w-4 h-4 text-primary-500" />
            <span className="text-slate-300 text-sm font-medium">Software Engineer</span>
          </div>

          <p className="text-slate-400 text-sm max-w-sm">
            Passionate about building beautiful, high-performance web applications and scalable backend systems. Let's create something amazing together!
          </p>
        </div>

        {/* Tech Stack */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 tracking-widest mb-3 uppercase px-2">Tech Stack</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-4 py-3 border-b border-slate-800">
              <Code className="w-5 h-5 text-slate-400" />
              <span className="font-medium text-slate-200">React</span>
            </div>
            <div className="flex items-center gap-4 py-3 border-b border-slate-800">
              <Code className="w-5 h-5 text-slate-400" />
              <span className="font-medium text-slate-200">React Native</span>
            </div>
            <div className="flex items-center gap-4 py-3">
              <Code className="w-5 h-5 text-slate-400" />
              <span className="font-medium text-slate-200">Node.js</span>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 tracking-widest mb-3 uppercase px-2">Connect With Me</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <a 
              href="https://instagram.com/_harsh_jha_" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 py-3 border-b border-slate-800 hover:bg-slate-800/50 transition-colors rounded-lg px-2"
            >
              <Instagram className="w-6 h-6 text-pink-500" />
              <div className="flex-1">
                <span className="block font-medium text-slate-200">Follow on Instagram</span>
                <span className="block text-sm text-slate-500">@_harsh_jha_</span>
              </div>
            </a>
            <a 
              href="https://www.linkedin.com/notifications/?filter=all" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 py-3 hover:bg-slate-800/50 transition-colors rounded-lg px-2 mt-2"
            >
              <Linkedin className="w-6 h-6 text-blue-500" />
              <div className="flex-1">
                <span className="block font-medium text-slate-200">Connect on LinkedIn</span>
                <span className="block text-sm text-slate-500">Harsh Jha</span>
              </div>
            </a>
          </div>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 tracking-widest mb-3 uppercase px-2">Support</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
             <a 
              href="https://www.buymeacoffee.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 py-3 hover:bg-slate-800/50 transition-colors rounded-lg px-2"
            >
              <Coffee className="w-6 h-6 text-yellow-400" />
              <span className="flex-1 font-medium text-slate-200">Buy me a coffee</span>
              <Heart className="w-5 h-5 text-red-500" />
            </a>
          </div>
        </div>

        <div className="text-center py-8">
          <p className="text-slate-500 text-sm">Made with ❤️ by Harsh Jha</p>
        </div>

      </div>
    </div>
  );
}
