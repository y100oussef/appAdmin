
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, getDoc, Firestore } from "firebase/firestore";
import { getDatabase, Database } from "firebase/database";

// Default Firebase configuration
let firebaseConfig = {
  apiKey: "AIzaSyCzKIhGKtwGeJBANu-5dKWe1f7Rb3p8CaE",
  authDomain: "anghamy-c447b.firebaseapp.com",
  databaseURL: "https://anghamy-c447b-default-rtdb.firebaseio.com",
  projectId: "anghamy-c447b",
  storageBucket: "anghamy-c447b.firebasestorage.app",
  messagingSenderId: "787761857104",
  appId: "1:787761857104:web:5af8ca7b9f4a7aea11c755",
  measurementId: "G-YB0M3XRW59"
};

// Try to load config from localStorage if available
try {
  const savedConfig = localStorage.getItem("firebaseConfig");
  if (savedConfig) {
    const parsedConfig = JSON.parse(savedConfig);
    if (parsedConfig.apiKey && parsedConfig.projectId) {
      console.log("Using Firebase config from localStorage");
      firebaseConfig = { ...firebaseConfig, ...parsedConfig };
    }
  }
} catch (error) {
  console.error("Error loading Firebase config from localStorage:", error);
}

// Initialize Firebase
console.log("Initializing Firebase with config:", { 
  projectId: firebaseConfig.projectId,
  databaseURL: firebaseConfig.databaseURL
});

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let rtdb: Database;

// Initialize Firebase with the current config
const initializeFirebase = () => {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  rtdb = getDatabase(app);
};

// Initial initialization
initializeFirebase();

// Function to update Firebase configuration
export const updateFirebaseConfig = async (newConfig: Partial<typeof firebaseConfig>) => {
  // Update the config
  firebaseConfig = { ...firebaseConfig, ...newConfig };
  
  // Save to localStorage
  localStorage.setItem("firebaseConfig", JSON.stringify(firebaseConfig));
  
  console.log("Updating Firebase with new config:", { 
    projectId: firebaseConfig.projectId,
    databaseURL: firebaseConfig.databaseURL
  });
  
  // Reinitialize Firebase with the new config
  try {
    // Re-initialize Firebase
    initializeFirebase();
    
    // Test connection by trying to get a document
    const testRef = doc(db, "singsList", "test");
    await getDoc(testRef);
    
    return Promise.resolve();
  } catch (error) {
    console.error("Error reinitializing Firebase:", error);
    return Promise.reject(error);
  }
};

// Function to inspect Firestore collections
export const inspectFirestore = async () => {
  console.log("--- FIRESTORE INSPECTION START ---");
  try {
    // Get all collections
    const singsList = collection(db, "singsList");
    const songsList = collection(db, "songsList");
    const users = collection(db, "users");
    const wallpapers = collection(db, "wallpapers");
    const wallpaper = collection(db, "wallpaper");
    
    // Try to list all collections (note: listCollections is not available in the web SDK)
    console.log("Cannot list all collections in browser environment");
    
    // Check singsList collection (corrected collection name)
    console.log("Checking singsList collection...");
    const singsSnapshot = await getDocs(singsList);
    console.log(`singsList collection exists: ${!singsSnapshot.empty}`);
    console.log(`singsList documents count: ${singsSnapshot.size}`);
    
    if (singsSnapshot.size > 0) {
      console.log("Sample song document from singsList:");
      const sampleDoc = singsSnapshot.docs[0].data();
      console.log(sampleDoc);
      
      // Get all document IDs in the collection
      console.log("Document IDs in singsList:");
      singsSnapshot.docs.forEach(doc => {
        console.log(`- ${doc.id}`);
      });
    }
    
    // Also check songsList collection
    console.log("Checking songsList collection...");
    const songsSnapshot = await getDocs(songsList);
    console.log(`songsList collection exists: ${!songsSnapshot.empty}`);
    console.log(`songsList documents count: ${songsSnapshot.size}`);
    
    if (songsSnapshot.size > 0) {
      console.log("Sample song document from songsList:");
      const sampleDoc = songsSnapshot.docs[0].data();
      console.log(sampleDoc);
    }
    
    // Check users collection
    console.log("Checking users collection...");
    const usersSnapshot = await getDocs(users);
    console.log(`users collection exists: ${!usersSnapshot.empty}`);
    console.log(`users documents count: ${usersSnapshot.size}`);
    
    if (usersSnapshot.size > 0) {
      console.log("Sample user document:");
      const sampleDoc = usersSnapshot.docs[0].data();
      console.log(sampleDoc);
    }
    
    // Check wallpapers collections
    console.log("Checking wallpapers collection (plural)...");
    const wallpapersSnapshot = await getDocs(wallpapers);
    console.log(`wallpapers collection exists: ${!wallpapersSnapshot.empty}`);
    console.log(`wallpapers documents count: ${wallpapersSnapshot.size}`);
    
    console.log("Checking wallpaper collection (singular)...");
    const wallpaperSnapshot = await getDocs(wallpaper);
    console.log(`wallpaper collection exists: ${!wallpaperSnapshot.empty}`);
    console.log(`wallpaper documents count: ${wallpaperSnapshot.size}`);
    
    // Try case variations
    try {
      const wallpapersUpper = collection(db, "Wallpapers");
      const wallpapersUpperSnapshot = await getDocs(wallpapersUpper);
      console.log(`Wallpapers (uppercase) collection exists: ${!wallpapersUpperSnapshot.empty}`);
      console.log(`Wallpapers (uppercase) documents count: ${wallpapersUpperSnapshot.size}`);
    } catch (error) {
      console.log("Error checking Wallpapers (uppercase):", error);
    }
    
    try {
      const wallpaperUpper = collection(db, "Wallpaper");
      const wallpaperUpperSnapshot = await getDocs(wallpaperUpper);
      console.log(`Wallpaper (uppercase) collection exists: ${!wallpaperUpperSnapshot.empty}`);
      console.log(`Wallpaper (uppercase) documents count: ${wallpaperUpperSnapshot.size}`);
    } catch (error) {
      console.log("Error checking Wallpaper (uppercase):", error);
    }
    
    // Log specific document
    try {
      const specificDocRef = doc(db, "singsList", "5Uoq8E1tYk8RREToE8vh");
      const specificDoc = await getDoc(specificDocRef);
      console.log("Specific document exists:", specificDoc.exists());
      if (specificDoc.exists()) {
        console.log("Specific document data:", specificDoc.data());
      }
    } catch (error) {
      console.error("Error fetching specific document:", error);
    }
    
  } catch (error) {
    console.error("Error during Firestore inspection:", error);
  }
  console.log("--- FIRESTORE INSPECTION END ---");
};

// Run inspection on initialization (will execute when this module is imported)
setTimeout(inspectFirestore, 2000);

export { auth, db, rtdb };
