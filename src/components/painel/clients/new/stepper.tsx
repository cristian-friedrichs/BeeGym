'use client';

import { useFormContext } from '@/components/painel/clients/new/form-context';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import React from 'react';

export function Stepper() {
  const { currentStep, steps, setCurrentStep } = useFormContext();

  return (
    <div className="flex justify-between items-center">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div
            className="flex items-center cursor-pointer"
            onClick={() => setCurrentStep(index)}
          >
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-lg font-bold',
                index <= currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
            </div>
            <div className="ml-4">
              <div
                className={cn(
                  'text-sm font-medium',
                  index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {step}
              </div>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 h-px bg-border mx-4"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
