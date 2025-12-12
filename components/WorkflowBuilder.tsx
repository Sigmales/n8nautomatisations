import React, { useState } from 'react';
import { buildGovernmentWorkflow } from '../services/n8nWorkflowGenerator';
import { WorkflowType } from '../types';
import { CodeBlock } from './CodeBlock';
import { Download, Play, FileJson } from 'lucide-react';

export const WorkflowBuilder: React.FC = () => {
  const [type, setType] = useState<WorkflowType>('sync');
  const [name, setName] = useState('Mon Workflow');
  const [generatedJson, setGeneratedJson] = useState<string | null>(null);

  const handleGenerate = () => {
    const workflow = buildGovernmentWorkflow(type, name);
    setGeneratedJson(JSON.stringify(workflow, null, 2));
  };

  const handleDownload = () => {
    if (!generatedJson) return;
    const blob = new Blob([generatedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulaire */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
            <Play size={20} className="text-blue-400" /> Configuration
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Nom du Workflow</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Type de Processus</label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setType('sync')}
                  className={`px-4 py-3 rounded-lg text-left border transition-all ${
                    type === 'sync' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-semibold">Synchronisation</div>
                  <div className="text-xs opacity-80">Webhook -> API Externe -> Update Base</div>
                </button>
                <button
                  onClick={() => setType('approval')}
                  className={`px-4 py-3 rounded-lg text-left border transition-all ${
                    type === 'approval' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-semibold">Approbation (Email)</div>
                  <div className="text-xs opacity-80">Email -> Attente Clic -> Condition</div>
                </button>
                <button
                  onClick={() => setType('payroll')}
                  className={`px-4 py-3 rounded-lg text-left border transition-all ${
                    type === 'payroll' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-semibold">Paie & RH</div>
                  <div className="text-xs opacity-80">Cron -> Calcul -> Envoi PDF</div>
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <FileJson size={18} /> Générer le JSON
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Preview JSON</h2>
            {generatedJson && (
              <button
                onClick={handleDownload}
                className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors"
              >
                <Download size={16} /> Télécharger
              </button>
            )}
          </div>
          
          <div className="flex-1 bg-slate-950 rounded-lg p-4 overflow-auto border border-slate-800 min-h-[300px]">
            {generatedJson ? (
              <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                {generatedJson}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 italic">
                <FileJson size={48} className="mb-2 opacity-20" />
                Configurez et cliquez sur générer pour voir le résultat
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};