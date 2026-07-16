export interface Sermon {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  coverImage: string;
  readTime: string;
  date: string;
  author: string;
  clicks: number;
  relatedMarketId?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number; // in NGN
  type: 'eBook' | 'Audio Series' | 'Devotional' | 'App Access';
  downloadLink: string;
  coverImage: string;
  relatedSermonId?: string;
  purchases: number;
}

export interface Booking {
  id: string;
  name: string;
  whatsapp: string;
  date: string;
  time: string;
  message: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
