import { Button as ButtonComponent, buttonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';
import { PlusIcon } from 'lucide-react';
import React from 'react';

const buttonClass = 'h-10 min-w-24 px-3';

export function DialogCreateButton({
  text = 'Add New',
  variant = 'default',
  ...props
}: {
  text: string;
} & React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  return (
    <ButtonComponent variant={variant} className={`${buttonClass} ${props.className}`} {...props}>
      <PlusIcon />
      {text}
    </ButtonComponent>
  );
}

export function Button({
  variant = 'default',
  className,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  return (
    <ButtonComponent variant={variant} className={`${buttonClass} ${className}`} {...props}>
      {children}
    </ButtonComponent>
  );
}
