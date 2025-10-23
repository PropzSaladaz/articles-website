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
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const mergedRef = useMergeRefs(ref, contentRef);
    const [height, setHeight] = React.useState(0);

    React.useLayoutEffect(() => {
      const node = contentRef.current;
      if (!node) return;

      const updateHeight = () => {
        setHeight(node.scrollHeight);
      };

      updateHeight();

      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(updateHeight);
        observer.observe(node);
        return () => {
          observer.disconnect();
        };
      }

      return undefined;
    }, [children, open]);

    return (
      <div
        ref={mergedRef}
        data-state={open ? 'open' : 'closed'}
        className={cn(
          'overflow-hidden transition-[max-height,opacity] duration-200 ease-out data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
          className
        )}
        style={{
          ...style,
          maxHeight: open ? (height ? `${height}px` : '9999px') : '0px',
          pointerEvents: open ? style?.pointerEvents ?? 'auto' : 'none',
        }}
        aria-hidden={!open}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CollapsibleContent.displayName = 'CollapsibleContent';

function useMergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return React.useCallback(
    (node: T) => {
      refs.forEach((ref) => {
        if (!ref) return;
        if (typeof ref === 'function') {
          ref(node);
        } else {
          (ref as React.MutableRefObject<T | null>).current = node;
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs
  );
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
