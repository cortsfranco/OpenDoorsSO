import { toast } from 'sonner';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useNotifications = () => {
  const showNotification = (
    type: NotificationType,
    title: string,
    options?: NotificationOptions
  ) => {
    const commonOptions = {
      duration: options?.duration || 4000,
      description: options?.description,
      action: options?.action,
    };

    switch (type) {
      case 'success':
        toast.success(title, {
          ...commonOptions,
          className: 'bg-green-500 text-white border-green-600',
          style: {
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            border: '1px solid #059669',
          },
        });
        break;
      case 'error':
        toast.error(title, {
          ...commonOptions,
          className: 'bg-red-500 text-white border-red-600',
          style: {
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            border: '1px solid #DC2626',
          },
        });
        break;
      case 'warning':
        toast.warning(title, {
          ...commonOptions,
          className: 'bg-yellow-500 text-white border-yellow-600',
          style: {
            backgroundColor: '#F59E0B',
            color: '#FFFFFF',
            border: '1px solid #D97706',
          },
        });
        break;
      case 'info':
        toast.info(title, {
          ...commonOptions,
          className: 'bg-blue-500 text-white border-blue-600',
          style: {
            backgroundColor: '#3B82F6',
            color: '#FFFFFF',
            border: '1px solid #2563EB',
          },
        });
        break;
      default:
        toast(title, commonOptions);
    }
  };

  return {
    success: (title: string, options?: NotificationOptions) =>
      showNotification('success', title, options),
    showSuccess: (title: string, options?: NotificationOptions) =>
      showNotification('success', title, options),
    error: (title: string, options?: NotificationOptions) =>
      showNotification('error', title, options),
    showError: (title: string, options?: NotificationOptions) =>
      showNotification('error', title, options),
    warning: (title: string, options?: NotificationOptions) =>
      showNotification('warning', title, options),
    showWarning: (title: string, options?: NotificationOptions) =>
      showNotification('warning', title, options),
    info: (title: string, options?: NotificationOptions) =>
      showNotification('info', title, options),
    showInfo: (title: string, options?: NotificationOptions) =>
      showNotification('info', title, options),
  };
};