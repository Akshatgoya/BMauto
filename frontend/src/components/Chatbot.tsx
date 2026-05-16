import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Key } from 'lucide-react';
import { GoogleGenerativeAI, SchemaType, type FunctionDeclaration } from '@google/generative-ai';
import { motion, AnimatePresence } from 'framer-motion';
import { predictCarPrice, predictBikePrice, type PredictionRequest } from '../api/predict';
import axios from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash';

function resolveApiKey(): string {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (envKey) return envKey;
  return localStorage.getItem('gemini_api_key')?.trim() || '';
}

function getGeminiErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  if (msg.includes('404') || lower.includes('not found')) {
    return 'The AI model is unavailable. Hard-refresh the page (Ctrl+Shift+R).';
  }
  if (
    msg.includes('401') ||
    msg.includes('403') ||
    lower.includes('api key') ||
    lower.includes('api_key_invalid')
  ) {
    return (
      'Invalid Gemini API key. Create a new key at aistudio.google.com/apikey ' +
      '(set Application restrictions to None for local dev), paste it in settings, and Save.'
    );
  }
  if (msg.includes('429') || lower.includes('quota') || lower.includes('resource_exhausted')) {
    return 'Gemini rate limit reached. Wait a minute and try again.';
  }
  if (lower.includes('referer') || lower.includes('referrer')) {
    return 'API key blocked by referrer restrictions. In Google Cloud Console, set key restrictions to None.';
  }
  if (lower.includes('blocked') || lower.includes('safety')) {
    return 'Message was blocked by safety filters. Try rephrasing your question.';
  }
  return `Error: ${msg.slice(0, 280)}`;
}

async function testGeminiKey(key: string): Promise<boolean> {
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent('Reply with exactly: OK');
  return result.response.text().toUpperCase().includes('OK');
}

function wantsPrediction(text: string): boolean {
  return /predict|price|estimate|valuation|worth|lakhs|lakh|₹|rs\.?|rupee|sell|buy|value/i.test(text);
}

const SYSTEM_PROMPT =
  'You are AutoValuAI, an expert vehicle pricing assistant for the Indian used car and bike market. ' +
  'You explain depreciation, resale factors, and market trends. Use ₹ and Lakhs for prices. ' +
  'When the user wants a price estimate and provides enough details (vehicle type, year, original price in lakhs, ' +
  'km driven, fuel, seller type, transmission, previous owners), call predict_vehicle_price. ' +
  'Encoding: fuel_type 0=Petrol,1=Diesel,2=CNG,3=Electric; seller_type 0=Dealer,1=Individual; ' +
  'transmission 0=Manual,1=Automatic; owner 0=first owner through 3. Ask for any missing fields before calling the tool.';

const PREDICT_TOOL: FunctionDeclaration = {
  name: 'predict_vehicle_price',
  description:
    'Get a live ML price prediction in Lakhs INR for a used car or bike in India.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      vehicle_type: {
        type: SchemaType.STRING,
        description: 'Must be "car" or "bike"',
      },
      year: { type: SchemaType.NUMBER, description: 'Manufacturing year' },
      present_price: {
        type: SchemaType.NUMBER,
        description: 'Original/showroom price in Lakhs',
      },
      kms_driven: { type: SchemaType.NUMBER, description: 'Kilometers driven' },
      fuel_type: {
        type: SchemaType.NUMBER,
        description: '0=Petrol, 1=Diesel, 2=CNG, 3=Electric',
      },
      seller_type: {
        type: SchemaType.NUMBER,
        description: '0=Dealer, 1=Individual',
      },
      transmission: {
        type: SchemaType.NUMBER,
        description: '0=Manual, 1=Automatic',
      },
      owner: {
        type: SchemaType.NUMBER,
        description: 'Number of previous owners (0-3)',
      },
    },
    required: [
      'vehicle_type',
      'year',
      'present_price',
      'kms_driven',
      'fuel_type',
      'seller_type',
      'transmission',
      'owner',
    ],
  },
};

type ChatMessage = { role: 'user' | 'ai'; text: string };

function isApiOfflineError(err: unknown): boolean {
  return axios.isAxiosError(err) && (err.code === 'ERR_NETWORK' || !err.response);
}

