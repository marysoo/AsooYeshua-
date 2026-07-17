import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Calendar, User, Clock, BookOpen, ChevronRight, ArrowLeft, Plus, Lock, Key, Eye, HelpCircle, AlertCircle, ShoppingCart, Download, Headphones, FileText, Camera, Upload, Share2, Copy, Check } from 'lucide-react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Sermon, Product } from '../types';
import Markdown from 'react-markdown';

import { applySEO } from '../lib/seo';

interface BlogSectionProps {
  onSelectProduct: (productId: string) => void;
  isActive?: boolean;
}

const FREE_RESOURCES = [
  {
    id: 'foundations-of-faith',
    title: 'The Foundations of Faith: Gospel Guidebook',
    description: 'An inspiring digital eBook detailing the foundational truths of the gospel of Jesus Christ, written by Tersoo Terence Aker. Equips you to understand and share the word of God effectively.',
    type: 'eBook',
    downloadLink: 'https://asooyeshua.org/ebooks/foundations-of-faith.pdf',
    coverImage: '/src/assets/images/cross_on_hill_1784165487177.jpg',
    fileSize: '2.4 MB'
  },
  {
    id: 'daily-grace-devotional',
    title: 'Daily Grace: 365 Devotional Calendar',
    description: 'A beautiful annual digital devotional booklet featuring daily scriptures, prayers, and deep theological reflections by AsooYeshua to fuel your morning quiet time.',
    type: 'Devotional',
    downloadLink: 'https://asooyeshua.org/ebooks/daily-grace.pdf',
    coverImage: '/src/assets/images/faith_path_1784165500493.jpg',
    fileSize: '4.1 MB'
  },
  {
    id: 'sermons-of-grace-audio',
    title: 'Promoting the Gospel: Sermons of Grace (Audio Series)',
    description: 'A premium, high-quality audio collection of 5 powerful MP3 sermon recordings on Grace, Salvation, and Faith preached live by AsooYeshua (Tersoo Terence Aker).',
    type: 'Audio Series',
    downloadLink: 'https://asooyeshua.org/audio/sermons-of-grace.zip',
    coverImage: '/src/assets/images/open_bible_1784165511489.jpg',
    fileSize: '45 MB'
  }
];

const CATEGORIES = ['All', 'Grace & Salvation', 'Faith & Walking', 'Gospel Ministry'];

