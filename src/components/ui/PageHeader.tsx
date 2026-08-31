import type { ReactNode } from 'react';
export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <header className="page-header"><div><h2>{title}</h2><p>{description}</p></div>{action}</header>;
}
