import type { VariantProps } from 'class-variance-authority';
import React from 'react';
import { Button as ButtonComponent, buttonVariants } from '@/components/ui/button';

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
