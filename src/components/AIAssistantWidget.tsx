import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Calendar, Phone, CheckCircle, Flame, MessageCircle, Clock, Info } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ChatMessage } from '../types';

interface AIAssistantWidgetProps {
  onSelectTab: (tab: string) => void;
}

export default function AIAssistantWidget({ onSelectTab }: AIAssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'book'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    name: '',
    whatsapp: '',
    date: '',
    time: '',
    message: ''
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Blessed day! I am AsooYeshua’s personal AI ministry assistant. I am here to help you study the Word, answer questions about our sermons, guide you through the Marketplace resources, or arrange a private consultation/prayer call with Tersoo Terence Aker (AsooYeshua).\n\nHow can I serve you in your walk of faith today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assistant response');
      }

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Simple keyword detection to prompt the booking form
      if (
        data.response.toLowerCase().includes('form') || 
        data.response.toLowerCase().includes('booking') || 
        data.response.toLowerCase().includes('provide your name')
      ) {
        // Option to switch tab to book
        setTimeout(() => {
          setActiveTab('book');
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        content: 'I apologize, but my connection is momentarily interrupted. However, you can still book a call with AsooYeshua using the "Book Call" tab at the top of this panel, and I will record your request safely!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.name || !bookingForm.whatsapp || !bookingForm.date || !bookingForm.time) return;

    setIsLoading(true);
    try {
      // Save booking in Firestore
      const docRef = await addDoc(collection(db, 'bookings'), {
        name: bookingForm.name,
        whatsapp: bookingForm.whatsapp,
        date: bookingForm.date,
        time: bookingForm.time,
        message: bookingForm.message,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setBookingId(docRef.id);
      setBookingSuccess(true);
      
      // Push confirmation to chat as well
      const confirmMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        content: `Blessed be God! I have successfully registered your prayer and consultation call request for ${bookingForm.date} at ${bookingForm.time}.\n\nPlease click the button below to send this notification instantly to AsooYeshua’s WhatsApp!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, confirmMsg]);

    } catch (err) {
      console.error('Error saving booking:', err);
      alert('Failed to register booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Prefilled WhatsApp notification text generator
  const getWhatsAppLink = () => {
    const defaultNumber = '2348030000000'; // Standard Nigerian country code (AsooYeshua is based in Nigeria)
    // Users can adjust this, but we prefill it beautifully.
    const text = `Hello AsooYeshua, I would like to book a call with you!\n\n*Name*: ${bookingForm.name}\n*WhatsApp*: ${bookingForm.whatsapp}\n*Date*: ${bookingForm.date}\n*Time*: ${bookingForm.time}\n*Purpose*: ${bookingForm.message || 'Prayer & Fellowship'}\n\nRegistered via AsooYeshua Ministry Portal.`;
    return `https://wa.me/${defaultNumber}?text=${encodeURIComponent(text)}`;
  };

  const resetBookingForm = () => {
    setBookingForm({ name: '', whatsapp: '', date: '', time: '', message: '' });
    setBookingSuccess(false);
    setActiveTab('chat');
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <motion.button
        id="ai-assistant-trigger"
        whileHover={{ scale: 1.05, rotate: 3 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-linear-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-stone-950 p-4 rounded-full shadow-[0_10px_30px_rgba(217,119,6,0.3)] border border-amber-400 flex items-center justify-center cursor-pointer group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <X className="w-6 h-6 text-stone-950" key="close" />
          ) : (
            <div className="flex items-center gap-2 px-1" key="chat">
              <MessageSquare className="w-6 h-6 text-stone-950 animate-bounce" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold text-sm tracking-wide uppercase">
                Talk with AI Assistant
              </span>
            </div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Floating Chat Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-24 right-4 sm:right-6 z-40 w-[92vw] sm:w-[420px] h-[550px] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-linear-to-r from-stone-950 to-stone-900 border-b border-stone-800 px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-amber-100 font-medium text-sm sm:text-base tracking-wide">
                    Yeshua Pastoral Agent
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-sans tracking-widest uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>AI Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="bg-stone-900 border-b border-stone-800/80 px-2 py-1 flex gap-1">
              <button
                onClick={() => { setActiveTab('chat'); setBookingSuccess(false); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Pastoral Chat
              </button>
              <button
                onClick={() => setActiveTab('book')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'book'
                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Book Prayer Call
              </button>
            </div>

            {/* Chat Pane */}
            {activeTab === 'chat' ? (
              <div className="flex-1 flex flex-col bg-stone-950 overflow-hidden">
                {/* Message List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-amber-500 text-stone-950 rounded-tr-none font-medium'
                            : 'bg-stone-900 text-stone-100 border border-stone-800/50 rounded-tl-none whitespace-pre-line'
                        }`}
                      >
                        {m.content}
                        <div
                          className={`text-[9px] mt-1.5 ${
                            m.role === 'user' ? 'text-stone-900/60' : 'text-stone-500'
                          } text-right`}
                        >
                          {m.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-stone-900 border border-stone-800 text-stone-400 rounded-2xl rounded-tl-none px-4 py-3 text-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-stone-800 bg-stone-900 flex gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about God's Word, sermons, eBooks..."
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-stone-950 p-2.5 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              /* Booking Pane */
              <div className="flex-1 bg-stone-950 overflow-y-auto p-4 flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {!bookingSuccess ? (
                    <motion.form
                      key="booking-form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleBookingSubmit}
                      className="space-y-3.5"
                    >
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-xs text-amber-400 flex gap-2">
                        <Info className="w-4 h-4 shrink-0" />
                        <p>
                          Fill this to schedule a session. It gets written directly to the ministry calendar and qualifies you for immediate priority counseling.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={bookingForm.name}
                          onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                          placeholder="Your Name"
                          className="w-full bg-stone-900 border border-stone-850 rounded-lg px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:outline-hidden focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                          WhatsApp / Phone Number
                        </label>
                        <input
                          type="tel"
                          required
                          value={bookingForm.whatsapp}
                          onChange={(e) => setBookingForm({ ...bookingForm, whatsapp: e.target.value })}
                          placeholder="e.g. +234 803 123 4567"
                          className="w-full bg-stone-900 border border-stone-850 rounded-lg px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:outline-hidden focus:border-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            required
                            value={bookingForm.date}
                            onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                            className="w-full bg-stone-900 border border-stone-850 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                            Preferred Time
                          </label>
                          <input
                            type="time"
                            required
                            value={bookingForm.time}
                            onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                            className="w-full bg-stone-900 border border-stone-850 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                          Prayer Request / Call Subject
                        </label>
                        <textarea
                          rows={2}
                          value={bookingForm.message}
                          onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                          placeholder="Briefly state your prayer requests or inquiries..."
                          className="w-full bg-stone-900 border border-stone-850 rounded-lg px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:outline-hidden focus:border-amber-500 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-linear-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-stone-950 py-2.5 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                      >
                        <Calendar className="w-4 h-4" /> Book Consultation Call
                      </button>
                    </motion.form>
                  ) : (
                    <motion.div
                      key="booking-success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6 space-y-6"
                    >
                      <div className="inline-flex w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 items-center justify-center text-emerald-500 mb-2">
                        <CheckCircle className="w-8 h-8" />
                      </div>

                      <div>
                        <h4 className="font-serif text-xl text-amber-100 font-medium tracking-wide">
                          Booking Saved Successfully!
                        </h4>
                        <p className="text-stone-400 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
                          Your appointment has been registered in our database. To ensure AsooYeshua is notified immediately on WhatsApp, click the button below to send him your schedule!
                        </p>
                      </div>

                      {/* WhatsApp direct send */}
                      <div className="space-y-3">
                        <a
                          href={getWhatsAppLink()}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-stone-950 py-3 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg"
                        >
                          <MessageCircle className="w-5 h-5 fill-stone-950" /> Send WhatsApp Notification
                        </a>

                        <button
                          onClick={resetBookingForm}
                          className="w-full bg-stone-900 border border-stone-800 hover:bg-stone-850 text-stone-300 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Return to Chat
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
