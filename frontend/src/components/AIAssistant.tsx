import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  MessageCircle, 
  Send, 
  X, 
  Minimize2,
  Maximize2,
  Sparkles,
  Lightbulb,
  BarChart3,
  FileText,
  TrendingUp
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import apiService from '@/services/api';

interface AIAssistantProps {
  className?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: '¡Hola! Soy tu asistente de IA. Puedo ayudarte con análisis financieros, consultas sobre facturas y más. ¿En qué puedo asistirte?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { success, error } = useNotifications();

  const quickActions = [
    {
      icon: BarChart3,
      label: 'Análisis Financiero',
      prompt: 'Muéstrame un análisis financiero del último trimestre'
    },
    {
      icon: FileText,
      label: 'Estado Facturas',
      prompt: '¿Cuántas facturas están pendientes de aprobación?'
    },
    {
      icon: TrendingUp,
      label: 'Rentabilidad',
      prompt: '¿Cómo está la rentabilidad del negocio este mes?'
    }
  ];

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Simular respuesta del asistente (en producción, conectar con el backend)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateAssistantResponse(userMessage.content),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      error('Error', 'No se pudo procesar tu consulta.');
      console.error('Error with AI assistant:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAssistantResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('análisis') || input.includes('financiero')) {
      return 'Basándome en los datos actuales, el análisis financiero muestra un crecimiento del 12% en ingresos este mes. El balance de IVA está a favor por $45,000. ¿Te gustaría ver más detalles específicos?';
    }
    
    if (input.includes('factura') || input.includes('pendiente')) {
      return 'Actualmente tienes 3 facturas pendientes de aprobación por un total de $125,000. La más antigua es de hace 2 días. ¿Quieres que revise los detalles?';
    }
    
    if (input.includes('rentabilidad') || input.includes('ganancia')) {
      return 'La rentabilidad del negocio este mes es del 18.5%, lo cual es excelente. Los ingresos superan los gastos en $180,000. ¿Necesitas un análisis más detallado por categorías?';
    }
    
    if (input.includes('iva') || input.includes('balance')) {
      return 'El balance de IVA actual es de $45,000 a favor. Esto significa que tienes crédito fiscal que puedes utilizar en próximos períodos o solicitar como devolución.';
    }
    
    return 'Entiendo tu consulta. Permíteme analizar los datos más recientes para darte una respuesta precisa. ¿Podrías ser más específico sobre qué información necesitas?';
  };

  const handleQuickAction = (prompt: string) => {
    setMessage(prompt);
    if (isOpen) {
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`fixed bottom-6 left-6 z-50 ${className}`}>
      {/* Botón principal del asistente */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <Brain className="h-6 w-6" />
        </Button>
      )}

      {/* Panel del asistente */}
      {isOpen && (
        <Card className={`w-80 shadow-2xl border-0 bg-white/95 backdrop-blur-sm ${
          isMinimized ? 'h-16' : 'h-96'
        } transition-all duration-300`}>
          {/* Header */}
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Asistente IA</CardTitle>
                  <Badge className="text-xs bg-green-100 text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                    En línea
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-6 w-6 p-0"
                >
                  {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="space-y-4">
              {/* Chat Messages */}
              <div className="h-48 overflow-y-auto space-y-3 pr-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        msg.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600">Acciones Rápidas:</p>
                <div className="grid grid-cols-1 gap-1">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action.prompt)}
                      className="h-8 text-xs justify-start"
                    >
                      <action.icon className="h-3 w-3 mr-2" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe tu consulta..."
                  className="text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default AIAssistant;
