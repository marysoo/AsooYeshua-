import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Helper to seed Firestore if empty
export async function seedDatabaseIfEmpty() {
  try {
    const sermonsRef = collection(db, 'sermons');
    const sermonsSnap = await getDocs(sermonsRef);
    
    if (sermonsSnap.empty) {
      console.log('Seeding initial sermons to Firestore...');
      const initialSermons = [
        {
          id: 'power-of-the-cross',
          title: 'The Power of the Cross: Restoring Our Relationship with God',
          summary: 'A deep examination of the divine transaction on Calvary, exploring grace, justification, and the ultimate restoration of humanity through Jesus Christ.',
          content: `### Introduction: The Central Pivot of History
The cross of Jesus Christ is not merely a historical event; it is the central pivot of all human history and eternity. Through it, the holy justice of God and His infinite love met in a perfect, divine transaction. In this sermon, we explore how the cross of Christ restores our broken relationship with God.

### 1. The Reality of the Chasm
Before we can appreciate the power of restoration, we must understand the depth of our separation. Scripture tells us in *Romans 3:23* that "all have sinned and fall short of the glory of God." This sin created an impassable chasm—one that no amount of human effort, good works, or religious observation could bridge.
* Good works are like trying to build a bridge of sand across an ocean.
* Only a perfect mediator could reconcile a holy Creator and a fallen creation.

### 2. The Divine Substitution
On Calvary, Jesus Christ took our place. *2 Corinthians 5:21* states: "He made Him who knew no sin to be sin for us, that we might become the righteousness of God in Him." 
This is the beautiful doctrine of **substitutionary atonement**:
* Jesus took our guilt, our shame, and our punishment.
* In return, He gave us His righteousness, His inheritance, and His peace.

### 3. Living in the Reality of Restoration
What does it mean for us today? It means we no longer walk under condemnation. *Romans 8:1* declares, "There is therefore now no condemnation to those who are in Christ Jesus." 
We are invited to:
1. **Boldly approach the throne of grace** (Hebrews 4:16).
2. **Promote the message of reconciliation** to a hurting world.
3. **Walk in newness of life**, empowered by the Holy Spirit.

### Conclusion and Altar Call
If you have been wandering in separation, know that the bridge has been built. The cross still stands, and Jesus is calling. Accept His free gift of grace today and be restored.

*Chaired by Tersoo Terence Aker (AsooYeshua)*`,
          category: 'Grace & Salvation',
          coverImage: '/src/assets/images/asooyeshua_ministry_1_1784026970487.jpg',
          readTime: '5 min read',
          date: 'July 12, 2026',
          author: 'AsooYeshua',
          clicks: 24,
          relatedMarketId: 'foundations-of-faith'
        },
        {
          id: 'walking-by-faith',
          title: 'Walking by Faith and Not by Sight in a Modern World',
          summary: 'Discover how to anchor your soul in the unshakeable promises of God when surrounded by a culture of uncertainty and material distractions.',
          content: `### Understanding Biblical Faith
In a world governed by what we can see, touch, and measure, walking by faith is a revolutionary act. In *2 Corinthians 5:7*, the Apostle Paul writes, "For we walk by faith, not by sight."

### 1. The Deception of Sight
What we see is temporary. The market rises and falls, human institutions crumble, and physical strength fades. When we base our security on what we see, we live in constant anxiety. 
* Sight says: "Trust only what you can control."
* Faith says: "Trust the One who controls all things."

### 2. The Unshakeable Anchor
Hebrews 11:1 defines faith as "the substance of things hoped for, the evidence of things not seen." It is not blind optimism; it is complete trust in the character and promises of God. 
To walk by faith means:
* Keeping your eyes on Jesus amidst the storm (like Peter on the water).
* Resting in God's promises even when your circumstances seem to contradict them.

### 3. Practical Steps for Daily Faith
How do we walk this out in our modern, busy lives?
1. **Feed on the Word**: Faith comes by hearing, and hearing by the Word of God (Romans 10:17).
2. **Active Prayer**: Keep a dialogue open with God. Talk to Him about your anxieties and let Him remind you of His faithfulness.
3. **Step Out in Obedience**: Faith without works is dead. When God prompts you to help someone, preach the gospel, or take a leap, do it immediately.

### A Message from AsooYeshua
Let us hold fast to our confession. Let us walk boldly, knowing that He who promised is faithful. Keep your faith active, and promote the gospel everywhere you go.`,
          category: 'Faith & Walking',
          coverImage: '/src/assets/images/asooyeshua_portrait_2_1784026952199.jpg',
          readTime: '7 min read',
          date: 'July 10, 2026',
          author: 'AsooYeshua',
          clicks: 18,
          relatedMarketId: 'daily-grace-devotional'
        },
        {
          id: 'understanding-prophetic-call',
          title: 'Understanding the Call: Promoting the Gospel Everywhere',
          summary: 'Tersoo Terence Aker (AsooYeshua) shares his personal testimony, ministry mission, and a clarion call for every believer to actively participate in the Great Commission.',
          content: `### The Call to the Harvest
The harvest is truly plentiful, but the laborers are few. In this message, I share the core mission of AsooYeshua Ministry: to aggressively promote the unadulterated gospel of Jesus Christ.

### 1. My Testimony: From Seeking to Found
Every call begins with a personal encounter. I, Tersoo Terence Aker, was reached by the grace of God when I was lost in my own ambitions. When Jesus revealed Himself to me, He did not just save me; He commissioned me to be a voice of His gospel—hence, **AsooYeshua** (which carries the spirit of promoting the Savior).

### 2. The Great Commission is Not Optional
In *Matthew 28:19-20*, Jesus did not give a recommendation; He gave a command: "Go therefore and make disciples of all the nations..."
* We must promote the gospel through every medium: online, offline, through blogging, media, books, and marketplace tools.
* The gospel is free, but spreading the gospel requires active resources, dedication, and high-quality, professional platforms.

### 3. How You Can Partner with Us
You are not a passive spectator in God's plan. You are called to:
1. **Preach the Gospel**: In your family, workplace, and social media (TikTok, Facebook, YouTube @AsooYeshua).
2. **Support Spiritual Materials**: Acquire gospel books and audio recordings to equip yourself.
3. **Pray for the Harvest**: Pray for doors of utterance to be opened for us as we take this message worldwide.

### Closing Prayer
Father, ignite a fire in our hearts for the lost. Let us run with the vision of AsooYeshua, promoting Christ until He returns. Amen.`,
          category: 'Gospel Ministry',
          coverImage: '/src/assets/images/asooyeshua_portrait_1_1784026936123.jpg',
          readTime: '8 min read',
          date: 'July 08, 2026',
          author: 'AsooYeshua',
          clicks: 35,
          relatedMarketId: 'sermons-of-grace-audio'
        }
      ];

      for (const sermon of initialSermons) {
        await setDoc(doc(db, 'sermons', sermon.id), sermon);
      }
    }

    const marketRef = collection(db, 'marketplace');
    const marketSnap = await getDocs(marketRef);

    if (marketSnap.empty) {
      console.log('Seeding initial marketplace items to Firestore...');
      const initialProducts = [
        {
          id: 'foundations-of-faith',
          title: 'The Foundations of Faith: Gospel Guidebook',
          description: 'An inspiring digital eBook detailing the foundational truths of the gospel of Jesus Christ, written by Tersoo Terence Aker. Equips you to understand and share the word of God effectively.',
          price: 2500, // NGN
          type: 'eBook',
          downloadLink: 'https://asooyeshua.org/ebooks/foundations-of-faith.pdf',
          coverImage: '/src/assets/images/asooyeshua_ministry_1_1784026970487.jpg',
          relatedSermonId: 'power-of-the-cross',
          purchases: 12
        },
        {
          id: 'sermons-of-grace-audio',
          title: 'Promoting the Gospel: Sermons of Grace (Audio Series)',
          description: 'A premium, high-quality audio collection of 5 powerful MP3 sermon recordings on Grace, Salvation, and Faith preached live by AsooYeshua (Tersoo Terence Aker).',
          price: 4500, // NGN
          type: 'Audio Series',
          downloadLink: 'https://asooyeshua.org/audio/sermons-of-grace.zip',
          coverImage: '/src/assets/images/asooyeshua_portrait_1_1784026936123.jpg',
          relatedSermonId: 'understanding-prophetic-call',
          purchases: 8
        },
        {
          id: 'daily-grace-devotional',
          title: 'Daily Grace: 365 Devotional Calendar',
          description: 'A beautiful annual digital devotional booklet featuring daily scriptures, prayers, and deep theological reflections by AsooYeshua to fuel your morning quiet time.',
          price: 3000, // NGN
          type: 'Devotional',
          downloadLink: 'https://asooyeshua.org/ebooks/daily-grace.pdf',
          coverImage: '/src/assets/images/asooyeshua_portrait_2_1784026952199.jpg',
          relatedSermonId: 'walking-by-faith',
          purchases: 15
        }
      ];

      for (const product of initialProducts) {
        await setDoc(doc(db, 'marketplace', product.id), product);
      }
    }
  } catch (error) {
    console.error('Error seeding Firestore database:', error);
  }
}
