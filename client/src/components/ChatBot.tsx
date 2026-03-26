import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your BrewWait AI assistant. I can help you with drink recommendations and calorie information. How can I help you today?",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/chat", { message });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again later." },
      ]);
    },
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    chatMutation.mutate(userMessage);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 w-[350px] sm:w-[400px]"
          >
            <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm overflow-hidden border">
              <CardHeader className="bg-primary p-4 text-primary-foreground flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <img src="/chatbot-icon.png" alt="Bot icon" className="w-8 h-8 rounded-full bg-[#0F172A] p-1 border border-white/10" />
                  BrewWait AI
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => setIsOpen(false)}
                >
                  <X size={18} />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] p-4">
                  <div className="flex flex-col gap-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2.5 ${
                          msg.role === "user" ? "flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${
                            msg.role === "assistant"
                              ? "bg-[#0F172A] p-0.5 shadow-sm border border-white/10"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {msg.role === "assistant" ? (
                            <img src="/chatbot-icon.png" alt="Bot logo" className="w-full h-full object-cover" />
                          ) : (
                            <User size={16} />
                          )}
                        </div>
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm max-w-[80%] ${
                            msg.role === "assistant"
                              ? "bg-muted/50 rounded-tl-sm text-foreground ring-1 ring-border/50"
                              : "bg-primary text-primary-foreground rounded-tr-sm shadow-md shadow-primary/10"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chatMutation.isPending && (
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-[#0F172A] p-0.5 shadow-sm border border-white/10">
                          <img src="/chatbot-icon.png" alt="Bot loading" className="w-full h-full object-cover opacity-50 grayscale" />
                        </div>
                        <div className="bg-muted/50 px-3 py-2 rounded-2xl rounded-tl-sm text-sm">
                          <Loader2 className="animate-spin text-primary" size={16} />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask about calories or drinks..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSend()}
                      className="bg-muted/50 border-none focus-visible:ring-primary"
                    />
                    <Button
                      size="icon"
                      onClick={handleSend}
                      disabled={!input.trim() || chatMutation.isPending}
                    >
                      <Send size={18} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        className={`fixed bottom-8 right-8 w-24 h-24 z-50 transition-all duration-300 flex items-center justify-center bg-[#0F172A] rounded-full border-none cursor-pointer outline-none shadow-2xl border border-white/10 overflow-hidden ${
          isOpen ? "rotate-90 opacity-0 pointer-events-none" : "scale-100 opacity-100"
        }`}
        style={{
          filter: "drop-shadow(0 0 15px rgba(16, 185, 129, 0.4))"
        }}
        onClick={() => setIsOpen(true)}
      >
        <motion.img
          src="/chatbot-icon.png"
          alt="AI Assistant"
          className="w-full h-full object-contain pointer-events-none"
          animate={{
            y: [0, -6, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.button>
    </div>
  );
}
