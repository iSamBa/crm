'use client';

import { useState } from 'react';
import { format, isValid } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  value = '',
  onChange,
  placeholder = 'Select date and time',
  disabled = false,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse the current value
  const parseDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return null;
    
    try {
      // Handle datetime-local format (YYYY-MM-DDTHH:mm)
      if (dateTimeString.includes('T')) {
        const date = new Date(dateTimeString);
        return isValid(date) ? date : null;
      }
      
      // Handle ISO string format
      const date = new Date(dateTimeString);
      return isValid(date) ? date : null;
    } catch {
      return null;
    }
  };

  const currentDate = parseDateTime(value);
  const currentHour = currentDate ? format(currentDate, 'HH') : '09';
  const currentMinute = currentDate ? format(currentDate, 'mm') : '00';

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Preserve the existing time if available, otherwise use current time selection
    const newDate = new Date(date);
    newDate.setHours(parseInt(currentHour), parseInt(currentMinute));
    
    // Format as datetime-local string (YYYY-MM-DDTHH:mm)
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    const hours = String(newDate.getHours()).padStart(2, '0');
    const minutes = String(newDate.getMinutes()).padStart(2, '0');
    
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    onChange?.(formattedDate);
  };

  const handleTimeChange = (timeType: 'hour' | 'minute', timeValue: string) => {
    const date = currentDate || new Date();
    const newDate = new Date(date);
    
    if (timeType === 'hour') {
      newDate.setHours(parseInt(timeValue));
    } else {
      newDate.setMinutes(parseInt(timeValue));
    }
    
    // Format as datetime-local string
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    const hours = String(newDate.getHours()).padStart(2, '0');
    const minutes = String(newDate.getMinutes()).padStart(2, '0');
    
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    onChange?.(formattedDate);
  };

  // Generate hour options (00-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: String(i).padStart(2, '0'),
    label: String(i).padStart(2, '0'),
  }));

  // Generate minute options (00-59, every minute)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
    value: String(i).padStart(2, '0'),
    label: String(i).padStart(2, '0'),
  }));

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {currentDate ? (
            format(currentDate, 'PPP p')
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <Calendar
            mode="single"
            selected={currentDate || undefined}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="flex flex-col gap-3 px-4 py-4 border-l min-w-[160px]">
            <Label className="text-sm font-medium text-center">Time</Label>
            <div className="flex items-center gap-2 justify-center">
              <Select value={currentHour} onValueChange={(value) => handleTimeChange('hour', value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {hourOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground font-medium">:</span>
              <Select value={currentMinute} onValueChange={(value) => handleTimeChange('minute', value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {minuteOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-muted/30 rounded-md">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {currentDate ? format(currentDate, 'HH:mm') : '--:--'}
              </span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}