export type WorkflowType = 'sync' | 'approval' | 'payroll';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  type: WorkflowType;
}

export interface GeneratedWorkflow {
  name: string;
  nodes: any[];
  connections: any;
}