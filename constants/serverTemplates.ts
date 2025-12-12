export const TEMPLATES = {
  webhookHandler: `// pages/api/webhook-handler.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// --- Configuration ---
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const N8N_WEBHOOK_BASE = process.env.N8N_WEBHOOK_BASE!; // ex: https://n8n.mondomaine.com/webhook

// Initialisation Client Supabase (Service Role pour accès total)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Validation de la méthode
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { automation_id, payload } = req.body;

  if (!automation_id) {
    return res.status(400).json({ error: 'Missing automation_id' });
  }

  try {
    // 2. Récupérer la config du workflow depuis Supabase
    const { data: automation, error: fetchError } = await supabase
      .from('automations')
      .select('n8n_webhook_slug, status')
      .eq('id', automation_id)
      .single();

    if (fetchError || !automation) {
      console.error('Automation not found:', fetchError);
      return res.status(404).json({ error: 'Automation not found' });
    }

    if (automation.status !== 'active') {
      return res.status(403).json({ error: 'Automation is not active' });
    }

    // 3. Déclencher le workflow n8n
    const n8nUrl = \`\${N8N_WEBHOOK_BASE}/\${automation.n8n_webhook_slug}\`;
    console.log(\`Triggering n8n: \${n8nUrl}\`);
    
    const n8nResponse = await axios.post(n8nUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000 // Timeout court pour ne pas bloquer
    });

    // 4. Enregistrer l'exécution
    const { error: logError } = await supabase
      .from('executions')
      .insert({
        automation_id,
        status: 'success',
        external_execution_id: n8nResponse.data?.executionId || 'unknown',
        result: n8nResponse.data,
        triggered_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Failed to log execution:', logError);
      // On ne fail pas la request car n8n a déjà été appelé
    }

    return res.status(200).json({ success: true, n8n_status: n8nResponse.status });

  } catch (error: any) {
    console.error('Webhook Handler Error:', error.message);
    
    // Log de l'erreur en base
    await supabase.from('executions').insert({
      automation_id,
      status: 'error',
      result: { error: error.message },
      triggered_at: new Date().toISOString()
    });

    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}`,

  supabaseSetup: `// scripts/supabase-setup.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Configure les tables nécessaires pour l'intégration n8n.
 * Note: Idéalement, utilisez des migrations SQL. Ceci est un helper script.
 */
async function setupSupabase() {
  console.log("🚀 Starting Supabase Setup...");

  // Nous utilisons SQL brut via RPC si disponible, sinon nous simulons la structure via l'API JS 
  // (Note: l'API JS standard ne permet pas CREATE TABLE, il faut utiliser l'éditeur SQL Supabase).
  // Ci-dessous les commandes SQL à exécuter dans votre éditeur Supabase :

  const sqlCommands = \`
    -- 1. Table Automations
    CREATE TABLE IF NOT EXISTS public.automations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      n8n_webhook_slug TEXT UNIQUE NOT NULL,
      type TEXT CHECK (type IN ('sync', 'approval', 'payroll')) NOT NULL,
      status TEXT CHECK (status IN ('active', 'inactive', 'draft')) DEFAULT 'draft',
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'::jsonb
    );

    -- 2. Table Executions
    CREATE TABLE IF NOT EXISTS public.executions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE,
      external_execution_id TEXT,
      status TEXT CHECK (status IN ('success', 'error', 'pending')),
      result JSONB,
      triggered_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3. RLS Policies (Security)
    ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can only see their own automations
    CREATE POLICY "Users view own automations" ON public.automations
      FOR SELECT USING (auth.uid() = created_by);
      
    CREATE POLICY "Users insert own automations" ON public.automations
      FOR INSERT WITH CHECK (auth.uid() = created_by);

    -- Policy: Users can view executions linked to their automations
    CREATE POLICY "Users view own executions" ON public.executions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.automations 
          WHERE automations.id = executions.automation_id 
          AND automations.created_by = auth.uid()
        )
      );
  \`;

  console.log("⚠️  Veuillez exécuter le SQL suivant dans l'éditeur SQL de Supabase :");
  console.log(sqlCommands);

  // Pré-remplissage de templates (via JS)
  console.log("\\n📦 Insertion des templates par défaut...");
  
  const templates = [
    { name: 'Synchro LDAP', type: 'sync', n8n_webhook_slug: 'sync-ldap-v1', status: 'draft' },
    { name: 'Validation Congés', type: 'approval', n8n_webhook_slug: 'approval-leaves-v1', status: 'draft' },
    { name: 'Envoi Fiches de Paie', type: 'payroll', n8n_webhook_slug: 'payroll-monthly-v1', status: 'draft' }
  ];

  // Note: Pour insérer, il faut un utilisateur. Ici on insère sans created_by pour l'exemple système
  // En production, assignez un admin ID.
  const { data, error } = await supabase
    .from('automations')
    .upsert(templates, { onConflict: 'n8n_webhook_slug' })
    .select();

  if (error) console.error("❌ Erreur insertion templates:", error.message);
  else console.log("✅ Templates insérés:", data?.length);
}

setupSupabase();
`,

  apiWrapper: `// pages/api/workflows/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Simple Rate Limiting (In-Memory pour démo, utiliser Redis en prod)
const rateLimit = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 min
const MAX_REQUESTS = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Nettoyage sommaire
  // En prod: ne pas faire ça à chaque requête
  
  const requestCount = rateLimit.get(ip) || 0;
  if (requestCount >= MAX_REQUESTS) return false;
  
  rateLimit.set(ip, requestCount + 1);
  setTimeout(() => rateLimit.delete(ip), RATE_LIMIT_WINDOW);
  return true;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientIp = (req.headers['x-forwarded-for'] as string) || 'unknown';

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // GET: Lister les workflows de l'utilisateur
  if (req.method === 'GET') {
    // Dans une vraie app Next.js, on récupérerait l'user via getSession(req, res)
    // Ici on simule ou on demande un header Authorization
    const userId = req.headers['x-user-id']; 
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('created_by', userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // POST: Créer un nouveau workflow
  if (req.method === 'POST') {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, type, n8n_webhook_slug } = req.body;

    if (!name || !type || !n8n_webhook_slug) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const { data, error } = await supabase
      .from('automations')
      .insert({
        name,
        type,
        n8n_webhook_slug,
        created_by: userId,
        status: 'active'
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
`
};