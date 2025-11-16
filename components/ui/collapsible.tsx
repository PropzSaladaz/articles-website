'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type CollapsibleContextValue = {
  open: boolean;
  disabled: boolean;
  setOpen: (open: boolean) => void;
};

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext(component: string): CollapsibleContextValue {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error(`${component} must be used within <Collapsible>`);
  }
  return context;
}

type CollapsibleProps = React.HTMLAttributes<HTMLDivElement> & {
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  (
    {
      open,
      defaultOpen = false,
      disabled = false,
      onOpenChange,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isControlled = open !== undefined;
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
    const currentOpen = isControlled ? Boolean(open) : internalOpen;

    const setOpen = React.useCallback(
      (next: boolean) => {
        if (disabled) return;
        if (!isControlled) {
          setInternalOpen(next);
        }
        onOpenChange?.(next);
      },
      [disabled, isControlled, onOpenChange]
    );

    const value = React.useMemo<CollapsibleContextValue>(
      () => ({ open: currentOpen, disabled, setOpen }),
      [currentOpen, disabled, setOpen]
    );

    return (
      <CollapsibleContext.Provider value={value}>
        <div
          ref={ref}
          data-state={currentOpen ? 'open' : 'closed'}
          data-disabled={disabled ? '' : undefined}
          className={cn(className)}
          {...props}
        >
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);
Collapsible.displayName = 'Collapsible';

type CollapsibleTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ className, onClick, type = 'button', disabled: disabledProp, ...props }, ref) => {
    const { open, disabled, setOpen } = useCollapsibleContext('CollapsibleTrigger');
    const mergedDisabled = disabled || Boolean(disabledProp);

    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      if (mergedDisabled) return;
      onClick?.(event);
      if (!event.defaultPrevented) {
        setOpen(!open);
      }
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={mergedDisabled}
        data-state={open ? 'open' : 'closed'}
        data-disabled={mergedDisabled ? '' : undefined}
        aria-expanded={open}
        aria-disabled={mergedDisabled || undefined}
        className={cn(className)}
        onClick={handleClick}
        {...props}
      />
    );
  }
);
CollapsibleTrigger.displayName = 'CollapsibleTrigger';

type CollapsibleContentProps = React.HTMLAttributes<HTMLDivElement>;

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ className, style, children, ...props }, ref) => {
    const { open } = useCollapsibleContext('CollapsibleContent');

    return (
      <div
        ref={ref}
        data-state={open ? 'open' : 'closed'}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
          'data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr]',
          'data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
          className
        )}
        style={{
          ...style,
          pointerEvents: open ? style?.pointerEvents ?? 'auto' : 'none',
        }}
        aria-hidden={!open}
        {...props}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    );
  }
);
CollapsibleContent.displayName = 'CollapsibleContent';
export { Collapsible, CollapsibleContent, CollapsibleTrigger };
