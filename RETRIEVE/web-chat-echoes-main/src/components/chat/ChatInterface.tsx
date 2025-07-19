import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Plus, MoreHorizontal, User, Bot, ThumbsUp, ThumbsDown, RotateCcw, Settings, Search, Sparkles, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! How can I help you today?',
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  
  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'Create a chatbot GPT using python language',
      lastMessage: 'Sure, I can help you get started with creating a chatbot using GPT in Python...',
      timestamp: new Date(),
    },
    {
      id: '2',
      title: 'Apply To Leave For Emergency',
      lastMessage: 'I can help you draft a professional leave application...',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '3',
      title: 'What Is UI UX Design?',
      lastMessage: 'UI/UX design refers to the process of creating user interfaces...',
      timestamp: new Date(Date.now() - 86400000),
    },
    {
      id: '4',
      title: 'Create POS System',
      lastMessage: 'A Point of Sale system can be built using modern web technologies...',
      timestamp: new Date(Date.now() - 172800000),
    },
    {
      id: '5',
      title: 'What Is UX Audit?',
      lastMessage: 'A UX audit is a comprehensive evaluation of your product...',
      timestamp: new Date(Date.now() - 604800000),
    },
  ]);

  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [apiResult, setApiResult] = useState<any>(null);
  const [showChunks, setShowChunks] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imageApiResult, setImageApiResult] = useState<any>(null);
  const [showImageChunks, setShowImageChunks] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/search_text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMessage.content,
          return_chunks: showChunks, // or always true if you want to prefetch
          top_k: 3
        })
      });
      const data = await response.json();
      setApiResult(data); // Store the full API result for rendering below

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: data.answer + (data.article_link ? `\n[Read Article](${data.article_link})` : ''),
          role: 'assistant',
          timestamp: new Date(),
        }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: "Sorry, there was an error processing your request.",
          role: 'assistant',
          timestamp: new Date(),
        }
      ]);
    }
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const TypingIndicator = () => (
    <div className="flex items-center space-x-2 p-4 bg-chat-assistant rounded-2xl max-w-xs">
      <Bot className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-typing-dots"></div>
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-typing-dots" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-typing-dots" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );

  const FloatingSearchBar = () => (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-96 animate-fade-in">
      <div className="bg-white/10 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-4 bg-gradient-to-br from-white/20 to-white/5">
        <div className="flex items-center space-x-3">
          <Command className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search conversations or ask anything..."
            className="border-none bg-transparent focus-visible:ring-0 text-sm placeholder:text-muted-foreground/70"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFloatingSearch(false)}
            className="h-8 w-8 p-0 hover:bg-white/10 rounded-full"
          >
            ×
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-chat-background relative">
      {showFloatingSearch && <FloatingSearchBar />}
      
      {/* Floating Action Button for Search */}
      <Button
        onClick={() => setShowFloatingSearch(true)}
        className="fixed top-4 right-4 z-40 h-12 w-12 rounded-full bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground shadow-lg hover:shadow-xl animate-float"
        style={{
          background: 'linear-gradient(135deg, hsl(220 100% 60%) 0%, hsl(220 100% 75%) 100%)',
        }}
      >
        <Search className="w-5 h-5" />
      </Button>
      {/* Sidebar */}
      <div className={cn(
        "bg-chat-sidebar border-r border-chat-border transition-all duration-300 flex flex-col",
        isSidebarOpen ? "w-80" : "w-0 overflow-hidden"
      )}>
        {/* Sidebar Header */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-foreground">CHAT A.I+</h1>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            className="w-full justify-start bg-primary hover:bg-primary-hover text-primary-foreground rounded-full transition-all duration-300 text-base"
            onClick={() => setMessages([{
              id: Date.now().toString(),
              content: 'Hello! How can I help you today?',
              role: 'assistant',
              timestamp: new Date(),
            }])}
          >
            <Plus className="w-4 h-4 mr-2" />
            New chat
          </Button>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1 px-2">
          <div className="px-2 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Your conversations</span>
              <Button variant="ghost" size="sm" className="text-xs text-primary hover:bg-transparent p-0 h-auto">
                Clear All
              </Button>
            </div>
            
            <div className="space-y-1">
              {conversations.slice(0, 3).map((conversation) => (
                   <div
                    key={conversation.id}
                    className="p-3 rounded-2xl hover:bg-chat-hover cursor-pointer transition-smooth group flex items-center gap-2"
                  >
                  <div className="flex items-start justify-between">
                    <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-smooth h-auto p-1"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                  <h3 className="font-medium text-sm mt-1 mb-1 line-clamp-2 leading-relaxed">{conversation.title}</h3>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <span className="text-xs font-medium text-muted-foreground px-3 mb-2 block">Last 7 Days</span>
              <div className="space-y-1">
                {conversations.slice(3).map((conversation) => (
                  <div
                    key={conversation.id}
                    className="p-3 rounded-2xl hover:bg-chat-hover cursor-pointer transition-smooth group flex items-center gap-2"
                  >
                    <div className="flex items-start justify-between">
                      <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-smooth h-auto p-1"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                    <h3 className="font-medium text-sm mt-1 mb-1 line-clamp-2 leading-relaxed">{conversation.title}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-chat-border">
          <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-chat-hover cursor-pointer transition-smooth">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">Settings</span>
          </div>
          <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-chat-hover cursor-pointer transition-smooth mt-1">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">AN</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">Andrew Neilson</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-chat-border bg-background/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="font-semibold">Chat Assistant</h1>
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start space-x-3 animate-fade-in",
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                )}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className={cn(
                    "rounded-2xl px-4 py-3 max-w-2xl",
                    message.role === 'user'
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'bg-white'
                  )}
                  style={message.role === 'user' ? undefined : {
                    boxShadow: '0px 1px 6px rgba(0,0,0,0.05)'
                  }}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-medium text-primary flex items-center">
                          <Sparkles className="w-3 h-3 mr-1" />
                          CHAT A.I+
                        </span>
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mt-2 ml-4">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                        <ThumbsDown className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Regenerate
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-start space-x-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <TypingIndicator />
              </div>
            )}
            
            {/* Button to show/hide top K chunks */}
            {apiResult && (
              <div style={{ margin: '1em 0' }}>
                <button onClick={() => setShowChunks(!showChunks)}>
                  {showChunks ? "Hide Top 3 Chunks" : "Show Top 3 Chunks"}
                </button>
                {showChunks && apiResult.top_chunks && apiResult.top_chunks.length > 0 && (
                  <div>
                    {apiResult.top_chunks.map((chunk: any, idx: number) => (
                      <div key={idx} style={{ border: '1px solid #eee', margin: '0.5em 0', padding: '0.5em' }}>
                        <div><strong>Chunk {idx + 1}:</strong></div>
                        <div>{chunk.text}</div>
                        <div>
                          <a href={chunk.link} target="_blank" rel="noopener noreferrer">Read Article</a>
                        </div>
                        <div><small>Title: {chunk.title}</small></div>
                        <div><small>Published: {chunk.pub_date}</small></div>
                        {/* Add more metadata as needed */}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Display top K images with metadata */}
            {apiResult && apiResult.top_images && apiResult.top_images.length > 0 && (
              <div style={{ margin: '1em 0' }}>
                <h3>Top 3 Images</h3>
                <div style={{ display: 'flex', gap: '1em' }}>
                  {apiResult.top_images.map((img: any, idx: number) => (
                    <div key={idx} style={{ border: '1px solid #eee', padding: '0.5em', maxWidth: 220 }}>
                      {img.image_url && (
                        <img src={img.image_url} alt={`Relevant ${idx}`} style={{ maxWidth: 200, maxHeight: 200 }} />
                      )}
                      <div><strong>Title:</strong> {img.title}</div>
                      <div>
                        <a href={img.link} target="_blank" rel="noopener noreferrer">Read Article</a>
                      </div>
                      <div><small>Published: {img.pub_date}</small></div>
                      {/* Add more metadata as needed */}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ margin: '1em 0' }}>
              <input
                type="file"
                accept="image/*"
                onChange={e => setUploadedImage(e.target.files ? e.target.files[0] : null)}
              />
              <Button
                onClick={async () => {
                  if (!uploadedImage) return;
                  const formData = new FormData();
                  formData.append("file", uploadedImage);
                  formData.append("return_chunks", showImageChunks.toString());
                  formData.append("top_k", "3");
                  const response = await fetch("http://127.0.0.1:8000/search_image", {
                    method: "POST",
                    body: formData
                  });
                  const data = await response.json();
                  setImageApiResult(data);
                }}
                disabled={!uploadedImage}
              >
                Search by Image
              </Button>
              <Button
                onClick={() => setShowImageChunks(!showImageChunks)}
                disabled={!imageApiResult || !imageApiResult.top_chunks || imageApiResult.top_chunks.length === 0}
                style={{ marginLeft: 8 }}
              >
                {showImageChunks ? "Hide Relevant Chunks" : "Show Relevant Chunks"}
              </Button>
            </div>

            {/* Display top images for image query */}
            {imageApiResult && imageApiResult.top_images && imageApiResult.top_images.length > 0 && (
              <div style={{ margin: '1em 0' }}>
                <h3>Top 3 Images (Image Query)</h3>
                <div style={{ display: 'flex', gap: '1em' }}>
                  {imageApiResult.top_images.map((img: any, idx: number) => (
                    <div key={idx} style={{ border: '1px solid #eee', padding: '0.5em', maxWidth: 220 }}>
                      {img.image_url && (
                        <img src={img.image_url} alt={`Relevant ${idx}`} style={{ maxWidth: 200, maxHeight: 200 }} />
                      )}
                      <div><strong>Title:</strong> {img.title}</div>
                      <div>
                        <a href={img.link} target="_blank" rel="noopener noreferrer">Read Article</a>
                      </div>
                      <div><small>Published: {img.pub_date}</small></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Display top chunks for image query if toggled */}
            {showImageChunks && imageApiResult && imageApiResult.top_chunks && imageApiResult.top_chunks.length > 0 && (
              <div style={{ margin: '1em 0' }}>
                <h3>Relevant Chunks (Image Query)</h3>
                {imageApiResult.top_chunks.map((chunk: any, idx: number) => (
                  <div key={idx} style={{ border: '1px solid #eee', margin: '0.5em 0', padding: '0.5em' }}>
                    <div><strong>Chunk {idx + 1}:</strong></div>
                    <div>{chunk.text}</div>
                    <div>
                      <a href={chunk.link} target="_blank" rel="noopener noreferrer">Read Article</a>
                    </div>
                    <div><small>Title: {chunk.title}</small></div>
                    <div><small>Published: {chunk.pub_date}</small></div>
                    {/* Add more metadata as needed */}
                  </div>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-chat-border bg-background/50 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end space-x-2">
              <div className="flex-1 relative">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="pr-12 min-h-[44px] resize-none border-input-border focus:border-primary transition-smooth rounded-2xl bg-white text-base"
                  style={{boxShadow: '0px 1px 6px rgba(0,0,0,0.05)'}}
                  disabled={isTyping}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isTyping}
                size="sm"
                className={cn(
                  "h-11 w-11 rounded-full transition-all duration-300",
                  !currentMessage.trim() || isTyping
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-primary text-primary-foreground hover:bg-primary-hover'
                )}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;