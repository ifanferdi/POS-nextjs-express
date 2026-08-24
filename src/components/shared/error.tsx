'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

interface ParamsErrorProps {
  errors: Record<string, string[]>;
}

export function ParamsError({ errors }: ParamsErrorProps) {
  useEffect(() => {
    const messages = Object.entries(errors).flatMap(([field, msgs]) =>
      msgs.map((msg) => `${field}: ${msg}`),
    );
    toast.error('Invalid URL parameters', {
      description: messages.join('\n'),
    });
  }, [errors]);

  return null;
}
