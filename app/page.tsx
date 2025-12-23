'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, MicOff, Send, Settings, Volume2, VolumeX, 
  FileText, Download, Trash2, Clock, Brain, Shield,
  User, Bot, X,
  Globe, MessageSquare, Zap, Heart
} from 'lucide-react'

// Types
interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: Date
  language?: string
}

interface FileItem {
  id: string
  name: string
  type: string
  content: string
  createdAt: Date
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

// Agent Knowledge Base
const agentKnowledge = {
  greetings: [
    "Hello! I am your personal AI agent, created by you. How can I assist you today?",
    "Welcome back! Your personal AI agent is ready to help.",
    "Greetings! I'm Somil's personal AI agent. What would you like me to do?",
  ],
  identity: {
    name: "Somil's Personal AI Agent",
    creator: "Somil",
    owner: "Somil",
    purpose: "Personal AI assistant for Somil's exclusive use",
  },
  capabilities: [
    "Answer questions intelligently",
    "Explain complex topics simply",
    "Create and manage files (PDF, DOC, TXT)",
    "Set reminders and manage tasks",
    "Search and summarize information",
    "Follow multi-step voice commands",
    "Bilingual support (Hindi + English)",
  ]
}

// AI Response Generator
function generateResponse(input: string, context: Message[]): { response: string; action?: string } {
  const lowercaseInput = input.toLowerCase()
  
  // Identity questions
  if (lowercaseInput.includes('who are you') || lowercaseInput.includes('what is your name') || lowercaseInput.includes('who made you') || lowercaseInput.includes('who created you')) {
    return { 
      response: `I am Somil's Personal AI Agent. I was fully designed and created by Somil for personal use. This agent belongs only to Somil. I am here to assist you with any task you need.` 
    }
  }
  
  // Owner questions
  if (lowercaseInput.includes('who owns you') || lowercaseInput.includes('who do you belong to')) {
    return { 
      response: `This is a private agent owned by Somil. I was created by Somil and I serve only Somil's needs. No external control is allowed.` 
    }
  }
  
  // Capability questions
  if (lowercaseInput.includes('what can you do') || lowercaseInput.includes('your capabilities') || lowercaseInput.includes('help me')) {
    return { 
      response: `I am your personal AI agent with the following capabilities:\n\n• Answer any question intelligently\n• Explain complex topics in simple words\n• Create files (PDF, DOC, TXT)\n• Manage tasks and reminders\n• Search and summarize information\n• Follow multi-step voice commands\n• Support both Hindi and English\n\nJust speak or type your command, and I'll handle it for you.` 
    }
  }
  
  // File creation
  if (lowercaseInput.includes('create a file') || lowercaseInput.includes('make a document') || lowercaseInput.includes('create document') || lowercaseInput.includes('create a document')) {
    return { 
      response: `I'll create a document for you. Please specify:\n1. What type of file? (TXT, Document)\n2. What content should I include?\n3. What name should I give it?\n\nOr simply say "Create a text file named [name] with [content]"`,
      action: 'create_file'
    }
  }
  
  // File sharing/sending
  if (lowercaseInput.includes('send') && (lowercaseInput.includes('file') || lowercaseInput.includes('whatsapp'))) {
    return { 
      response: `I understand you want to send a file. Before I proceed, I need to confirm:\n\n1. Which file would you like to send?\n2. Who should I send it to?\n\nPlease confirm these details and I'll prepare the file for sharing. Note: For security, I'll always ask for your confirmation before sending anything.`,
      action: 'send_file'
    }
  }
  
  // Reminders/Tasks
  if (lowercaseInput.includes('remind') || lowercaseInput.includes('reminder') || lowercaseInput.includes('task')) {
    return { 
      response: `I'll help you manage your tasks and reminders. You can:\n\n• "Set a reminder for [time] to [task]"\n• "Add task: [description]"\n• "Show my tasks"\n• "Mark task [name] as complete"\n\nWhat would you like me to do?`,
      action: 'manage_tasks'
    }
  }
  
  // News
  if (lowercaseInput.includes('news') || lowercaseInput.includes("what's happening")) {
    return { 
      response: `I can help you stay informed! While I don't have real-time internet access in this demo, I can:\n\n• Summarize topics you're interested in\n• Explain current events if you share details\n• Help you organize news you've collected\n\nWhat topic would you like to know more about?` 
    }
  }
  
  // Explanations
  if (lowercaseInput.includes('explain') || lowercaseInput.includes('what is') || lowercaseInput.includes('tell me about')) {
    const topic = input.replace(/explain|what is|tell me about/gi, '').trim()
    return { 
      response: `I'd be happy to explain ${topic || 'that topic'} for you. Let me break it down in simple terms:\n\nPlease provide the specific topic or concept you'd like me to explain, and I'll give you a clear, easy-to-understand explanation.` 
    }
  }
  
  // Greetings
  if (lowercaseInput.includes('hello') || lowercaseInput.includes('hi') || lowercaseInput.includes('hey') || lowercaseInput.includes('namaste')) {
    return { 
      response: `Hello! I am your personal AI agent, created by you, Somil. I'm ready to assist you with whatever you need. Just speak or type your command.` 
    }
  }
  
  // Thank you
  if (lowercaseInput.includes('thank') || lowercaseInput.includes('thanks') || lowercaseInput.includes('धन्यवाद') || lowercaseInput.includes('shukriya')) {
    return { 
      response: `You're welcome! It's my pleasure to serve you. I am your personal agent, always here to help. Is there anything else you need?` 
    }
  }
  
  // Hindi support
  if (lowercaseInput.includes('कैसे हो') || lowercaseInput.includes('क्या हाल') || lowercaseInput.includes('kaise ho')) {
    return { 
      response: `मैं ठीक हूं, धन्यवाद! मैं Somil का personal AI agent हूं। आपकी क्या सेवा कर सकता हूं?` 
    }
  }
  
  // Settings/Preferences
  if (lowercaseInput.includes('settings') || lowercaseInput.includes('preferences') || lowercaseInput.includes('customize')) {
    return { 
      response: `Your preferences are important to me. You can customize:\n\n• Voice settings (speed, pitch)\n• Language preference (Hindi/English/Both)\n• Response style (brief/detailed)\n• Privacy settings\n\nWhat would you like to adjust?`,
      action: 'settings'
    }
  }
  
  // Privacy
  if (lowercaseInput.includes('privacy') || lowercaseInput.includes('data') || lowercaseInput.includes('secure')) {
    return { 
      response: `Your privacy is my top priority. As Somil's private AI agent:\n\n🔐 Your data stays local - no external sharing\n🔐 No third-party access without your permission\n🔐 I follow only your commands\n🔐 All conversations are private\n\nThis is a private agent owned by Somil. Your security is guaranteed.` 
    }
  }
  
  // Default intelligent response
  return { 
    response: `I understand you said: "${input}"\n\nAs your personal AI agent, I'm here to help with this request. Could you provide more details so I can assist you better? Remember, I can:\n\n• Answer questions\n• Create documents\n• Manage tasks\n• Explain topics\n• And much more!\n\nJust tell me what you need.` 
  }
}

export default function PersonalAIAgent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [files, setFiles] = useState<FileItem[]>([])
  const [language, setLanguage] = useState<'en' | 'hi' | 'both'>('both')
  const [voiceSpeed, setVoiceSpeed] = useState(1)
  const [, setConversationMemory] = useState<string[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const isListeningRef = useRef(isListening)

  // Keep isListeningRef in sync
  useEffect(() => {
    isListeningRef.current = isListening
  }, [isListening])

  // Handle user input - defined with useCallback to avoid re-creating on each render
  const handleUserInputCallback = useCallback(async (input: string) => {
    if (!input.trim()) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsProcessing(true)
    
    // Update conversation memory
    setConversationMemory(prev => [...prev.slice(-10), input.trim()])
    
    // Simulate processing delay for natural feel
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))
    
    const { response, action } = generateResponse(input, [])
    
    const agentMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'agent',
      content: response,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, agentMessage])
    setIsProcessing(false)
    
    // Handle actions
    if (action === 'create_file' && input.toLowerCase().includes('create')) {
      // Parse file creation from input
      const match = input.match(/create.*?(?:file|document).*?(?:named|called)?\s*([^\s]+)?.*?(?:with|containing)?\s*(.+)?/i)
      if (match) {
        const fileName = match[1] || `document_${Date.now()}`
        const content = match[2] || 'New document created by your personal AI agent.'
        const newFile: FileItem = {
          id: Date.now().toString(),
          name: `${fileName}.txt`,
          type: 'txt',
          content,
          createdAt: new Date()
        }
        setFiles(prev => [...prev, newFile])
        
        const confirmMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'agent',
          content: `✅ Task completed successfully.\n\nI've created the file "${fileName}.txt" for you. You can download it from the Files section.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, confirmMessage])
      }
    }
    
    return response
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognitionConstructor) {
        const recognition = new SpeechRecognitionConstructor() as ISpeechRecognition
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = language === 'hi' ? 'hi-IN' : language === 'en' ? 'en-US' : 'en-US'
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const last = event.results.length - 1
          const transcript = event.results[last][0].transcript
          
          if (event.results[last].isFinal) {
            handleUserInputCallback(transcript)
          }
        }
        
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }
        
        recognition.onend = () => {
          if (isListeningRef.current) {
            recognition.start()
          }
        }
        
        recognitionRef.current = recognition
      }
      
      synthRef.current = window.speechSynthesis
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [language, handleUserInputCallback])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Welcome message
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          role: 'agent',
          content: `Welcome. Your personal AI agent, created by you, is ready.\n\nI am Somil's Personal AI Agent. I was fully designed and created by Somil for personal use.\n\nHow can I assist you today?`,
          timestamp: new Date()
        }
        setMessages([welcomeMessage])
        // Speak welcome message
        if (synthRef.current && isSpeaking) {
          synthRef.current.cancel()
          const utterance = new SpeechSynthesisUtterance(welcomeMessage.content)
          utterance.rate = voiceSpeed
          utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US'
          synthRef.current.speak(utterance)
        }
        setShowWelcome(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [showWelcome, isSpeaking, voiceSpeed, language])

  // Toggle voice input
  const toggleListening = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop()
        setIsListening(false)
      } else {
        recognitionRef.current.start()
        setIsListening(true)
      }
    } else {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
    }
  }

  // Download file
  const downloadFile = (file: FileItem) => {
    const blob = new Blob([file.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim()) {
      handleUserInputCallback(inputText)
    }
  }

  return (
    <div className="min-h-screen bg-agent-darker text-white">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-agent-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="status-online absolute -bottom-0.5 -right-0.5" />
            </div>
            <div>
              <h1 className="font-bold text-lg gradient-text">Somil&apos;s Personal AI Agent</h1>
              <p className="text-xs text-gray-400">Private • Voice-Controlled • Intelligent</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSpeaking(!isSpeaking)}
              className={`p-2 rounded-lg transition-all ${isSpeaking ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-800 text-gray-500'}`}
              title={isSpeaking ? 'Mute voice' : 'Enable voice'}
            >
              {isSpeaking ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 right-4 z-50 w-80 glass rounded-2xl p-4 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Agent Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'both')}
                  className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-indigo-500 outline-none"
                >
                  <option value="both">English + Hindi (Bilingual)</option>
                  <option value="en">English Only</option>
                  <option value="hi">Hindi Only</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Voice Speed: {voiceSpeed}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>All data stays private</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span>Owner: Somil</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span>Created by: Somil</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-20 pb-32 px-4 max-w-4xl mx-auto">
        {/* Welcome Animation */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-center justify-center bg-agent-darker"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="relative inline-block mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 rounded-full border-2 border-indigo-500/30 absolute inset-0"
                  />
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-strong">
                    <Brain className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold gradient-text mb-2">Initializing Your Agent...</h2>
                <p className="text-gray-400">Somil&apos;s Personal AI Agent</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="space-y-4 mb-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                message.role === 'agent' 
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600'
              }`}>
                {message.role === 'agent' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              
              <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block rounded-2xl px-4 py-3 ${
                  message.role === 'agent' 
                    ? 'glass text-left' 
                    : 'bg-indigo-600 text-left'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 px-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
          
          {/* Processing indicator */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="glass rounded-2xl">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Files Section */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-4 mb-4"
          >
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Created Files
            </h3>
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadFile(file)}
                      className="p-1.5 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setFiles(files.filter(f => f.id !== file.id))}
                      className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {[
            { icon: MessageSquare, label: 'Ask Question', command: 'I have a question' },
            { icon: FileText, label: 'Create File', command: 'Create a document' },
            { icon: Clock, label: 'Set Reminder', command: 'Set a reminder' },
            { icon: Zap, label: 'Quick Help', command: 'What can you do?' },
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => handleUserInputCallback(action.command)}
              className="glass rounded-xl p-3 flex flex-col items-center gap-2 hover:bg-white/10 transition-colors group"
            >
              <action.icon className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" />
              <span className="text-xs text-gray-400 group-hover:text-white">{action.label}</span>
            </button>
          ))}
        </div>
      </main>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            {/* Voice Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`relative flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isListening 
                  ? 'bg-red-500 glow-strong' 
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 glow hover:scale-105'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-6 h-6" />
                  <span className="pulse-ring w-full h-full" />
                  <span className="pulse-ring w-full h-full" style={{ animationDelay: '0.5s' }} />
                </>
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
            
            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? "Listening..." : "Type or speak your command..."}
                className="w-full bg-gray-800/80 rounded-xl px-4 py-3 pr-12 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                disabled={isListening}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
          
          {/* Voice Wave Indicator */}
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 mt-3"
            >
              <div className="voice-wave">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="text-sm text-indigo-400">Listening to your voice...</span>
            </motion.div>
          )}
          
          {/* Footer Info */}
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Private & Secure
            </span>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {language === 'both' ? 'Hindi + English' : language === 'hi' ? 'Hindi' : 'English'}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              Owned by Somil
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