async function runPrediction(args: Record<string, unknown>) {
  const payload: PredictionRequest = {
    year: Number(args.year),
    present_price: Number(args.present_price),
    kms_driven: Number(args.kms_driven),
    fuel_type: Number(args.fuel_type),
    seller_type: Number(args.seller_type),
    transmission: Number(args.transmission),
    owner: Number(args.owner),
  };
  const vehicleType = String(args.vehicle_type).toLowerCase();
  if (vehicleType === 'bike') {
    return predictBikePrice(payload);
  }
  return predictCarPrice(payload);
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState(resolveApiKey);
  const [keyStatus, setKeyStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const key = resolveApiKey();
    if (key) {
      setApiKey(key);
      localStorage.setItem('gemini_api_key', key);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !apiKey.trim()) {
      if (isOpen && !apiKey.trim()) setShowKeyInput(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await testGeminiKey(apiKey.trim());
        if (!cancelled) setKeyStatus('valid');
      } catch {
        if (!cancelled) setKeyStatus('invalid');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, apiKey]);

  const runChat = async (key: string, history: { role: string; parts: { text: string }[] }[], text: string, withTools: boolean) => {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: SYSTEM_PROMPT,
      ...(withTools ? { tools: [{ functionDeclarations: [PREDICT_TOOL] }] } : {}),
    });

    const chat = model.startChat({ history });
    let result = await chat.sendMessage(text);
    let response = result.response;

    if (!withTools) {
      return response.text();
    }

    for (let round = 0; round < 3; round++) {
      const fnCalls = response.functionCalls();
      if (!fnCalls?.length) break;

      const functionResponses = [];
      for (const call of fnCalls) {
        if (call.name !== 'predict_vehicle_price') continue;
        try {
          const prediction = await runPrediction(call.args as Record<string, unknown>);
          functionResponses.push({
            functionResponse: { name: call.name, response: prediction },
          });
        } catch (err) {
          const offline = isApiOfflineError(err);
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: {
                error: offline
                  ? 'Predictor API is offline — run python main.py from the project root.'
                  : 'Prediction failed. Check vehicle details and try again.',
              },
            },
          });
        }
      }

      if (!functionResponses.length) break;
      result = await chat.sendMessage(functionResponses);
      response = result.response;
    }

    try {
      return response.text();
    } catch {
      return 'I processed your request but could not generate a text reply. Try asking again.';
    }
  };

  const handleSend = async (text: string) => {
    const key = apiKey.trim();
    if (!text.trim() || !key) return;

    const userMsg: ChatMessage = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const history = messages.map((m) => ({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const useTools = wantsPrediction(text);

    try {
      let replyText: string;
      try {
        replyText = await runChat(key, history, text, useTools);
      } catch (primaryError) {
        if (!useTools) throw primaryError;
        replyText = await runChat(key, history, text, false);
      }

      setMessages((prev) => [...prev, { role: 'ai', text: replyText }]);
      setKeyStatus('valid');
    } catch (error) {
      console.error('Chatbot error:', error);
      setKeyStatus('invalid');
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: getGeminiErrorMessage(error) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeySave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      await testGeminiKey(trimmed);
      setApiKey(trimmed);
      localStorage.setItem('gemini_api_key', trimmed);
      setKeyStatus('valid');
      setShowKeyInput(false);
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'API key saved and verified. You can chat now.' },
      ]);
    } catch (error) {
      setKeyStatus('invalid');
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: getGeminiErrorMessage(error) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    const envKey = import.meta.env.VITE_GEMINI_API_KEY?.trim() || '';
    setApiKey(envKey);
    if (envKey) localStorage.setItem('gemini_api_key', envKey);
    setKeyStatus('unknown');
  };

  const quickReplies = [
    'How does this work?',
    'What affects car price?',
    'Best time to sell?',
    'How accurate is the AI?',
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-brand-gold rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-transform hover:scale-110 z-40 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageSquare className="text-brand-black w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-brand-black border border-brand-gold/20 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            <motion.div className="p-4 bg-[#111111] border-b border-brand-gold/20 flex justify-between items-center">
              <motion.div>
                <h3 className="font-serif font-bold text-white">AutoValuAI Assistant 🤖</h3>
                <p className="text-xs text-brand-gold">
                  {keyStatus === 'valid'
                    ? 'Online · key verified'
                    : keyStatus === 'invalid'
                      ? 'Key invalid — update in settings'
                      : 'Connecting...'}
                </p>
              </motion.div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  className="text-gray-400 hover:text-brand-gold"
                >
                  <Key size={16} />
                </button>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </motion.div>

            {showKeyInput && (
              <div className="p-3 bg-[#1A1A1A] border-b border-brand-gold/20">
                <form onSubmit={handleKeySave} className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Gemini API Key"
                      className="flex-1 bg-brand-black border border-brand-gold/30 rounded px-2 py-1 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-brand-gold text-brand-black text-xs px-3 rounded font-bold"
                    >
                      Save
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="text-xs text-gray-500 hover:text-brand-gold text-left"
                  >
                    Reset to .env key
                  </button>
                </form>
              </div>
            )}

            <motion.div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 text-sm mt-4">
                  <p className="mb-4">
                    Ask about pricing or request a live estimate with your vehicle details.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {quickReplies.map((reply, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(reply)}
                        className="bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-xs px-3 py-1.5 rounded-full hover:bg-brand-gold/20 transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <motion.div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      m.role === 'user'
                        ? 'bg-[#1A1A1A] border-l-2 border-brand-gold text-white rounded-tr-sm'
                        : 'bg-[#222222] text-gray-300 rounded-tl-sm'
                    }`}
                  >
                    {m.text}
                  </motion.div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#222222] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                      className="w-1.5 h-1.5 bg-brand-gold rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                      className="w-1.5 h-1.5 bg-brand-gold rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                      className="w-1.5 h-1.5 bg-brand-gold rounded-full"
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </motion.div>

            <div className="p-3 bg-[#111111] border-t border-brand-gold/20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={apiKey ? 'Type a message...' : 'Enter API Key first'}
                  disabled={!apiKey || loading}
                  className="flex-1 bg-[#1A1A1A] border border-transparent focus:border-brand-gold/30 rounded-full px-4 py-2 text-sm text-white focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || !apiKey || loading}
                  className="w-10 h-10 bg-brand-gold rounded-full flex items-center justify-center text-brand-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
