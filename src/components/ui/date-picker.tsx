'use client';

import { useState } from 'react';
import { format, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({
  value = '',
  onChange,
  placeholder = 'Select date',
  disabled = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse the current value
  const parseDate = (dateString: string) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      return isValid(date) ? date : null;
    } catch {
      return null;
    }
  };

  const currentDate = parseDate(value);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Format as YYYY-MM-DD for date inputs
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const formattedDate = `${year}-${month}-${day}`;
    onChange?.(formattedDate);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal h-9 bg-input',
            !value && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {currentDate ? (
            format(currentDate, 'PPP')
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={currentDate || undefined}
          onSelect={handleDateSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}