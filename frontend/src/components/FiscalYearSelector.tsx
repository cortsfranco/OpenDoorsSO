import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import apiService from '@/services/api';
import { toast } from 'sonner';

interface FiscalYear {
  year: number;
  label: string;
  start_date: string;
  end_date: string;
  current: boolean;
}

interface Props {
  value?: number;
  onChange: (year: number, dateRange: { start: string; end: string }) => void;
}

export function FiscalYearSelector({ value, onChange }: Props) {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiscalYears();
  }, []);

  const fetchFiscalYears = async () => {
    try {
      setLoading(true);
      const data = await apiService.getFiscalYears();
      setFiscalYears(data);
      
      const current = data.find(fy => fy.current);
      if (current && !value) {
        onChange(current.year, {
          start: current.start_date,
          end: current.end_date
        });
      }
    } catch (error) {
      console.error('Error fetching fiscal years:', error);
      toast.error('Error al cargar años fiscales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-500" />
      <Select
        value={value?.toString()}
        onValueChange={(yearStr) => {
          const year = parseInt(yearStr);
          const fy = fiscalYears.find(f => f.year === year);
          if (fy) {
            onChange(year, {
              start: fy.start_date,
              end: fy.end_date
            });
          }
        }}
        disabled={loading}
      >
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Seleccionar año fiscal..." />
        </SelectTrigger>
        <SelectContent>
          {fiscalYears.map((fy) => (
            <SelectItem key={fy.year} value={fy.year.toString()}>
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{fy.label}</span>
                {fy.current && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    Actual
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}