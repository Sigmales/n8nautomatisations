import { GeneratedWorkflow, WorkflowType } from '../types';

/**
 * Génère un JSON de workflow n8n valide basé sur le type demandé.
 * Chaque workflow inclut une structure de base pour l'intégration Supabase.
 */
export const buildGovernmentWorkflow = (type: WorkflowType, name: string): GeneratedWorkflow => {
  let nodes: any[] = [];
  let connections: any = {};

  const commonMeta = {
    instanceId: "GeneratedByIntegrator"
  };

  switch (type) {
    case 'sync':
      // Workflow de Synchronisation: Webhook -> Supabase Get -> HTTP Request -> Supabase Update
      nodes = [
        {
          parameters: {
            path: "sync-trigger",
            responseMode: "lastNode",
            options: {}
          },
          name: "Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 1,
          position: [100, 300]
        },
        {
          parameters: {
            operation: "getAll",
            tableId: "automations",
            returnAll: true
          },
          name: "Supabase Get",
          type: "n8n-nodes-base.supabase",
          typeVersion: 1,
          position: [300, 300],
          credentials: { supabaseApi: { id: "supabase-cred-id", name: "Supabase account" } }
        },
        {
          parameters: {
            url: "https://api.external-service.gouv/sync",
            method: "POST",
            jsonParameters: true,
            options: {}
          },
          name: "External API",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 3,
          position: [500, 300]
        },
        {
          parameters: {
            operation: "update",
            tableId: "automations",
            updateKey: "id",
            columns: "status, last_synced_at"
          },
          name: "Supabase Update",
          type: "n8n-nodes-base.supabase",
          typeVersion: 1,
          position: [700, 300]
        }
      ];
      connections = {
        "Webhook": { "main": [[{ "node": "Supabase Get", "type": "main", "index": 0 }]] },
        "Supabase Get": { "main": [[{ "node": "External API", "type": "main", "index": 0 }]] },
        "External API": { "main": [[{ "node": "Supabase Update", "type": "main", "index": 0 }]] }
      };
      break;

    case 'approval':
      // Workflow d'Approbation: Webhook Start -> Email -> Wait -> Filter -> Action
      nodes = [
        {
          parameters: { path: "request-approval" },
          name: "Start Request",
          type: "n8n-nodes-base.webhook",
          typeVersion: 1,
          position: [100, 300]
        },
        {
          parameters: {
            toEmail: "manager@company.com",
            subject: "Validation requise",
            text: "Cliquez ici pour valider : {{ $json.link }}",
          },
          name: "Send Email",
          type: "n8n-nodes-base.emailSend",
          typeVersion: 1,
          position: [300, 300]
        },
        {
          parameters: {
            amount: 1,
            unit: "hours"
          },
          name: "Wait for Approval",
          type: "n8n-nodes-base.wait",
          typeVersion: 1,
          position: [500, 300],
          webhookId: "approval-webhook"
        },
        {
          parameters: {
            conditions: {
              boolean: [{ value1: "={{ $json.approved }}", value2: true }]
            }
          },
          name: "Is Approved?",
          type: "n8n-nodes-base.if",
          typeVersion: 1,
          position: [700, 300]
        },
        {
          parameters: {
            operation: "create",
            tableId: "executions",
            columns: "result, approved_at"
          },
          name: "Log Approval",
          type: "n8n-nodes-base.supabase",
          typeVersion: 1,
          position: [900, 200]
        },
        {
          parameters: {
            toEmail: "user@company.com",
            subject: "Refusé",
            text: "Votre demande a été refusée."
          },
          name: "Notify Rejection",
          type: "n8n-nodes-base.emailSend",
          typeVersion: 1,
          position: [900, 400]
        }
      ];
      connections = {
        "Start Request": { "main": [[{ "node": "Send Email", "type": "main", "index": 0 }]] },
        "Send Email": { "main": [[{ "node": "Wait for Approval", "type": "main", "index": 0 }]] },
        "Wait for Approval": { "main": [[{ "node": "Is Approved?", "type": "main", "index": 0 }]] },
        "Is Approved?": {
          "main": [
            [{ "node": "Log Approval", "type": "main", "index": 0 }],
            [{ "node": "Notify Rejection", "type": "main", "index": 0 }]
          ]
        }
      };
      break;

    case 'payroll':
      // Workflow Paie: Cron -> Get Employees -> Transform -> Email
      nodes = [
        {
          parameters: {
            triggerTimes: {
              item: [{ mode: "custom", cronExpression: "0 9 25 * *" }]
            }
          },
          name: "Monthly Schedule",
          type: "n8n-nodes-base.cron",
          typeVersion: 1,
          position: [100, 300]
        },
        {
          parameters: {
            operation: "getAll",
            tableId: "employees",
            returnAll: true
          },
          name: "Fetch Employees",
          type: "n8n-nodes-base.supabase",
          typeVersion: 1,
          position: [300, 300]
        },
        {
          parameters: {
            functionCode: "return items.map(item => {\n  item.json.salary_net = item.json.salary_gross * 0.75;\n  return item;\n});"
          },
          name: "Calculate Net",
          type: "n8n-nodes-base.function",
          typeVersion: 1,
          position: [500, 300]
        },
        {
          parameters: {
            toEmail: "={{ $json.email }}",
            subject: "Fiche de paie",
            text: "Votre salaire net est de {{ $json.salary_net }}€"
          },
          name: "Send Payslip",
          type: "n8n-nodes-base.emailSend",
          typeVersion: 1,
          position: [700, 300]
        }
      ];
      connections = {
        "Monthly Schedule": { "main": [[{ "node": "Fetch Employees", "type": "main", "index": 0 }]] },
        "Fetch Employees": { "main": [[{ "node": "Calculate Net", "type": "main", "index": 0 }]] },
        "Calculate Net": { "main": [[{ "node": "Send Payslip", "type": "main", "index": 0 }]] }
      };
      break;
  }

  return {
    name: name,
    nodes: nodes,
    connections: connections,
    // @ts-ignore - n8n specific meta
    meta: commonMeta
  };
};