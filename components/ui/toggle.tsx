'use client';

import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const toggleVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-3',
        sm: 'h-9 px-2.5',
        lg: 'h-11 px-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

// ✅ NEW: Toggle button that loads icon from brand_settings.toggle_icon_url
type BrandToggleIconProps =
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants> & {
    fallbackEmoji?: string;
    imgClassName?: string;
  };

const BrandToggleIcon = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  BrandToggleIconProps
>(({ className, variant, size, fallbackEmoji = '💬', imgClassName, ...props }, ref) => {
  const [iconUrl, setIconUrl] = React.useState<string>('');

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase
        .from('brand_settings')
        .select('setting_value')
        .eq('setting_key', 'toggle_icon_url')
        .maybeSingle();

      if (!mounted) return;
      if (error) return;

      setIconUrl(data?.setting_value || '');
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Toggle
      ref={ref}
      className={cn(toggleVariants({ variant, size }), className)}
      {...props}
    >
      {iconUrl ? (
        <img
          src={iconUrl}
          alt="toggle"
          className={cn('w-6 h-6 object-contain', imgClassName)}
        />
      ) : (
        <span className="text-base">{fallbackEmoji}</span>
      )}
    </Toggle>
  );
});

BrandToggleIcon.displayName = 'BrandToggleIcon';

export { Toggle, toggleVariants, BrandToggleIcon };
