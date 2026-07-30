import type { ComponentProps } from 'react';
import { Button } from '../ui/button';

interface CreateButtonProps extends ComponentProps<'button'> {
  text?: string;
}

export function DialogCreateButton({ text = 'Add New', className, ...props }: CreateButtonProps) {
  return (
    <Button variant="default" className={`h-10 px-3 ${className}`} {...props}>
      {text}
    </Button>
  );
}