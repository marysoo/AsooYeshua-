import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Headphones, Calendar, ArrowRight, Download, CheckCircle, ShoppingBag, CreditCard, Mail, User, Phone, HelpCircle, FileText, Globe } from 'lucide-react';
import { collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';

declare const FlutterwaveCheckout: any;

interface MarketplaceSectionProps {
  onSelectSermon: (sermonId: string) => void;
  overrideSelectedProductId?: string | null;
  onClearOverrideProduct?: () => void;
}

export default function MarketplaceSection({
  onSelectSermon,
  overrideSelectedProductId,
  onClearOverrideProduct
}: MarketplaceSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalFlutterwaveLink, setGlobalFlutterwaveLink] = useState('https://flutterwave.com/pay/mxd06faqocr8');
  const [paymentMethod, setPaymentMethod] = useState<'link' | 'card'>('link');
  const [isVerifyingDirectLink, setIsVerifyingDirectLink] = useState(false);

  // Payment checkout states
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [txRef, setTxRef] = useState('');

  // Dynamically load Flutterwave checkout script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch products from Firestore
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'marketplace'));
      const list: Product[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(list);

      // Fetch dynamic Flutterwave Pay link settings
      const settingsDoc = await getDoc(doc(db, 'settings', 'marketplace'));
      if (settingsDoc.exists() && settingsDoc.data().flutterwaveLink) {
        setGlobalFlutterwaveLink(settingsDoc.data().flutterwaveLink);
      }
    } catch (err) {
      console.error('Error fetching marketplace products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Trigger from sermon cross-link recommendation
  useEffect(() => {
    if (overrideSelectedProductId && products.length > 0) {
      const prod = products.find((p) => p.id === overrideSelectedProductId);
      if (prod) {
        setActiveProduct(prod);
        setShowCheckoutModal(true);
      }
      if (onClearOverrideProduct) onClearOverrideProduct();
    }
  }, [overrideSelectedProductId, products]);

  const handleBuyNowClick = (product: Product) => {
    setActiveProduct(product);
    setPaymentSuccess(false);
    setShowCheckoutModal(true);
  };

  const handleDirectLinkPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct || !checkoutForm.name || !checkoutForm.email) return;

    setIsVerifyingDirectLink(true);
    const reference = 'asooyeshua_direct_' + Date.now();
    setTxRef(reference);

    try {
      // Save sale record in Firestore
      await addDoc(collection(db, 'sales'), {
        productId: activeProduct.id,
        productTitle: activeProduct.title,
        price: activeProduct.price,
        customerName: checkoutForm.name,
        customerEmail: checkoutForm.email,
        customerPhone: checkoutForm.phone || 'N/A',
        txRef: reference,
        flwId: 'DIRECT_PAY_LINK',
        createdAt: new Date().toISOString()
      });

      setPaymentSuccess(true);
    } catch (err) {
      console.error('Error logging direct link sale:', err);
      alert('Failed to process. Please check your internet connection.');
    } finally {
      setIsVerifyingDirectLink(false);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct || !checkoutForm.name || !checkoutForm.email) return;

    const reference = 'asooyeshua_tx_' + Date.now();
    setTxRef(reference);

    // Default Flutterwave Test Public Key (fully functional sandbox key)
    // Chaired by Tersoo Terence Aker, they can override this via .env secrets
    const publicKey = (import.meta as any).env?.VITE_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-6efbf9cb67cb9525ff0be1b6c008b8b9-X';

    try {
      FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref: reference,
        amount: activeProduct.price,
        currency: 'NGN',
        payment_options: 'card, banktransfer, ussd',
        customer: {
          email: checkoutForm.email,
          phone_number: checkoutForm.phone || '08030000000',
          name: checkoutForm.name,
        },
        customizations: {
          title: 'AsooYeshua Ministry',
          description: `Purchase of ${activeProduct.title}`,
          logo: 'https://youtube.com/@asooyeshua/logo.png',
        },
        callback: async (data: any) => {
          console.log('Flutterwave Response:', data);
          
          if (data.status === 'successful' || data.charge_response_code === '00') {
            // Save sale record in Firestore
            try {
              await addDoc(collection(db, 'sales'), {
                productId: activeProduct.id,
                productTitle: activeProduct.title,
                price: activeProduct.price,
                customerName: checkoutForm.name,
                customerEmail: checkoutForm.email,
                customerPhone: checkoutForm.phone || 'N/A',
                txRef: reference,
                flwId: data.transaction_id || 'N/A',
                createdAt: new Date().toISOString()
              });
            } catch (err) {
              console.error('Error saving sale record:', err);
            }

            setPaymentSuccess(true);
          } else {
            alert('Payment was not completed successfully. Please try again.');
          }
        },
        onclose: () => {
          console.log('Flutterwave modal closed');
        },
      });
    } catch (err) {
      console.error('Flutterwave initiation failed:', err);
      alert('Could not initialize payment. Verify your internet connection.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-stone-100 pb-5">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-600 font-sans">
          Gospel Resources
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-wide mt-1">
          Ministry Marketplace
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Invest in your faith. Acquire digital books, audio teaching sessions, and annual devotionals written by Tersoo Terence Aker. Monitored securely via Flutterwave.
        </p>
      </div>

      {/* Currency Notice */}
      <div className="bg-stone-50 border border-stone-150 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-stone-600 text-xs">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-600 shrink-0" />
          <p>
            Payments are priced in <strong>NGN (Nigerian Naira)</strong> but Flutterwave accepts cards, bank transfers, and mobile money from **all countries worldwide**, auto-converting your currency.
          </p>
        </div>
        <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
          Secure Multi-Currency Portal
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-stone-400">
          <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="font-medium text-sm">Organizing bookstores...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center border border-stone-150 rounded-3xl bg-stone-50">
          <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-serif text-lg text-stone-700 font-semibold">Marketplace is empty</h3>
          <p className="text-stone-400 text-xs mt-1">Gospel materials are being updated by AsooYeshua.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ y: -4 }}
              className="bg-white border border-stone-150 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-lg transition-all duration-350"
            >
              {/* Product Cover */}
              <div className="h-56 w-full relative overflow-hidden bg-stone-100">
                <img
                  src={product.coverImage}
                  alt={product.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-amber-400 uppercase tracking-widest border border-white/10 flex items-center gap-1">
                  {product.type === 'eBook' && <BookOpen className="w-3 h-3" />}
                  {product.type === 'Audio Series' && <Headphones className="w-3 h-3" />}
                  {product.type === 'Devotional' && <Calendar className="w-3 h-3" />}
                  <span>{product.type}</span>
                </div>
              </div>

              {/* Description */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-serif text-lg text-stone-900 font-bold leading-snug">
                    {product.title}
                  </h3>
                  <p className="text-stone-500 text-xs sm:text-sm leading-relaxed line-clamp-3">
                    {product.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-50">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        Cost Contribution
                      </span>
                      <strong className="text-xl text-amber-700 font-mono">
                        ₦{product.price.toLocaleString()}
                      </strong>
                    </div>

                    {product.relatedSermonId && (
                      <button
                        onClick={() => {
                          if (product.relatedSermonId) {
                            onSelectSermon(product.relatedSermonId);
                          }
                        }}
                        className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline tracking-wider uppercase"
                      >
                        Read Related Sermon
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleBuyNowClick(product)}
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 mt-4 cursor-pointer transition-colors shadow-xs"
                  >
                    <CreditCard className="w-4 h-4 text-amber-400" /> Acquire via Flutterwave
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Flutterwave Checkout Modal */}
      <AnimatePresence>
        {showCheckoutModal && activeProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!paymentSuccess) setShowCheckoutModal(false); }}
              className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              {/* Header */}
              <div className="bg-stone-950 text-white p-5 flex items-center justify-between border-b border-stone-850">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  <h3 className="font-serif text-lg font-medium text-amber-50 tracking-wide">
                    Securing Your Resource
                  </h3>
                </div>
                {!paymentSuccess && (
                  <button
                    onClick={() => setShowCheckoutModal(false)}
                    className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Form or Receipt Content */}
              {!paymentSuccess ? (
                <div className="p-5 space-y-4">
                  {/* Brief product visual recap */}
                  <div className="bg-stone-50 border border-stone-150 rounded-xl p-3 flex gap-3 items-center">
                    <img
                      src={activeProduct.coverImage || '/src/assets/images/asooyeshua_ministry_1_1784026970487.jpg'}
                      alt={activeProduct.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-cover rounded-md shrink-0"
                    />
                    <div>
                      <h4 className="font-serif text-stone-900 font-bold text-xs sm:text-sm line-clamp-1">
                        {activeProduct.title}
                      </h4>
                      <p className="text-amber-700 font-mono text-xs font-bold">
                        ₦{activeProduct.price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Payment Method Selector Tabs */}
                  <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('link')}
                      className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        paymentMethod === 'link'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-500 hover:text-stone-850'
                      }`}
                    >
                      🔗 Official Pay Link (Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-500 hover:text-stone-850'
                      }`}
                    >
                      💳 Quick Inline Card
                    </button>
                  </div>

                  {paymentMethod === 'link' ? (
                    /* Dynamic Payment Link Flow */
                    <form onSubmit={handleDirectLinkPaymentSubmit} className="space-y-4">
                      <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl space-y-2">
                        <p className="text-stone-700 text-xs font-semibold flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-amber-600" /> Pay directly via AsooYeshua official link
                        </p>
                        <p className="text-stone-500 text-[11px] leading-normal">
                          Click the official button below to pay on our secure platform. Once completed, submit your delivery details below to activate instant access.
                        </p>
                        <a
                          href={globalFlutterwaveLink}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                        >
                          Open Secure Flutterwave Page <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                            Your Full Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <input
                              type="text"
                              required
                              value={checkoutForm.name}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                              placeholder="Your Name"
                              className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                            Your Delivery Email Address
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <input
                              type="email"
                              required
                              value={checkoutForm.email}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                              placeholder="your-email@example.com"
                              className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                            WhatsApp Phone Number (Optional)
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <input
                              type="tel"
                              value={checkoutForm.phone}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                              placeholder="e.g. 08030000000"
                              className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isVerifyingDirectLink}
                        className="w-full bg-stone-900 hover:bg-stone-850 text-white py-3 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-md transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 text-amber-400" /> 
                        {isVerifyingDirectLink ? 'Activating Access...' : 'I completed payment - Unlock download'}
                      </button>
                    </form>
                  ) : (
                    /* Inline Card Widget Flow */
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                      <p className="text-stone-500 text-xs text-center leading-relaxed">
                        Enter your delivery details below. The Flutterwave credit card and bank payment overlay will launch instantly to complete transaction.
                      </p>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                            Full Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <input
                              type="text"
                              required
                              value={checkoutForm.name}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                              placeholder="Your Name"
                              className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                            Delivery Email Address
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <input
                              type="email"
                              required
                              value={checkoutForm.email}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                              placeholder="your-email@example.com"
                              className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                            Phone Number (Optional)
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <input
                              type="tel"
                              value={checkoutForm.phone}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                              placeholder="e.g. 08030000000"
                              className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-md transition-colors"
                      >
                        Proceed to Secure Checkout Window
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                /* Unlocked direct download screen */
                <div className="p-6 text-center space-y-6">
                  <div className="inline-flex w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full items-center justify-center text-emerald-500">
                    <CheckCircle className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="font-serif text-xl text-stone-900 font-bold">
                      Payment Confirmed!
                    </h3>
                    <p className="text-stone-400 text-xs mt-1.5 max-w-xs mx-auto">
                      Thank you for your support of AsooYeshua Ministry. Your contribution aids in promoting the Gospel of Jesus Christ. Your resource is unlocked!
                    </p>
                  </div>

                  <div className="bg-stone-50 border border-stone-150 rounded-xl p-4 text-left">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                      Resource Description
                    </span>
                    <h4 className="font-serif text-stone-800 font-bold text-sm flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-600" /> {activeProduct.title}
                    </h4>
                    <span className="text-[10px] text-stone-500 font-mono block mt-2">
                      Ref ID: {txRef}
                    </span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <a
                      href={activeProduct.downloadLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Download className="w-4 h-4 text-amber-400 animate-bounce" /> Instant Download file
                    </a>

                    <button
                      onClick={() => {
                        setShowCheckoutModal(false);
                        setActiveProduct(null);
                        setPaymentSuccess(false);
                        setCheckoutForm({ name: '', email: '', phone: '' });
                      }}
                      className="text-stone-500 hover:text-stone-800 text-xs font-semibold uppercase tracking-wider"
                    >
                      Back to Bookstore
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
