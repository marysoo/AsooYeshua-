import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, DollarSign, MessageCircle, Check, Trash2, Key, ShieldAlert, ArrowRight, RefreshCw, ShoppingCart, UserCheck, PhoneCall, Plus, Edit, Link2, BookOpen, Headphones, Save, Sparkles, FileText, Globe } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Booking, Product, Sermon } from '../types';

interface SaleRecord {
  id: string;
  productId: string;
  productTitle: string;
  price: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  txRef: string;
  createdAt: string;
}

export default function AdminPanel() {
  const [authorized, setAuthorized] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [flutterwaveLink, setFlutterwaveLink] = useState('https://flutterwave.com/pay/mxd06faqocr8');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'bookings' | 'sales' | 'products'>('bookings');

  // Form states for adding/editing product
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: 2500,
    type: 'eBook' as 'eBook' | 'Audio Series' | 'Devotional',
    downloadLink: '',
    coverImage: '',
    relatedSermonId: ''
  });

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'Yeshua777') {
      setAuthorized(true);
      setError('');
      fetchAdminData();
    } else {
      setError('Invalid pastoral passcode. Access denied.');
    }
  };

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch bookings
      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      const bookingsList: Booking[] = [];
      bookingsSnap.forEach((d) => {
        bookingsList.push({ id: d.id, ...d.data() } as Booking);
      });
      // Sort bookings (newest first)
      bookingsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(bookingsList);

      // Fetch sales
      const salesSnap = await getDocs(collection(db, 'sales'));
      const salesList: SaleRecord[] = [];
      salesSnap.forEach((d) => {
        salesList.push({ id: d.id, ...d.data() } as SaleRecord);
      });
      salesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSales(salesList);

      // Fetch products
      const productsSnap = await getDocs(collection(db, 'marketplace'));
      const productsList: Product[] = [];
      productsSnap.forEach((d) => {
        productsList.push({ id: d.id, ...d.data() } as Product);
      });
      setProducts(productsList);

      // Fetch sermons
      const sermonsSnap = await getDocs(collection(db, 'sermons'));
      const sermonsList: Sermon[] = [];
      sermonsSnap.forEach((d) => {
        sermonsList.push({ id: d.id, ...d.data() } as Sermon);
      });
      setSermons(sermonsList);

      // Fetch settings
      const settingsDoc = await getDoc(doc(db, 'settings', 'marketplace'));
      if (settingsDoc.exists() && settingsDoc.data().flutterwaveLink) {
        setFlutterwaveLink(settingsDoc.data().flutterwaveLink);
      }
    } catch (err) {
      console.error('Error loading admin records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title || !productForm.description || !productForm.downloadLink) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      setIsLoading(true);
      const productData = {
        title: productForm.title,
        description: productForm.description,
        price: Number(productForm.price) || 0,
        type: productForm.type,
        downloadLink: productForm.downloadLink,
        coverImage: productForm.coverImage || '/src/assets/images/asooyeshua_ministry_1_1784026970487.jpg',
        relatedSermonId: productForm.relatedSermonId || null,
        purchases: editingProduct ? editingProduct.purchases : 0
      };

      if (editingProduct) {
        // Update product
        await setDoc(doc(db, 'marketplace', editingProduct.id), productData);
        alert('Product updated successfully!');
      } else {
        // Create product (generate a clean ID from title)
        const newId = productForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await setDoc(doc(db, 'marketplace', newId), productData);
        alert('Product published successfully!');
      }

      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({
        title: '',
        description: '',
        price: 2500,
        type: 'eBook',
        downloadLink: '',
        coverImage: '',
        relatedSermonId: ''
      });
      await fetchAdminData();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProductClick = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      description: product.description,
      price: product.price,
      type: product.type,
      downloadLink: product.downloadLink,
      coverImage: product.coverImage,
      relatedSermonId: product.relatedSermonId || ''
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action is permanent.')) return;
    try {
      setIsLoading(true);
      await deleteDoc(doc(db, 'marketplace', productId));
      alert('Product deleted successfully.');
      await fetchAdminData();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSettings(true);
      await setDoc(doc(db, 'settings', 'marketplace'), { flutterwaveLink });
      alert('Flutterwave payment link updated successfully!');
    } catch (err) {
      console.error('Error saving marketplace settings:', err);
      alert('Failed to save payment settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, currentDocId: string, newStatus: 'completed' | 'cancelled') => {
    try {
      // Find matching document in Firestore
      const snap = await getDocs(collection(db, 'bookings'));
      let targetDocId = '';
      snap.forEach((docRef) => {
        if (docRef.data().whatsapp === bookings.find(b => b.id === bookingId)?.whatsapp && docRef.data().date === bookings.find(b => b.id === bookingId)?.date) {
          targetDocId = docRef.id;
        }
      });

      if (targetDocId) {
        await updateDoc(doc(db, 'bookings', targetDocId), { status: newStatus });
        await fetchAdminData();
        alert(`Reservation marked as ${newStatus}!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this call reservation?')) return;
    try {
      const snap = await getDocs(collection(db, 'bookings'));
      let targetDocId = '';
      snap.forEach((docRef) => {
        if (docRef.data().whatsapp === bookings.find(b => b.id === bookingId)?.whatsapp) {
          targetDocId = docRef.id;
        }
      });

      if (targetDocId) {
        await deleteDoc(doc(db, 'bookings', targetDocId));
        await fetchAdminData();
        alert('Booking removed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getWhatsAppContactLink = (b: Booking) => {
    // Standardize phone number for WhatsApp link
    let phone = b.whatsapp.replace(/[^0-9]/g, '');
    if (phone.startsWith('0') && phone.length === 11) {
      phone = '234' + phone.substring(1); // Default to Nigeria country code if starts with domestic 0
    }
    const message = `Hello ${b.name}, this is Tersoo Terence Aker (AsooYeshua). I am writing to confirm our scheduled prayer/fellowship call booked for ${b.date} at ${b.time}. I am looking forward to talking with you!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const totalRevenue = sales.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="border-b border-stone-100 pb-5">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-600 font-sans">
          Pastoral Console
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-wide mt-1">
          AsooYeshua Admin Workspace
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Review, arrange, and manage call bookings and marketplace contributions in real-time.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!authorized ? (
          /* Login Form */
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-6"
          >
            <div className="inline-flex w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-full items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-serif text-xl text-stone-900 font-semibold">
                Authorized Access Only
              </h3>
              <p className="text-stone-400 text-xs mt-1 max-w-xs mx-auto">
                Please provide the personal passcode to view call bookings, customer emails, and secure transaction history.
              </p>
            </div>

            <form onSubmit={handleAuthorize} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                  Pastoral Passcode
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                  <input
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter admin passcode (e.g. Yeshua777)"
                    className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-hidden focus:border-amber-500 text-stone-800"
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                    ⚠️ {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                Access Sanctuary Console <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </form>
          </motion.div>
        ) : (
          /* Admin Dashboard Dashboard */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Quick Stats overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white border border-stone-150 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Pending Inquiries
                  </span>
                  <strong className="text-3xl text-stone-900 font-serif block mt-1">
                    {bookings.filter((b) => b.status === 'pending').length}
                  </strong>
                </div>
                <div className="w-11 h-11 bg-amber-500/10 text-amber-700 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-stone-150 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Total Transactions
                  </span>
                  <strong className="text-3xl text-stone-900 font-serif block mt-1">
                    {sales.length}
                  </strong>
                </div>
                <div className="w-11 h-11 bg-emerald-500/10 text-emerald-700 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-stone-150 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Total Monitored Revenue
                  </span>
                  <strong className="text-2xl sm:text-3xl text-emerald-800 font-mono block mt-1">
                    ₦{totalRevenue.toLocaleString()}
                  </strong>
                </div>
                <div className="w-11 h-11 bg-emerald-500/10 text-emerald-700 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Admin navigation and refresh */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-stone-900 p-3 rounded-2xl border border-stone-850">
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`px-5 py-2 text-xs font-bold rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'bookings'
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Call Reservations ({bookings.length})
                </button>
                <button
                  onClick={() => setActiveTab('sales')}
                  className={`px-5 py-2 text-xs font-bold rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'sales'
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Bookstore Sales ({sales.length})
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-5 py-2 text-xs font-bold rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Bookstore Products ({products.length})
                </button>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  onClick={fetchAdminData}
                  disabled={isLoading}
                  className="bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-300 p-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold uppercase cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
            </div>

            {/* Loading Indicator */}
            {isLoading ? (
              <div className="py-20 text-center text-stone-400">
                <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="font-medium text-sm">Loading database records...</p>
              </div>
            ) : activeTab === 'bookings' ? (
              /* Bookings Listing */
              bookings.length === 0 ? (
                <div className="py-16 text-center border border-stone-150 rounded-2xl bg-stone-50">
                  <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <h3 className="font-serif text-lg text-stone-700 font-semibold">No reservations found</h3>
                  <p className="text-stone-400 text-xs mt-1">Bookings submitted via the AI Assistant will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className={`bg-white border ${
                        booking.status === 'completed'
                          ? 'border-emerald-200 bg-emerald-500/[0.01]'
                          : 'border-stone-200'
                      } p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-5`}
                    >
                      {/* Booking Left: Client Info & Preferred Time */}
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <strong className="text-stone-900 font-serif text-base sm:text-lg block">
                            {booking.name}
                          </strong>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              booking.status === 'pending'
                                ? 'bg-amber-100 border-amber-200 text-amber-700'
                                : booking.status === 'completed'
                                ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                                : 'bg-stone-100 border-stone-200 text-stone-500'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600 text-xs">
                          <p>
                            📞 WhatsApp: <strong className="text-stone-800">{booking.whatsapp}</strong>
                          </p>
                          <p>
                            🗓️ Date/Time:{' '}
                            <strong className="text-stone-850">
                              {booking.date} at {booking.time}
                            </strong>
                          </p>
                        </div>

                        {booking.message && (
                          <div className="bg-stone-50 border border-stone-100 p-3 rounded-xl">
                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block mb-1">
                              Prayer request / Message
                            </span>
                            <p className="text-stone-700 text-xs leading-relaxed italic">
                              "{booking.message}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Booking Right: Action CTA Buttons */}
                      <div className="flex flex-row md:flex-col justify-end items-center gap-2 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-stone-100">
                        {/* WhatsApp Trigger */}
                        <a
                          href={getWhatsAppContactLink(booking)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 fill-stone-950" /> Initiate WhatsApp
                        </a>

                        {booking.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateBookingStatus(booking.id, booking.id, 'completed')}
                            className="flex items-center gap-1 border border-emerald-200 hover:bg-emerald-50 text-emerald-700 text-xs px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" /> Complete Call
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="text-stone-400 hover:text-red-600 p-2.5 rounded-xl border border-stone-200 hover:border-red-200 hover:bg-red-50/50 transition-colors cursor-pointer"
                          title="Delete Booking"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )) : activeTab === 'sales' ? (
                /* Sales Listing */
                sales.length === 0 ? (
                  <div className="py-16 text-center border border-stone-150 rounded-2xl bg-stone-50">
                    <DollarSign className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                    <h3 className="font-serif text-lg text-stone-700 font-semibold">No sales logged</h3>
                    <p className="text-stone-400 text-xs mt-1">Sales cleared through Flutterwave Checkout will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-stone-250 rounded-2xl bg-white shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          <th className="p-4">Customer</th>
                          <th className="p-4">Product Purchased</th>
                          <th className="p-4">Reference</th>
                          <th className="p-4">Date</th>
                          <th className="p-4 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-xs sm:text-sm text-stone-700">
                        {sales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-stone-50/50">
                            <td className="p-4">
                              <strong className="text-stone-900 block">{sale.customerName}</strong>
                              <span className="text-[10px] text-stone-400 block mt-0.5">{sale.customerEmail}</span>
                            </td>
                            <td className="p-4 font-serif font-medium">{sale.productTitle}</td>
                            <td className="p-4 font-mono text-[11px] text-stone-400">{sale.txRef}</td>
                            <td className="p-4 text-stone-500">
                              {new Date(sale.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="p-4 text-right font-mono font-bold text-emerald-800">
                              ₦{sale.price.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                /* Products Management Panel */
                <div className="space-y-6">
                  {/* General Payment Link Settings */}
                  <div className="bg-white border border-stone-150 p-5 rounded-2xl shadow-xs space-y-4">
                    <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                      <Globe className="w-5 h-5 text-amber-600" />
                      <div>
                        <h3 className="font-serif text-base text-stone-900 font-semibold">Active Flutterwave Link Settings</h3>
                        <p className="text-stone-500 text-[11px]">Specify the official link from your Flutterwave dashboard to process direct payments.</p>
                      </div>
                    </div>
                    <form onSubmit={handleSaveSettings} className="flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                          Flutterwave Pay Link
                        </label>
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                          <input
                            type="url"
                            required
                            value={flutterwaveLink}
                            onChange={(e) => setFlutterwaveLink(e.target.value)}
                            placeholder="https://flutterwave.com/pay/your-link-id"
                            className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-hidden focus:border-amber-500 text-stone-800 animate-none"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="bg-stone-900 hover:bg-stone-850 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        <Save className="w-4 h-4 text-amber-400" /> {isSavingSettings ? 'Saving...' : 'Update Pay Link'}
                      </button>
                    </form>
                  </div>

                  {/* Products List & Add/Edit Form Section */}
                  <div className="bg-white border border-stone-150 p-5 rounded-2xl shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-lg text-stone-900 font-semibold">Gospel Product Catalog</h3>
                        <p className="text-stone-500 text-xs">Manage the eBooks, audio series, and devotionals published on the storefront.</p>
                      </div>
                      {!showProductForm && (
                        <button
                          onClick={() => {
                            setEditingProduct(null);
                            setProductForm({
                              title: '',
                              description: '',
                              price: 2500,
                              type: 'eBook',
                              downloadLink: '',
                              coverImage: '',
                              relatedSermonId: ''
                            });
                            setShowProductForm(true);
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Plus className="w-4 h-4 text-stone-950" /> Publish Digital Product
                        </button>
                      )}
                    </div>

                    {/* Add/Edit Product Form */}
                    <AnimatePresence>
                      {showProductForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-stone-50 border border-stone-150 rounded-xl p-5 space-y-4 overflow-hidden"
                        >
                          <h4 className="font-serif text-sm font-bold text-stone-800 border-b border-stone-200 pb-2 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            {editingProduct ? `Modify Product: ${editingProduct.title}` : 'Publish a New Gospel Product'}
                          </h4>
                          
                          <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Product Title</label>
                              <input
                                type="text"
                                required
                                value={productForm.title}
                                onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                                placeholder="e.g. Divine Foundations eBook"
                                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-amber-500 text-stone-800"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Price (₦ NGN)</label>
                              <input
                                type="number"
                                required
                                min="0"
                                value={productForm.price}
                                onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                                placeholder="e.g. 2500"
                                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-amber-500 text-stone-800"
                              />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Description / Synopsis</label>
                              <textarea
                                required
                                rows={3}
                                value={productForm.description}
                                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                placeholder="Describe this gospel material..."
                                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-amber-500 resize-none text-stone-800"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Product Category Type</label>
                              <select
                                value={productForm.type}
                                onChange={(e) => setProductForm({ ...productForm, type: e.target.value as any })}
                                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-amber-500 text-stone-800"
                              >
                                <option value="eBook">📖 eBook (Digital PDF Guide)</option>
                                <option value="Audio Series">🎧 Audio Series (Audio Teaching MP3)</option>
                                <option value="Devotional">📅 Devotional (Daily Bible Study Booklet)</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Downloadable File Link</label>
                              <input
                                type="url"
                                required
                                value={productForm.downloadLink}
                                onChange={(e) => setProductForm({ ...productForm, downloadLink: e.target.value })}
                                placeholder="e.g. https://asooyeshua.org/ebooks/grace.pdf"
                                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-amber-500 text-stone-800"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Cover Image URL (Optional)</label>
                              <input
                                type="text"
                                value={productForm.coverImage}
                                onChange={(e) => setProductForm({ ...productForm, coverImage: e.target.value })}
                                placeholder="Leave blank to use default beautiful church cover"
                                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-amber-500 text-stone-800"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Link to Related Sermon (Optional)</label>
                              <select
                                value={productForm.relatedSermonId}
                                onChange={(e) => setProductForm({ ...productForm, relatedSermonId: e.target.value })}
                                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-amber-500 text-stone-800"
                              >
                                <option value="">No Sermon Connection</option>
                                {sermons.map((sermon) => (
                                  <option key={sermon.id} value={sermon.id}>
                                    {sermon.title}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="md:col-span-2 pt-2 flex justify-end gap-3 border-t border-stone-200">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowProductForm(false);
                                  setEditingProduct(null);
                                }}
                                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                              >
                                Discard
                              </button>
                              <button
                                type="submit"
                                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-850 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5 text-amber-400" />
                                {editingProduct ? 'Save Modifications' : 'Publish to Storefront'}
                              </button>
                            </div>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Products Grid List */}
                    {products.length === 0 ? (
                      <div className="py-10 text-center border border-dashed border-stone-200 rounded-2xl bg-stone-50">
                        <p className="text-stone-400 text-xs">No custom products created yet. Feel free to publish your first eBook or audio files above!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-stone-700">
                        {products.map((p) => (
                          <div key={p.id} className="border border-stone-200 rounded-2xl bg-white overflow-hidden shadow-xs flex flex-col justify-between">
                            {/* Card cover preview */}
                            <div className="h-40 bg-stone-100 relative">
                              <img
                                src={p.coverImage || '/src/assets/images/asooyeshua_ministry_1_1784026970487.jpg'}
                                alt={p.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-2 left-2 bg-stone-900/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-amber-400 uppercase tracking-widest border border-white/10">
                                {p.type}
                              </span>
                            </div>

                            {/* Info */}
                            <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                              <div className="space-y-1">
                                <h4 className="font-serif text-sm font-bold text-stone-900 line-clamp-1">{p.title}</h4>
                                <p className="text-stone-500 text-[11px] line-clamp-2">{p.description}</p>
                              </div>

                              <div className="pt-2 border-t border-stone-50 flex items-center justify-between text-xs">
                                <div>
                                  <span className="text-[8px] font-bold text-stone-400 uppercase block">Price</span>
                                  <strong className="text-amber-700 font-mono">₦{p.price.toLocaleString()}</strong>
                                </div>
                                <div>
                                  <span className="text-[8px] font-bold text-stone-400 uppercase block">Downloads</span>
                                  <span className="text-stone-700 font-medium">{p.purchases || 0} times</span>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                                <button
                                  onClick={() => handleEditProductClick(p)}
                                  className="p-2 border border-stone-200 hover:border-amber-300 hover:bg-amber-50 rounded-lg text-stone-500 hover:text-amber-800 transition-all cursor-pointer"
                                  title="Edit Product"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-2 border border-stone-200 hover:border-red-200 hover:bg-red-50 rounded-lg text-stone-500 hover:text-red-700 transition-all cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
