import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  X,
  Lightbulb,
  TrendingUp,
  FileText,
  Calculator,
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  message: string;
  timestamp: Date;
  suggestions?: string[];
}

const FINANCIAL_RESPONSES = {
  'cash flow': {
    response: "Cash flow management is crucial for business success. Here are key strategies: 1) Track your accounts receivable and follow up on overdue payments, 2) Negotiate better payment terms with suppliers, 3) Consider invoice factoring for immediate cash, 4) Maintain a cash reserve for emergencies. Would you like me to analyze your current cash flow data?",
    suggestions: ["Show my cash flow report", "How to improve collections", "Invoice factoring options"]
  },
  'tax': {
    response: "Tax planning is essential year-round, not just during tax season. Key tips: 1) Keep detailed records of all business expenses, 2) Maximize deductions like office supplies, travel, and equipment, 3) Consider quarterly payments to avoid penalties, 4) Consult with a tax professional for complex situations. What specific tax questions do you have?",
    suggestions: ["Business deductions", "Quarterly tax payments", "Tax deadline calendar"]
  },
  'profit': {
    response: "To improve profitability, focus on: 1) Increasing revenue through better pricing or new products/services, 2) Reducing costs without compromising quality, 3) Improving operational efficiency, 4) Analyzing your profit margins by product/service. Your current net profit margin appears healthy. Would you like a detailed profitability analysis?",
    suggestions: ["Analyze profit margins", "Cost reduction ideas", "Pricing strategies"]
  },
  'budget': {
    response: "Effective budgeting involves: 1) Setting realistic revenue goals based on historical data, 2) Categorizing and tracking all expenses, 3) Building in contingencies for unexpected costs, 4) Reviewing and adjusting monthly. I can help create a budget template based on your business data.",
    suggestions: ["Create budget template", "Track expenses", "Budget vs actual analysis"]
  },
  'revenue': {
    response: "Revenue growth strategies include: 1) Expanding your customer base through marketing, 2) Increasing average transaction value, 3) Improving customer retention, 4) Diversifying income streams. Your revenue trend shows positive growth. What specific revenue challenges are you facing?",
    suggestions: ["Revenue growth plan", "Customer retention tips", "Marketing strategies"]
  },
  'default': {
    response: "I'm your AI financial assistant! I can help you with cash flow management, tax planning, budgeting, profit analysis, and general financial advice. What would you like to know about your business finances?",
    suggestions: ["Analyze my finances", "Tax planning tips", "Cash flow advice", "Budgeting help"]
  }
};

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user, currentBusiness } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);

  // Initialize conversation
  useEffect(() => {
    if (isOpen && !conversationStarted) {
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        message: `Hello! I'm your AI financial assistant. I can help you with questions about cash flow, taxes, budgeting, profitability, and more. ${currentBusiness ? `I see you're working with ${currentBusiness.name}` : 'Let me know'} - what would you like to discuss?`,
        timestamp: new Date(),
        suggestions: ["Analyze my cash flow", "Tax planning advice", "How to improve profits", "Budget recommendations"]
      };
      setMessages([welcomeMessage]);
      setConversationStarted(true);
    }
  }, [isOpen, conversationStarted, currentBusiness]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setConversationStarted(false);
      setInputMessage('');
      setIsTyping(false);
    }
  }, [isOpen]);

  const getAIResponse = (userMessage: string): { response: string; suggestions: string[] } => {
    const message = userMessage.toLowerCase();
    
    for (const [key, value] of Object.entries(FINANCIAL_RESPONSES)) {
      if (key !== 'default' && message.includes(key)) {
        return value;
      }
    }
    
    return FINANCIAL_RESPONSES.default;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const { response, suggestions } = getAIResponse(inputMessage);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        message: response,
        timestamp: new Date(),
        suggestions
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // 1-3 seconds delay
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <span>AI Financial Assistant</span>
            <Badge className="bg-green-100 text-green-800 ml-2">
              <CheckCircle className="h-3 w-3 mr-1" />
              Online
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Get intelligent insights and advice about your business finances.
          </DialogDescription>
        </DialogHeader>

        {/* Chat Messages Area */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border'
                  } rounded-lg p-3 shadow-sm`}
                >
                  <div className="flex items-start space-x-2">
                    {message.type === 'assistant' && (
                      <Bot className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    )}
                    {message.type === 'user' && (
                      <User className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-2">Quick actions:</p>
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-lg p-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-blue-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">AI is typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-white">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your finances, taxes, cash flow, or budgeting..."
                  disabled={isTyping}
                  className="w-full"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Suggestions */}
            <div className="mt-3">
              <p className="text-xs text-gray-600 mb-2">Popular questions:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "How's my cash flow?",
                  "Tax deduction tips",
                  "Improve profitability",
                  "Budget planning",
                  "Revenue growth"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isTyping}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 