'use client';

import { ReactNode } from 'react';

interface SimpleErrorBoundaryProps {
  children: ReactNode;
}

export function SimpleErrorBoundary({ children }: SimpleErrorBoundaryProps) {
  return <>{children}</>;
}

export default SimpleErrorBoundary;