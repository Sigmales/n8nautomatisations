import React, { useState } from 'react';
import { WorkflowBuilder } from './components/WorkflowBuilder';
import { CodeBlock } from './components/CodeBlock';
import { TEMPLATES } from './constants/serverTemplates';
import { Terminal, Database, Server, Workflow, FileCode, ShieldCheck } from 'lucide-react';

type Tab = 'generator' | 'webhook' | 'supabase' | 'api';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('generator');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500 selection:text-white">
      {/* Navbar */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
                <Workflow className="text-white h-6 w-6" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">N8n<span className="text-blue-500">Supabase</span> Integrator</span>
            </div>
            <div className="hidden md:block">
              <span className="text-xs font-mono bg-slate-800 px-3 py-1 rounded-full text-slate-400 border border-slate-700">v1.0.0 (TypeScript)</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Centre d'Intégration</h1>
          <p className="text-slate-400 max-w-2xl">
            Générez des workflows n8n compatibles Supabase et récupérez les scripts backend TypeScript nécessaires pour votre infrastructure Next.js.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-800 pb-1">
          <TabButton 
            active={activeTab === 'generator'} 
            onClick={() => setActiveTab('generator')}
            icon={<Workflow size={18} />}
            label="Générateur de Workflow"
          />
          <TabButton 
            active={activeTab === 'webhook'} 
            onClick={() => setActiveTab('webhook')}
            icon={<Terminal size={18} />}
            label="Webhook Handler"
          />
          <TabButton 
            active={activeTab === 'supabase'} 
            onClick={() => setActiveTab('supabase')}
            icon={<Database size={18} />}
            label="Supabase Setup"
          />
          <TabButton 
            active={activeTab === 'api'} 
            onClick={() => setActiveTab('api')}
            icon={<Server size={18} />}
            label="Next.js API Routes"
          />
        </div>

        {/* Content */}
        <div className="min-h-[600px]">
          {activeTab === 'generator' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <WorkflowBuilder />
            </div>
          )}

          {activeTab === 'webhook' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-4xl">
              <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-lg mb-6 flex items-start gap-3">
                <FileCode className="text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-300">Webhook Handler Script</h3>
                  <p className="text-sm text-blue-200/80 mt-1">
                    Ce script reçoit les événements depuis Supabase (via Database Webhooks) ou votre frontend, déclenche n8n via HTTP, et log l'exécution.
                    À placer dans <code>/pages/api/webhook-handler.ts</code>.
                  </p>
                </div>
              </div>
              <CodeBlock code={TEMPLATES.webhookHandler} filename="pages/api/webhook-handler.ts" />
            </div>
          )}

          {activeTab === 'supabase' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-4xl">
              <div className="bg-emerald-900/20 border border-emerald-800 p-4 rounded-lg mb-6 flex items-start gap-3">
                <ShieldCheck className="text-emerald-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-emerald-300">Configuration Supabase & RLS</h3>
                  <p className="text-sm text-emerald-200/80 mt-1">
                    Script d'initialisation pour créer les tables <code>automations</code> et <code>executions</code> avec des politiques de sécurité (RLS) strictes.
                  </p>
                </div>
              </div>
              <CodeBlock code={TEMPLATES.supabaseSetup} filename="scripts/supabase-setup.ts" />
            </div>
          )}

          {activeTab === 'api' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-4xl">
              <div className="bg-purple-900/20 border border-purple-800 p-4 rounded-lg mb-6 flex items-start gap-3">
                <Server className="text-purple-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-purple-300">API Routes & Rate Limiting</h3>
                  <p className="text-sm text-purple-200/80 mt-1">
                    Wrapper API pour Next.js permettant de lister et créer des workflows avec une protection contre le spam (Rate Limiting basique).
                  </p>
                </div>
              </div>
              <CodeBlock code={TEMPLATES.apiWrapper} filename="pages/api/workflows/index.ts" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 rounded-t-lg transition-all ${
      active
        ? 'bg-slate-800 text-blue-400 border-t border-x border-slate-700 font-medium'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default App;