export default function BlogSection({ onSelectProduct, isActive = false }: BlogSectionProps) {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleCopySermonLink = (sermonId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#sermon=${sermonId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }).catch(err => {
      console.error('Failed to copy link:', err);
    });
  };

  // Admin access
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Add sermon form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSermon, setNewSermon] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'Grace & Salvation',
    coverImage: '/src/assets/images/asooyeshua_ministry_1_1784026970487.jpg',
    readTime: '5 min read',
    relatedMarketId: '',
    tags: ''
  });

  // Edit sermon state
  const [isEditing, setIsEditing] = useState(false);
  const [editSermonData, setEditSermonData] = useState({
    docId: '',
    id: '',
    title: '',
    summary: '',
    content: '',
    category: 'Grace & Salvation',
    coverImage: '/src/assets/images/asooyeshua_ministry_1_1784026970487.jpg',
    readTime: '5 min read',
    relatedMarketId: '',
    tagsString: ''
  });

  // Load sermons from Firestore
  const fetchSermons = async () => {
    setIsLoading(true);
    try {
      let querySnapshot;
      try {
        querySnapshot = await getDocs(collection(db, 'sermons'));
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'sermons');
      }
      const list: Sermon[] = [];
      if (querySnapshot) {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            ...data,
            id: data.id || doc.id,
            docId: doc.id
          } as Sermon);
        });
      }
      // Sort sermons by date descending (assuming format "July XX, 2026")
      // In real prod, sorting by a timestamp is preferred. For now, we can sort by id or title length as fallback
      setSermons(list);
    } catch (err) {
      console.error('Error fetching sermons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSermons();
  }, []);

  // Synchronize selectedSermon with window hash to handle browser Back button & SEO deep links gracefully
  useEffect(() => {
    if (selectedSermon) {
      const targetHash = `#sermon=${selectedSermon.id}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState({ view: 'sermon', id: selectedSermon.id }, '', targetHash);
      }
    } else {
      if (window.location.hash.startsWith('#sermon=')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

    const handleHashAndPop = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#sermon=')) {
        const sermonId = hash.replace('#sermon=', '');
        const found = sermons.find(s => s.id === sermonId);
        if (found) {
          setSelectedSermon(found);
        }
      } else if (hash === '#blog' || !hash) {
        setSelectedSermon(null);
      }
    };

    window.addEventListener('hashchange', handleHashAndPop);
    window.addEventListener('popstate', handleHashAndPop);
    
    // Check hash on load or when sermons list updates
    if (sermons.length > 0) {
      handleHashAndPop();
    }

    return () => {
      window.removeEventListener('hashchange', handleHashAndPop);
      window.removeEventListener('popstate', handleHashAndPop);
    };
  }, [selectedSermon, sermons]);

  // SEO integration for blog
  useEffect(() => {
    if (!isActive) return;

    const origin = window.location.origin || 'https://asooyeshua.com';

    if (selectedSermon) {
      const articleSchema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": selectedSermon.title,
        "description": selectedSermon.summary,
        "image": [
          selectedSermon.coverImage && selectedSermon.coverImage.startsWith('/') 
            ? `${origin}${selectedSermon.coverImage}` 
            : selectedSermon.coverImage
        ],
        "datePublished": selectedSermon.date,
        "author": {
          "@type": "Person",
          "name": "Tersoo Terence Aker",
          "alternateName": "AsooYeshua",
          "url": origin
        },
        "publisher": {
          "@type": "Organization",
          "name": "AsooYeshua Ministry",
          "logo": {
            "@type": "ImageObject",
            "url": `${origin}/src/assets/images/asooyeshua_ministry_1_1784026970487.jpg`
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `${origin}/#sermon=${selectedSermon.id}`
        },
        "keywords": selectedSermon.tags ? selectedSermon.tags.join(', ') : 'Grace, Faith, Salvation'
      };

      applySEO({
        title: `${selectedSermon.title} | AsooYeshua Sermons`,
        description: selectedSermon.summary,
        keywords: selectedSermon.tags ? selectedSermon.tags.join(', ') : undefined,
        image: selectedSermon.coverImage,
        url: `${origin}/#sermon=${selectedSermon.id}`,
        schema: articleSchema
      });
    } else {
      const blogSchema = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "AsooYeshua Sermon Blog",
        "description": "Explore the library of inspirational sermons and theological resources compiled by preacher Tersoo Terence Aker (AsooYeshua).",
        "url": `${origin}/#blog`,
        "blogPost": sermons.map(s => ({
          "@type": "BlogPosting",
          "headline": s.title,
          "description": s.summary,
          "url": `${origin}/#sermon=${s.id}`,
          "datePublished": s.date
        }))
      };

      applySEO({
        title: "Inspirational Sermons & Teachings | AsooYeshua Ministry",
        description: "Explore the library of inspirational sermons and theological resources compiled by preacher Tersoo Terence Aker (AsooYeshua), dedicated to promoting the pure gospel of grace.",
        url: `${origin}/#blog`,
        schema: blogSchema
      });
    }
  }, [selectedSermon, sermons, isActive]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === 'Yeshua777') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPass('');
      setLoginError('');
    } else {
      setLoginError('Incorrect passcode. Please try again.');
    }
  };

  const handleAddSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSermon.title || !newSermon.content || !newSermon.summary) return;

    try {
      const dateStr = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric'
      });

      const sermonId = newSermon.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const tagsArray = newSermon.tags
        ? newSermon.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];
      
      const payload = {
        id: sermonId,
        title: newSermon.title,
        summary: newSermon.summary,
        content: newSermon.content,
        category: newSermon.category,
        coverImage: newSermon.coverImage,
        readTime: newSermon.readTime,
        date: dateStr,
        author: 'AsooYeshua',
        clicks: 0,
        relatedMarketId: newSermon.relatedMarketId || null,
        tags: tagsArray
      };

      try {
        await addDoc(collection(db, 'sermons'), payload);
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.CREATE, 'sermons');
      }
      
      // Reset form and refresh
      setShowAddForm(false);
      setNewSermon({
        title: '',
        summary: '',
        content: '',
        category: 'Grace & Salvation',
        coverImage: '/src/assets/images/asooyeshua_ministry_1_1784026970487.jpg',
        readTime: '5 min read',
        relatedMarketId: '',
        tags: ''
      });
      
      await fetchSermons();
      alert('Sermon published successfully to Firestore!');
    } catch (err) {
      console.error('Error creating sermon:', err);
      alert('Failed to publish sermon. Please try again.');
    }
  };

  const handleDeleteSermon = async (docId: string | undefined, id: string) => {
    if (!confirm('Are you sure you want to delete this sermon?')) return;
    try {
      if (docId) {
        try {
          await deleteDoc(doc(db, 'sermons', docId));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `sermons/${docId}`);
        }
      } else {
        // Fallback search
        let querySnapshot;
        try {
          querySnapshot = await getDocs(collection(db, 'sermons'));
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'sermons');
        }
        if (querySnapshot) {
          const promises: Promise<void>[] = [];
          querySnapshot.forEach((document) => {
            if (document.data().id === id || document.id === id) {
              promises.push(
                deleteDoc(doc(db, 'sermons', document.id)).catch((err) => {
                  handleFirestoreError(err, OperationType.DELETE, `sermons/${document.id}`);
                })
              );
            }
          });
          await Promise.all(promises);
        }
      }
      await fetchSermons();
      if (selectedSermon?.id === id || selectedSermon?.docId === docId) {
        setSelectedSermon(null);
      }
      alert('Sermon deleted successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to delete sermon. Please try again.');
    }
  };

  const handleSaveSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSermonData.title || !editSermonData.content || !editSermonData.summary) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      const tagsArray = editSermonData.tagsString
        ? editSermonData.tagsString.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      const payload = {
        title: editSermonData.title,
        summary: editSermonData.summary,
        content: editSermonData.content,
        category: editSermonData.category,
        coverImage: editSermonData.coverImage,
        readTime: editSermonData.readTime,
        relatedMarketId: editSermonData.relatedMarketId || null,
        tags: tagsArray
      };

      if (editSermonData.docId) {
        try {
          await updateDoc(doc(db, 'sermons', editSermonData.docId), payload);
        } catch (dbErr) {
          handleFirestoreError(dbErr, OperationType.UPDATE, `sermons/${editSermonData.docId}`);
        }
      } else {
        // Fallback search update
        let querySnapshot;
        try {
          querySnapshot = await getDocs(collection(db, 'sermons'));
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'sermons');
        }
        let updated = false;
        if (querySnapshot) {
          const promises: Promise<void>[] = [];
          querySnapshot.forEach((document) => {
            if (document.data().id === editSermonData.id || document.id === editSermonData.id) {
              promises.push(
                updateDoc(doc(db, 'sermons', document.id), payload).catch((err) => {
                  handleFirestoreError(err, OperationType.UPDATE, `sermons/${document.id}`);
                })
              );
              updated = true;
            }
          });
          await Promise.all(promises);
        }
        if (!updated) {
          throw new Error('Sermon document could not be found to update.');
        }
      }

      // Refresh local list
      await fetchSermons();

      // Update the active selected sermon state so details view reflects changes
      const updatedSermon: Sermon = {
        ...selectedSermon!,
        ...payload,
        tags: tagsArray
      };
      setSelectedSermon(updatedSermon);
      setIsEditing(false);
      alert('Sermon updated successfully in Firestore!');
    } catch (err) {
      console.error('Error updating sermon:', err);
      alert('Failed to save sermon. Please try again.');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditMode: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (png, jpg, jpeg, etc.)');
      return;
    }

    // Limit size check (optional but good practice for Firestore base64 string storage to avoid payload issues)
    if (file.size > 1.5 * 1024 * 1024) {
      alert('Please choose an image under 1.5MB to ensure optimal performance.');
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64String = uploadEvent.target?.result as string;
      if (isEditMode) {
        setEditSermonData((prev) => ({ ...prev, coverImage: base64String }));
      } else {
        setNewSermon((prev) => ({ ...prev, coverImage: base64String }));
      }
    };
    reader.onerror = () => {
      alert('Error reading the image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Filter logic
  const filteredSermons = sermons.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                          s.summary.toLowerCase().includes(search.toLowerCase()) || 
                          s.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Search and Headers */}
      <AnimatePresence mode="wait">
        {!selectedSermon ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Blog Heading */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 font-sans">
                  Preachments & Devotionals
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-wide mt-1">
                  Sermon Blog
                </h1>
                <p className="text-stone-500 text-sm mt-1">
                  Read sound biblical messages authored by Tersoo Terence Aker (AsooYeshua).
                </p>
              </div>

              {/* Admin Button */}
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> {showAddForm ? 'Cancel Form' : 'Publish Sermon'}
                    </button>
                    <button
                      onClick={() => setIsAdmin(false)}
                      className="border border-stone-200 text-stone-500 hover:text-stone-800 text-xs px-3 py-2 rounded-lg cursor-pointer font-semibold transition-colors"
                    >
                      Logout Admin
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAdminLogin(!showAdminLogin)}
                    className="border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-50 font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" /> AsooYeshua Creator Access
                  </button>
                )}
              </div>
            </div>

            {/* Admin Login Modal/Drawer */}
            {showAdminLogin && (
              <motion.form
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                onSubmit={handleAdminLogin}
                className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 max-w-md flex flex-col sm:flex-row gap-3 items-end"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold mb-1 uppercase tracking-wide">
                    <Key className="w-3.5 h-3.5" /> Enter Admin Passcode
                  </div>
                  <input
                    type="password"
                    required
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="e.g. Yeshua777"
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all cursor-pointer"
                  >
                    Authorize
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAdminLogin(false); setAdminPass(''); setLoginError(''); }}
                    className="border border-stone-200 hover:bg-stone-50 text-stone-500 text-xs font-semibold px-3 py-2.5 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                {loginError && (
                  <p className="text-red-500 text-xs mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {loginError}
                  </p>
                )}
              </motion.form>
            )}

            {/* Admin Form */}
            {showAddForm && isAdmin && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleAddSermon}
                className="bg-stone-50 border border-stone-200 rounded-2xl p-6 space-y-4"
              >
                <h3 className="font-serif text-xl text-stone-800 font-semibold border-b border-stone-200 pb-2">
                  Draft New Sermon / Blog Post
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                      Sermon Title
                    </label>
                    <input
                      type="text"
                      required
                      value={newSermon.title}
                      onChange={(e) => setNewSermon({ ...newSermon, title: e.target.value })}
                      placeholder="e.g. Living Water for a Thirsty Soul"
                      className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                        Category
                      </label>
                      <select
                        value={newSermon.category}
                        onChange={(e) => setNewSermon({ ...newSermon, category: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                      >
                        <option value="Grace & Salvation">Grace & Salvation</option>
                        <option value="Faith & Walking">Faith & Walking</option>
                        <option value="Gospel Ministry">Gospel Ministry</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                        Reading Time
                      </label>
                      <input
                        type="text"
                        value={newSermon.readTime}
                        onChange={(e) => setNewSermon({ ...newSermon, readTime: e.target.value })}
                        placeholder="e.g. 5 min read"
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block">
                      Cover Image Source
                    </label>
                    <div className="space-y-2">
                      <select
                        value={newSermon.coverImage.startsWith('data:image') ? 'uploaded' : newSermon.coverImage}
                        onChange={(e) => {
                          if (e.target.value !== 'uploaded') {
                            setNewSermon({ ...newSermon, coverImage: e.target.value });
                          }
                        }}
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                      >
                        <option value="/src/assets/images/asooyeshua_ministry_1_1784026970487.jpg">Bible on Wooden Table (Holy Scriptures)</option>
                        <option value="/src/assets/images/asooyeshua_portrait_1_1784026936123.jpg">AsooYeshua Studio Portrait (Charismatic)</option>
                        <option value="/src/assets/images/asooyeshua_portrait_2_1784026952199.jpg">AsooYeshua Outdoor Portrait (Radiant)</option>
                        <option value="/src/assets/images/cross_on_hill_1784165487177.jpg">Cross on Hill (Faith Landscape)</option>
                        <option value="/src/assets/images/faith_path_1784165500493.jpg">Faith Path (Spiritual Journey)</option>
                        <option value="/src/assets/images/open_bible_1784165511489.jpg">Open Bible (Scripture Reflection)</option>
                        {newSermon.coverImage.startsWith('data:image') && (
                          <option value="uploaded">Uploaded Custom Image</option>
                        )}
                      </select>

                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-stone-300 rounded-lg px-2 py-1.5 bg-stone-50 hover:bg-stone-100 cursor-pointer transition-colors text-[11px] text-stone-600 font-semibold uppercase tracking-wider">
                          <Upload className="w-3.5 h-3.5 text-amber-600" />
                          <span>Upload From Library</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, false)}
                            className="hidden"
                          />
                        </label>

                        <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-stone-300 rounded-lg px-2 py-1.5 bg-stone-50 hover:bg-stone-100 cursor-pointer transition-colors text-[11px] text-stone-600 font-semibold uppercase tracking-wider">
                          <Camera className="w-3.5 h-3.5 text-amber-600" />
                          <span>Take Picture (Camera)</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handleImageUpload(e, false)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {newSermon.coverImage && (
                        <div className="mt-2 flex items-center gap-2 p-1.5 bg-stone-100 rounded-lg border border-stone-200">
                          <img
                            src={newSermon.coverImage}
                            alt="Preview"
                            className="w-12 h-12 object-cover rounded-md border border-stone-300"
                          />
                          <div className="text-[10px] text-stone-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">
                            {newSermon.coverImage.startsWith('data:image') ? 'Uploaded Base64 Image' : 'Preset image selected'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                      Related Marketplace Resource Link
                    </label>
                    <select
                      value={newSermon.relatedMarketId}
                      onChange={(e) => setNewSermon({ ...newSermon, relatedMarketId: e.target.value })}
                      className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                    >
                      <option value="">None (No Monetization Link)</option>
                      <option value="foundations-of-faith">The Foundations of Faith: Gospel Guidebook</option>
                      <option value="sermons-of-grace-audio">Promoting the Gospel: Sermons of Grace (Audio)</option>
                      <option value="daily-grace-devotional">Daily Grace: 365 Devotional Calendar</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                    Sermon Short Summary
                  </label>
                  <input
                    type="text"
                    required
                    value={newSermon.summary}
                    onChange={(e) => setNewSermon({ ...newSermon, summary: e.target.value })}
                    placeholder="Provide a captivating 1-2 sentence hook for the list preview..."
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newSermon.tags}
                    onChange={(e) => setNewSermon({ ...newSermon, tags: e.target.value })}
                    placeholder="e.g. Grace, Salvation, Faith, BibleStudy"
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1">
                    Sermon Rich Content (Markdown/Markdown supported) <span title="Use standard headers (#), bold (**), or quotes."><HelpCircle className="w-3.5 h-3.5 text-stone-400" /></span>
                  </label>
                  <textarea
                    required
                    rows={12}
                    value={newSermon.content}
                    onChange={(e) => setNewSermon({ ...newSermon, content: e.target.value })}
                    placeholder="Draft your powerful message or study notes here. You can use markdown styling like headers (###), lists, or quotes."
                    className="w-full bg-white border border-stone-200 rounded-lg p-3 text-sm focus:outline-hidden focus:border-amber-500 font-mono resize-y"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs tracking-wider uppercase px-6 py-3 rounded-xl cursor-pointer shadow-sm transition-all"
                  >
                    Publish to Website
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="border border-stone-200 hover:bg-stone-50 text-stone-500 font-semibold text-xs uppercase px-4 py-3 rounded-xl cursor-pointer"
                  >
                    Discard Draft
                  </button>
                </div>
              </motion.form>
            )}

            {/* Free Ministry Resources Panel */}
            <div className="bg-stone-50 border border-stone-150 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200/50 px-2.5 py-1 rounded-md">
                    🎁 Free Resources
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl text-stone-900 font-bold mt-2.5">
                    Free Spiritual Library & Companion Guides
                  </h2>
                  <p className="text-stone-500 text-xs sm:text-sm mt-1">
                    Equip your spiritual walk. We have removed all prices on our sound theological books and audio collections to make them completely free.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {FREE_RESOURCES.map((resource) => (
                  <div key={resource.id} className="bg-white border border-stone-150 rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between group">
                    <div>
                      <div className="h-40 w-full overflow-hidden relative">
                        <img
                          src={resource.coverImage}
                          alt={resource.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-amber-400 uppercase tracking-widest border border-white/10">
                          {resource.type}
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <h3 className="font-serif text-sm font-bold text-stone-900 line-clamp-1 group-hover:text-amber-700 transition-colors">
                          {resource.title}
                        </h3>
                        <p className="text-stone-500 text-[11px] line-clamp-2 leading-relaxed">
                          {resource.description}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 pt-0">
                      <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 mb-3 border-t border-stone-50 pt-3">
                        <span>Size: {resource.fileSize}</span>
                        <span>Format: {resource.type === 'Audio Series' ? 'ZIP (MP3)' : 'PDF'}</span>
                      </div>
                      <button
                        onClick={() => window.open(resource.downloadLink, '_blank')}
                        className="w-full bg-stone-900 hover:bg-stone-850 text-white font-bold text-[11px] tracking-widest uppercase py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Free
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer border ${
                      selectedCategory === cat
                        ? 'bg-amber-500/10 border-amber-500/45 text-amber-700'
                        : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4.5 h-4.5" />
                <input
                  type="text"
                  placeholder="Search sermon scriptures, topics..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-stone-400 text-stone-850 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            {/* Grid list of sermons */}
            {isLoading ? (
              <div className="py-20 text-center text-stone-400">
                <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="font-medium text-sm">Gathering Bible messages...</p>
              </div>
            ) : filteredSermons.length === 0 ? (
              <div className="py-20 text-center border border-stone-150 rounded-3xl bg-stone-50">
                <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="font-serif text-lg text-stone-700 font-semibold">No sermons found</h3>
                <p className="text-stone-400 text-xs mt-1">Try another keyword or category filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSermons.map((sermon, index) => (
                  <motion.article
                    key={sermon.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-stone-150 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group relative"
                  >
                    {/* Cover image */}
                    <div className="h-48 w-full overflow-hidden relative">
                      <img
                        src={sermon.coverImage}
                        alt={sermon.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-amber-400 uppercase tracking-widest border border-white/10">
                        {sermon.category}
                      </div>

                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSermon(sermon.docId, sermon.id);
                          }}
                          className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg text-xs font-bold uppercase transition-all shadow-md"
                          title="Delete Sermon"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3 text-stone-400 text-[11px] font-semibold tracking-wider uppercase font-sans">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" /> {sermon.date}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-stone-400" /> {sermon.readTime}
                          </span>
                        </div>

                        <h3 className="font-serif text-lg text-stone-900 font-semibold group-hover:text-amber-700 transition-colors leading-snug">
                          {sermon.title}
                        </h3>

                        <p className="text-stone-500 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                          {sermon.summary}
                        </p>

                        {/* Tags list if any */}
                        {sermon.tags && sermon.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {sermon.tags.map((tag) => (
                              <span
                                key={tag}
                                className="bg-stone-100 text-stone-600 text-[10px] px-2 py-0.5 rounded-md font-medium"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-5 border-t border-stone-50 mt-5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center font-bold text-[11px] text-amber-700 font-serif">
                            AY
                          </div>
                          <span className="text-xs font-bold text-stone-700">AsooYeshua</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              window.scrollTo({ top: 400, behavior: 'smooth' });
                              setSelectedSermon(sermon);
                              setEditSermonData({
                                docId: sermon.docId || '',
                                id: sermon.id,
                                title: sermon.title,
                                summary: sermon.summary,
                                content: sermon.content,
                                category: sermon.category,
                                coverImage: sermon.coverImage,
                                readTime: sermon.readTime,
                                relatedMarketId: sermon.relatedMarketId || '',
                                tagsString: sermon.tags ? sermon.tags.join(', ') : ''
                              });
                              setIsEditing(true);
                            }}
                            className="text-stone-500 hover:text-stone-850 text-xs font-bold flex items-center gap-1 tracking-wider uppercase cursor-pointer border border-stone-200 hover:border-stone-400 px-2.5 py-1 rounded-lg transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              window.scrollTo({ top: 400, behavior: 'smooth' });
                              setSelectedSermon(sermon);
                              setIsEditing(false);
                            }}
                            className="text-amber-600 hover:text-amber-700 text-xs font-bold flex items-center gap-1 tracking-wider uppercase cursor-pointer"
                          >
                            Read <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* Sermon Detailed Page */
          <motion.div
            key="detail"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Top Navigation & Edit buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                onClick={() => {
                  setSelectedSermon(null);
                  setIsEditing(false);
                }}
                className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-950 font-bold text-xs tracking-wider uppercase cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sermons
              </button>

              {isAdmin && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => {
                      if (isEditing) {
                        setIsEditing(false);
                      } else {
                        setEditSermonData({
                          docId: selectedSermon.docId || '',
                          id: selectedSermon.id,
                          title: selectedSermon.title,
                          summary: selectedSermon.summary,
                          content: selectedSermon.content,
                          category: selectedSermon.category,
                          coverImage: selectedSermon.coverImage,
                          readTime: selectedSermon.readTime,
                          relatedMarketId: selectedSermon.relatedMarketId || '',
                          tagsString: selectedSermon.tags ? selectedSermon.tags.join(', ') : ''
                        });
                        setIsEditing(true);
                      }
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs uppercase px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isEditing ? 'Cancel Editing' : 'Edit Sermon'}
                  </button>
                  <button
                    onClick={() => handleDeleteSermon(selectedSermon.docId, selectedSermon.id)}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs uppercase px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    Delete Sermon
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSaveSermon}
                className="bg-stone-50 border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-6"
              >
                <div>
                  <h2 className="font-serif text-2xl text-stone-900 font-bold">
                    Edit Sermon Post
                  </h2>
                  <p className="text-stone-500 text-xs sm:text-sm mt-1">
                    Modify this sermon's metadata, markdown text body, images, and tags.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                      Sermon Title
                    </label>
                    <input
                      type="text"
                      required
                      value={editSermonData.title}
                      onChange={(e) => setEditSermonData({ ...editSermonData, title: e.target.value })}
                      className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                        Category
                      </label>
                      <select
                        value={editSermonData.category}
                        onChange={(e) => setEditSermonData({ ...editSermonData, category: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                      >
                        <option value="Grace & Salvation">Grace & Salvation</option>
                        <option value="Faith & Walking">Faith & Walking</option>
                        <option value="Gospel Ministry">Gospel Ministry</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                        Reading Time
                      </label>
                      <input
                        type="text"
                        value={editSermonData.readTime}
                        onChange={(e) => setEditSermonData({ ...editSermonData, readTime: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block">
                      Cover Image Source
                    </label>
                    <div className="space-y-2">
                      <select
                        value={editSermonData.coverImage.startsWith('data:image') ? 'uploaded' : editSermonData.coverImage}
                        onChange={(e) => {
                          if (e.target.value !== 'uploaded') {
                            setEditSermonData({ ...editSermonData, coverImage: e.target.value });
                          }
                        }}
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                      >
                        <option value="/src/assets/images/asooyeshua_ministry_1_1784026970487.jpg">Bible on Wooden Table (Holy Scriptures)</option>
                        <option value="/src/assets/images/asooyeshua_portrait_1_1784026936123.jpg">AsooYeshua Studio Portrait (Charismatic)</option>
                        <option value="/src/assets/images/asooyeshua_portrait_2_1784026952199.jpg">AsooYeshua Outdoor Portrait (Radiant)</option>
                        <option value="/src/assets/images/cross_on_hill_1784165487177.jpg">Cross on Hill (Faith Landscape)</option>
                        <option value="/src/assets/images/faith_path_1784165500493.jpg">Faith Path (Spiritual Journey)</option>
                        <option value="/src/assets/images/open_bible_1784165511489.jpg">Open Bible (Scripture Reflection)</option>
                        {editSermonData.coverImage.startsWith('data:image') && (
                          <option value="uploaded">Uploaded Custom Image</option>
                        )}
                      </select>

                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-stone-300 rounded-lg px-2 py-1.5 bg-stone-50 hover:bg-stone-100 cursor-pointer transition-colors text-[11px] text-stone-600 font-semibold uppercase tracking-wider">
                          <Upload className="w-3.5 h-3.5 text-amber-600" />
                          <span>Upload From Library</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, true)}
                            className="hidden"
                          />
                        </label>

                        <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-stone-300 rounded-lg px-2 py-1.5 bg-stone-50 hover:bg-stone-100 cursor-pointer transition-colors text-[11px] text-stone-600 font-semibold uppercase tracking-wider">
                          <Camera className="w-3.5 h-3.5 text-amber-600" />
                          <span>Take Picture (Camera)</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handleImageUpload(e, true)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <input
                        type="text"
                        placeholder="Or paste custom cover image URL..."
                        value={editSermonData.coverImage}
                        onChange={(e) => setEditSermonData({ ...editSermonData, coverImage: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                      />

                      {editSermonData.coverImage && (
                        <div className="mt-2 flex items-center gap-2 p-1.5 bg-stone-100 rounded-lg border border-stone-200">
                          <img
                            src={editSermonData.coverImage}
                            alt="Preview"
                            className="w-12 h-12 object-cover rounded-md border border-stone-300"
                          />
                          <div className="text-[10px] text-stone-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">
                            {editSermonData.coverImage.startsWith('data:image') ? 'Uploaded Base64 Image' : 'Preset/custom image URL'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                      Related Marketplace Resource Link
                    </label>
                    <select
                      value={editSermonData.relatedMarketId}
                      onChange={(e) => setEditSermonData({ ...editSermonData, relatedMarketId: e.target.value })}
                      className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                    >
                      <option value="">None (No Monetization Link)</option>
                      <option value="foundations-of-faith">The Foundations of Faith: Gospel Guidebook</option>
                      <option value="sermons-of-grace-audio">Promoting the Gospel: Sermons of Grace (Audio)</option>
                      <option value="daily-grace-devotional">Daily Grace: 365 Devotional Calendar</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editSermonData.tagsString}
                    onChange={(e) => setEditSermonData({ ...editSermonData, tagsString: e.target.value })}
                    placeholder="e.g. Grace, Salvation, Faith, BibleStudy"
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                    Sermon Short Summary
                  </label>
                  <input
                    type="text"
                    required
                    value={editSermonData.summary}
                    onChange={(e) => setEditSermonData({ ...editSermonData, summary: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                    Sermon Markdown Body Content
                  </label>
                  <textarea
                    required
                    rows={15}
                    value={editSermonData.content}
                    onChange={(e) => setEditSermonData({ ...editSermonData, content: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-lg p-3 text-sm focus:outline-hidden focus:border-amber-500 font-mono resize-y"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs tracking-wider uppercase px-6 py-3 rounded-xl cursor-pointer shadow-sm transition-all"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="border border-stone-200 hover:bg-stone-50 text-stone-500 font-semibold text-xs uppercase px-4 py-3 rounded-xl cursor-pointer"
                  >
                    Discard Changes
                  </button>
                </div>
              </motion.form>
            ) : (
              <>
                {/* Cover image & Title */}
                <div className="space-y-6">
                  <div className="h-[280px] sm:h-[380px] w-full rounded-2xl overflow-hidden relative border border-stone-150 shadow-md">
                    <img
                      src={selectedSermon.coverImage}
                      alt={selectedSermon.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-amber-500 text-stone-950 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-amber-400">
                          {selectedSermon.category}
                        </span>
                        {selectedSermon.tags && selectedSermon.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-white/20 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-md border border-white/10"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white font-medium tracking-wide mt-3 leading-snug">
                        {selectedSermon.title}
                      </h1>
                    </div>
                  </div>

                  {/* Author Meta Info */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-5 text-stone-500 text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-amber-600" />
                        <span>Preached by: <strong className="text-stone-800">AsooYeshua</strong></span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{selectedSermon.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-amber-700">
                      <Clock className="w-4 h-4" />
                      <span>{selectedSermon.readTime}</span>
                    </div>
                  </div>

                  {/* Social Sharing Panel */}
                  {(() => {
                    const shareUrl = typeof window !== 'undefined'
                      ? `${window.location.origin}${window.location.pathname}#sermon=${selectedSermon.id}`
                      : '';
                    const shareText = `Read this inspiring sermon: "${selectedSermon.title}" by AsooYeshua`;
                    
                    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
                    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

                    return (
                      <div className="bg-stone-50 border border-stone-150 rounded-2xl p-4 sm:px-6 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-700 shrink-0">
                            <Share2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-serif text-xs sm:text-sm font-bold text-stone-900 leading-tight">
                              Share this Preachment
                            </h4>
                            <p className="text-[10px] text-stone-500 font-sans uppercase tracking-wider mt-0.5">
                              Spread the Gospel message with friends and group study
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* WhatsApp */}
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3 py-2 text-xs font-bold tracking-wide flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                            title="Share on WhatsApp"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.413 9.863-9.832.001-2.625-1.019-5.093-2.872-6.949C16.608 1.966 14.145 1.012 11.52 1.01c-5.442 0-9.864 4.414-9.867 9.835-.001 1.73.453 3.42 1.314 4.915l-.97 3.548 3.634-.954zm12.384-5.32c-.318-.159-1.885-.931-2.177-1.037-.294-.106-.507-.159-.721.159-.214.318-.828 1.037-1.014 1.249-.187.213-.374.24-.693.08-1.745-.873-2.91-1.5-4.068-3.486-.305-.523.305-.486.874-1.619.094-.187.047-.35-.024-.51-.07-.159-.721-1.74-1.014-2.45-.286-.69-.577-.597-.789-.608-.204-.01-.438-.012-.673-.012-.234 0-.616.088-.936.438-.32.35-1.223 1.196-1.223 2.91 0 1.714 1.249 3.37 1.422 3.6.173.23 2.458 3.754 5.956 5.263.833.359 1.482.573 1.988.734.838.266 1.6.228 2.202.138.672-.1 1.885-.77 2.152-1.474.267-.704.267-1.309.187-1.437-.08-.128-.294-.213-.613-.373z"/>
                            </svg>
                            <span className="hidden sm:inline font-sans">WhatsApp</span>
                          </a>

                          {/* Facebook */}
                          <a
                            href={facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl px-3 py-2 text-xs font-bold tracking-wide flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                            title="Share on Facebook"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            <span className="hidden sm:inline font-sans">Facebook</span>
                          </a>

                          {/* Twitter/X */}
                          <a
                            href={twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-stone-900 hover:bg-stone-950 text-white rounded-xl px-3 py-2 text-xs font-bold tracking-wide flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98 border border-stone-800"
                            title="Share on Twitter"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            <span className="hidden sm:inline font-sans">Twitter</span>
                          </a>

                          {/* Copy Link */}
                          <button
                            onClick={() => handleCopySermonLink(selectedSermon.id)}
                            className="bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl px-3 py-2 text-xs font-bold tracking-wide flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                            title="Copy Link"
                          >
                            {copiedShare ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-sans">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-stone-500" />
                                <span className="font-sans">Copy Link</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Detailed Body Sermon content */}
                <div className="prose max-w-none text-stone-800 leading-relaxed space-y-6 text-sm sm:text-base font-sans antialiased">
                  <Markdown>{selectedSermon.content}</Markdown>
                </div>
              </>
            )}

            {/* FREE COMPANION STUDY RESOURCE BRIDGE */}
            {selectedSermon.relatedMarketId && (
              (() => {
                const companion = FREE_RESOURCES.find(r => r.id === selectedSermon.relatedMarketId);
                if (!companion) return null;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-stone-50 border border-stone-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center justify-between shadow-md mt-12"
                  >
                    <div className="space-y-2 text-center sm:text-left">
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-750">
                        <Download className="w-3.5 h-3.5 text-amber-600" /> Free Spiritual Companion Study
                      </div>
                      <h3 className="font-serif text-lg sm:text-xl text-stone-900 font-semibold leading-snug">
                        Download "{companion.title}" for Free!
                      </h3>
                      <p className="text-stone-500 text-xs sm:text-sm max-w-xl leading-relaxed">
                        {companion.description}
                      </p>
                      <span className="inline-block text-[10px] font-mono bg-stone-100 text-stone-500 px-2.5 py-1 rounded-md font-bold uppercase">
                        File Size: {companion.fileSize} • Format: {companion.type === 'Audio Series' ? 'ZIP (MP3)' : 'PDF'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        window.open(companion.downloadLink, '_blank');
                      }}
                      className="bg-stone-900 hover:bg-stone-850 text-white font-bold text-xs tracking-widest uppercase px-6 py-3 rounded-xl shadow-md cursor-pointer shrink-0 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download Free
                    </button>
                  </motion.div>
                );
              })()
            )}

            {/* Bottom Navigation */}
            <div className="flex items-center justify-between border-t border-stone-100 pt-6 mt-12">
              <button
                onClick={() => {
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                  setSelectedSermon(null);
                }}
                className="text-stone-500 hover:text-stone-900 font-semibold text-xs uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> All sermons
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
