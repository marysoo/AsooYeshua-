import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Headphones, Calendar, ArrowRight, Download, CheckCircle, ShoppingBag, CreditCard, Mail, User, Phone, HelpCircle, FileText, Globe, Copy, ExternalLink, Check, Smartphone, Laptop } from 'lucide-react';
import { collection, getDocs, addDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product } from '../types';

import { applySEO } from '../lib/seo';

declare const FlutterwaveCheckout: any;

interface MarketplaceSectionProps {
  onSelectSermon: (sermonId: string) => void;
  overrideSelectedProductId?: string | null;
  onClearOverrideProduct?: () => void;
  isActive?: boolean;
}

export default function MarketplaceSection({
  onSelectSermon,
  overrideSelectedProductId,
  onClearOverrideProduct,
  isActive = false
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
  const [submittedDirectPayDetails, setSubmittedDirectPayDetails] = useState(false);
  const [txRef, setTxRef] = useState('');
  const [guideTab, setGuideTab] = useState<'ios' | 'android' | 'desktop'>('ios');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText('https://openingprayer.earningfunnel.workers.dev/');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

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

  // Synchronize activeProduct with window hash to handle browser Back button & SEO deep links gracefully
  useEffect(() => {
    if (showCheckoutModal && activeProduct) {
      const targetHash = `#product=${activeProduct.id}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState({ modal: 'checkout', id: activeProduct.id }, '', targetHash);
      }
    } else {
      if (window.location.hash.startsWith('#product=')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

    const handleHashAndPop = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#product=')) {
        const prodId = hash.replace('#product=', '');
        const found = products.find(p => p.id === prodId);
        if (found) {
          setActiveProduct(found);
          setShowCheckoutModal(true);
        }
      } else if (hash === '#marketplace' || !hash) {
        setShowCheckoutModal(false);
        setActiveProduct(null);
        setSubmittedDirectPayDetails(false);
        setPaymentSuccess(false);
      }
    };

    window.addEventListener('hashchange', handleHashAndPop);
    window.addEventListener('popstate', handleHashAndPop);
    
    // Check hash on load or when products list updates
    if (products.length > 0) {
      handleHashAndPop();
    }

    return () => {
      window.removeEventListener('hashchange', handleHashAndPop);
      window.removeEventListener('popstate', handleHashAndPop);
    };
  }, [showCheckoutModal, activeProduct, products]);

  // SEO Integration for Marketplace
  useEffect(() => {
    if (!isActive) return;

    const origin = window.location.origin || 'https://asooyeshua.com';

    if (activeProduct) {
      const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": activeProduct.title,
        "description": activeProduct.description,
        "image": [
          activeProduct.coverImage && activeProduct.coverImage.startsWith('/') 
            ? `${origin}${activeProduct.coverImage}` 
            : activeProduct.coverImage
        ],
        "offers": {
          "@type": "Offer",
          "url": `${origin}/#product=${activeProduct.id}`,
          "priceCurrency": "NGN",
          "price": activeProduct.price,
          "availability": "https://schema.org/InStock"
        }
      };

      applySEO({
        title: `${activeProduct.title} | AsooYeshua Store`,
        description: activeProduct.description,
        image: activeProduct.coverImage,
        url: `${origin}/#product=${activeProduct.id}`,
        schema: productSchema
      });
    } else {
      const storeSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "AsooYeshua Marketplace",
        "description": "Spiritual study materials, books, and interactive applications compiled by Tersoo Terence Aker.",
        "url": `${origin}/#marketplace`,
        "itemListElement": products.map((p, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "url": `${origin}/#product=${p.id}`,
          "name": p.title
        }))
      };

      applySEO({
        title: "Faith Resources & eBooks | AsooYeshua Marketplace",
        description: "Acquire spiritual study materials, books, and interactive applications compiled by Tersoo Terence Aker (AsooYeshua) to enrich your spiritual devotion.",
        url: `${origin}/#marketplace`,
        schema: storeSchema
      });
    }
  }, [activeProduct, products, isActive]);

  // Fetch products from Firestore
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const [querySnapshot, settingsDoc] = await Promise.all([
        getDocs(collection(db, 'marketplace')).catch((err) => {
          handleFirestoreError(err, OperationType.GET, 'marketplace');
          return null;
        }),
        getDoc(doc(db, 'settings', 'marketplace')).catch((err) => {
          handleFirestoreError(err, OperationType.GET, 'settings/marketplace');
          return null;
        })
      ]);

      const list: Product[] = [];
      if (querySnapshot) {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const docId = doc.id.toLowerCase();
          const titleLower = (data.title || '').toLowerCase();
          
          // Skip any product that is not a Progressive Web App (PWA) / App Access
          // Since sermons/companions are free on the blog, they shouldn't be here with a price tag.
          if (data.type !== 'App Access') {
            return;
          }

          list.push({ id: doc.id, ...data } as Product);
        });
      }
      setProducts(list);

      // Fetch dynamic Flutterwave Pay link settings
      if (settingsDoc && settingsDoc.exists() && settingsDoc.data().flutterwaveLink) {
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
    setSubmittedDirectPayDetails(false);
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
      try {
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
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.CREATE, 'sales');
      }

      setSubmittedDirectPayDetails(true);
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
              } catch (dbErr) {
                handleFirestoreError(dbErr, OperationType.CREATE, 'sales');
              }
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
          Get the official Opening Prayer for Bible Study Progressive Web Application (PWA) to install on your mobile or desktop device. Study scriptures, coordinate opening prayers, and structure home group bible study sessions completely offline.
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
                  {product.type === 'App Access' && <Globe className="w-3 h-3" />}
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
                        {product.id === 'asooyeshua-pwa-app' ? `$7 (~₦${product.price.toLocaleString()})` : `₦${product.price.toLocaleString()}`}
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
              onClick={() => setShowCheckoutModal(false)}
              className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] z-10"
            >
              {/* Header */}
              <div className="bg-stone-950 text-white p-5 flex items-center justify-between border-b border-stone-850 shrink-0 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  <h3 className="font-serif text-lg font-medium text-amber-50 tracking-wide">
                    Securing Your Resource
                  </h3>
                </div>
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Form or Receipt Content (Scrollable Container) */}
              <div className="overflow-y-auto flex-1">
                {submittedDirectPayDetails ? (
                  <div className="p-6 text-center space-y-5">
                    <div className="inline-flex w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full items-center justify-center text-emerald-600 shadow-xs mx-auto">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-stone-900 font-bold">
                        Payment Details Logged
                      </h3>
                      <p className="text-stone-500 text-xs mt-1.5 leading-relaxed">
                        Thank you! Since you selected the <strong>Official Pay Link</strong>, your transaction details have been submitted.
                      </p>
                      <div className="text-left text-stone-600 text-[11px] mt-4 bg-amber-50/55 border border-amber-200/40 p-4 rounded-xl space-y-2 leading-relaxed">
                        <p>
                          <strong>How manual verification works:</strong>
                        </p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Our system logged your details with reference: <span className="font-mono font-bold">{txRef}</span>.</li>
                          <li>Our admin team will cross-verify this name/email against our Flutterwave link deposits.</li>
                          <li>Upon confirmation (typically in <strong>5 to 10 minutes</strong>), your premium PWA app direct link and custom access credentials will be sent to your email: <span className="font-bold text-amber-900">{checkoutForm.email}</span>.</li>
                        </ol>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowCheckoutModal(false);
                        setActiveProduct(null);
                        setPaymentSuccess(false);
                        setSubmittedDirectPayDetails(false);
                        setCheckoutForm({ name: '', email: '', phone: '' });
                      }}
                      className="w-full bg-stone-900 hover:bg-stone-850 text-white py-2.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-colors cursor-pointer"
                    >
                      Return to Bookstore
                    </button>
                  </div>
                ) : !paymentSuccess ? (
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
                          className="w-full bg-stone-900 hover:bg-stone-850 text-white py-3 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-md transition-colors animate-pulse"
                        >
                          <CheckCircle className="w-4 h-4 text-amber-400" /> 
                          {isVerifyingDirectLink ? 'Activating Access...' : 'I completed payment - Unlock download'}
                        </button>

                        {/* Navigation button */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowCheckoutModal(false);
                            setActiveProduct(null);
                          }}
                          className="w-full bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 py-3 rounded-xl font-bold text-xs tracking-widest uppercase transition-colors cursor-pointer mt-2 flex items-center justify-center gap-1.5"
                        >
                          ← Cancel & Go Back
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

                        {/* Navigation button */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowCheckoutModal(false);
                            setActiveProduct(null);
                          }}
                          className="w-full bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 py-3 rounded-xl font-bold text-xs tracking-widest uppercase transition-colors cursor-pointer mt-2 flex items-center justify-center gap-1.5"
                        >
                          ← Cancel & Go Back
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  /* Unlocked direct PWA installation & Setup Guide */
                  <div className="p-6 text-center space-y-6">
                    <div className="inline-flex w-14 h-14 bg-amber-50 border border-amber-200 rounded-full items-center justify-center text-amber-600 shadow-xs">
                      <CheckCircle className="w-8 h-8" />
                    </div>

                    <div>
                      <h3 className="font-serif text-xl text-stone-900 font-bold">
                        Gospel App Access Activated!
                      </h3>
                      <p className="text-stone-500 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                        Thank you for your purchase! Your payment was verified and full access to the **Opening Prayer for Bible Study PWA** is unlocked!
                      </p>
                    </div>

                    {/* Purchased Resource Card */}
                    <div className="bg-stone-50 border border-stone-150 rounded-xl p-3 text-left">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                        Purchased Resource
                      </span>
                      <h4 className="font-serif text-stone-800 font-bold text-xs flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" /> {activeProduct.title}
                      </h4>
                      <span className="text-[10px] text-stone-400 font-mono block mt-1.5">
                        Transaction Ref: {txRef}
                      </span>
                    </div>

                    {/* Direct PWA App Link Card */}
                    <div className="bg-amber-50/45 border border-amber-100 rounded-xl p-4 text-left space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                          Your Direct PWA App Link
                        </span>
                        <p className="text-[11px] text-stone-600 mt-1">
                          To add this app to your home screen, ensure you are browsing in Safari (iOS) or Chrome (Android).
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value="https://openingprayer.earningfunnel.workers.dev/"
                          className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 font-mono flex-1 focus:outline-hidden"
                        />
                        <button
                          onClick={handleCopyLink}
                          className="bg-white border border-stone-200 hover:border-stone-300 text-stone-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        onClick={() => window.open('https://openingprayer.earningfunnel.workers.dev/', '_blank')}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Launch in External Browser
                      </button>
                    </div>

                    {/* Interactive PWA Installation Guide Tabs */}
                    <div className="border border-stone-150 rounded-xl overflow-hidden bg-white text-left">
                      {/* Tabs Header */}
                      <div className="flex border-b border-stone-100 bg-stone-50">
                        <button
                          onClick={() => setGuideTab('ios')}
                          className={`flex-1 py-2 px-3 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
                            guideTab === 'ios'
                              ? 'border-amber-600 text-amber-700 bg-white'
                              : 'border-transparent text-stone-500 hover:text-stone-800'
                          }`}
                        >
                          Apple iOS
                        </button>
                        <button
                          onClick={() => setGuideTab('android')}
                          className={`flex-1 py-2 px-3 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
                            guideTab === 'android'
                              ? 'border-amber-600 text-amber-700 bg-white'
                              : 'border-transparent text-stone-500 hover:text-stone-800'
                          }`}
                        >
                          Android
                        </button>
                        <button
                          onClick={() => setGuideTab('desktop')}
                          className={`flex-1 py-2 px-3 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
                            guideTab === 'desktop'
                              ? 'border-amber-600 text-amber-700 bg-white'
                              : 'border-transparent text-stone-500 hover:text-stone-800'
                          }`}
                        >
                          Desktop
                        </button>
                      </div>

                      {/* Tab Content */}
                      <div className="p-4 space-y-3">
                        {guideTab === 'ios' && (
                          <div className="space-y-3.5 text-xs text-stone-700">
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 bg-stone-100 text-stone-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                1
                              </span>
                              <p>
                                Tap the <span className="font-bold">Share</span> button <span className="inline-block px-1.5 py-0.5 bg-stone-100 rounded text-[10px]">🗳️</span> in the Safari browser menu.
                              </p>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 bg-stone-100 text-stone-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                2
                              </span>
                              <p>
                                Scroll down and tap <span className="font-bold">"Add to Home Screen"</span>.
                              </p>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 bg-stone-100 text-stone-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                3
                              </span>
                              <p>
                                Tap <span className="font-bold">"Add"</span> in the top-right corner to place the **Opening Prayer** launcher icon on your phone!
                              </p>
                            </div>
                          </div>
                        )}

                        {guideTab === 'android' && (
                          <div className="space-y-3.5 text-xs text-stone-700">
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 bg-stone-100 text-stone-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                1
                              </span>
                              <p>
                                Tap the <span className="font-bold">Menu</span> button <span className="font-bold">(three dots ⋮)</span> in Chrome.
                              </p>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 bg-stone-100 text-stone-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                2
                              </span>
                              <p>
                                Select <span className="font-bold">"Install App"</span> or <span className="font-bold">"Add to Home screen"</span> from the list.
                              </p>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 bg-stone-100 text-stone-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                3
                              </span>
                              <p>
                                Confirm the prompt and the app will immediately install as an offline-ready launcher icon.
                              </p>
                            </div>
                          </div>
                        )}

                        {guideTab === 'desktop' && (
                          <div className="space-y-3.5 text-xs text-stone-700">
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 bg-stone-100 text-stone-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                1
                              </span>
                              <p>
                                Look at the right side of the URL browser address bar for the <span className="font-bold">Install</span> icon (looks like a monitor with an arrow or a plus sign).
                              </p>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 bg-stone-100 text-stone-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                2
                              </span>
                              <p>
                                Click <span className="font-bold">"Install"</span> in the popup that appears.
                              </p>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 bg-stone-100 text-stone-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                3
                              </span>
                              <p>
                                The app will open in its own clean window, with its own icon in your system taskbar or dock!
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Usage Guide specifically for the Opening Prayer */}
                    <div className="bg-stone-50 border border-stone-150 rounded-xl p-4 text-left space-y-2 text-xs">
                      <p className="font-bold text-stone-800 flex items-center gap-1">
                        🙏 How to Use the Opening Prayer App:
                      </p>
                      <ul className="text-stone-600 space-y-1.5 list-disc list-inside">
                        <li><strong>Instant Generation:</strong> Select your Bible study theme (e.g., Grace, Faith, Wisdom) and tap "Generate Prayer" to get a beautifully structured opening prayer instantly.</li>
                        <li><strong>Offline Support:</strong> Pin/install the app on your device's home screen. The generator, templates, and scriptures work completely offline during your Bible study sessions.</li>
                        <li><strong>Customization:</strong> Edit any generated prayer or scripture reference before sharing it with your study group or church congregation.</li>
                      </ul>
                    </div>

                    {/* Close & Continue Actions */}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setShowCheckoutModal(false);
                          setActiveProduct(null);
                          setPaymentSuccess(false);
                          setSubmittedDirectPayDetails(false);
                          setCheckoutForm({ name: '', email: '', phone: '' });
                        }}
                        className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-xl font-bold text-xs tracking-widest uppercase cursor-pointer transition-colors"
                      >
                        Return to Bookstore
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
