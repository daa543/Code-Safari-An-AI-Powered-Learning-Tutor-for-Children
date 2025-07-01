// Progress Tracker for Code Safari - Fixed Version
// This file handles updating student progress in the database

// Prevent multiple initializations
if (typeof window.CodeSafariProgressTracker === 'undefined') {
    window.CodeSafariProgressTracker = {};

    var firebaseConfig = {
        apiKey: "AIzaSyBLtbwrVgpjYZp0HBNu-qLkr8D4ON3_B1s",
        authDomain: "code-safari.firebaseapp.com",
        projectId: "code-safari",
        storageBucket: "code-safari.firebasestorage.app",
        messagingSenderId: "167734114377",
        appId: "1:167734114377:web:660577af30fb9b289ca798"
    };

    // Initialize Firebase only if not already initialized
    if (!firebase.apps?.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Use different variable names or check if already declared
    const progressDB = firebase.firestore();

    // Set debug logging
    firebase.firestore.setLogLevel('debug');

    // Auth state listener
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("User is logged in:", user.uid);
            // Check if user exists, fetch data, or create new document
            checkAndSetupUser();
        } else {
            console.log("No user logged in.");
        }
    });

    // Check if user exists, fetch existing data, or create new document for new users
    async function checkAndSetupUser() {
        console.log("🔍 Checking user document...");
        
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error("No authenticated user found");
        }

        const userRef = progressDB.collection('users').doc(user.uid);
        
        try {
            const doc = await userRef.get();
            
            if (doc.exists) {
                // User exists - fetch and display existing data
                console.log("📄 User document found - fetching existing data");
                const userData = doc.data();
                console.log("Existing user data:", userData);
                
                // Update last active timestamp
                await userRef.update({
                    lastActive: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log("✅ User data loaded successfully");
                return userData;
            } else {
                // New user - create initial document
                console.log("👤 New user detected - creating initial document");
                return await createNewUserDocument(userRef, user);
            }
        } catch (error) {
            console.error("❌ Error checking user document:", error);
            throw error;
        }
    }

    // Create new user document (only for truly new users)
    async function createNewUserDocument(userRef, user) {
        console.log("🏗️ Creating new user document...");
        
        const initialData = { 
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Anonymous User',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastActive: firebase.firestore.FieldValue.serverTimestamp(),
            progress: {
                exercises: {
                    completed: 0,
                    totalScore: 0,
                    lastCompleted: null
                },
                games: {
                    debuggingDetective: {
                        level: 1,
                        score: 0,
                        badges: [],
                        challengesCompleted: 0
                    },
                    aiArtist: {
                        visualizationsCreated: 0,
                        lastUsed: null
                    },
                    codingExercise: {
                        score: 0,
                        bestScore: 0,
                        problemsSolved: 0,
                        lastPlayed: null
                    }
                },
                videoLessons: {
                    completed: [], // Array of completed video IDs
                    totalCompleted: 0,
                    lastCompleted: null,
                    lastCompletedVideoId: null,
                    progressPercentage: 0
                },
                currentLesson: 1,
                overallProgress: 0
            }
        };

        try {
            await userRef.set(initialData);
            console.log("✅ New user document created successfully");
            return initialData;
        } catch (error) {
            console.error("❌ Error creating new user document:", error);
            throw error;
        }
    }

    // Legacy function for backward compatibility - now just calls checkAndSetupUser
    async function initializeUserDocument() {
        return await checkAndSetupUser();
    }

    // Update exercise progress - FIXED VERSION
    async function updateExerciseProgress(score, isCompleted = true) {
        const user = firebase.auth().currentUser;
        
        console.log("Attempting to update exercise progress...");
        console.log("User:", user);
        console.log("Score:", score);
        console.log("Is Completed:", isCompleted);
        
        if (!user) {
            console.error("No user logged in - cannot update progress");
            return;
        }
        
        try {
            const userRef = progressDB.collection('users').doc(user.uid);
            
            // Get current progress
            const doc = await userRef.get();
            
            if (!doc.exists) {
                console.log("User document does not exist, creating new one...");
                await createNewUserDocument(userRef, user);
                // Try again after creating document
                const newDoc = await userRef.get();
                if (!newDoc.exists) {
                    throw new Error("Failed to create user document");
                }
            }
            
            const userData = doc.exists ? doc.data() : (await userRef.get()).data();
            console.log("Current user data:", userData);
            
            const currentExercises = userData.progress?.exercises || {
                completed: 0,
                totalScore: 0,
                lastCompleted: null
            };
            
            console.log("Current exercises data:", currentExercises);
            
            // Fixed: Add score to total instead of replacing it
            const newExerciseData = {
                completed: isCompleted ? currentExercises.completed + 1 : currentExercises.completed,
                totalScore: currentExercises.totalScore + score, // ADD to existing score
                lastCompleted: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            console.log("New exercise data to save:", newExerciseData);
            
            // Update progress
            await userRef.update({
                'progress.exercises': newExerciseData,
                'lastActive': firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log("✅ Exercise progress updated successfully!");
            
            // Verify the update
            const updatedDoc = await userRef.get();
            console.log("Verified updated data:", updatedDoc.data().progress.exercises);
            
        } catch (error) {
            console.error("❌ Error updating exercise progress:", error);
            console.error("Error details:", error.message);
            console.error("Error code:", error.code);
        }
    }

// Update game progress for Debugging Detective
const updateDebuggingGameProgress = async (level, score, badges, challengesCompleted, solvedChallenges = null) => {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error("No user logged in");
        return;
    }

    try {
        const userRef = progressDB.collection('users').doc(user.uid);
        const doc = await userRef.get();

        if (!doc.exists) {
            await createNewUserDocument(userRef, user);
        }

        const currentData = doc.data();
        const currentGameData = currentData.progress?.games?.debuggingDetective || {};

        const updatedGameData = {
            ...currentGameData, // 🔑 Merge existing data to avoid overwrite
            level,
            score,
            badges,
            challengesCompleted,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (solvedChallenges) {
            updatedGameData.solvedChallenges = {
                ...currentGameData.solvedChallenges,
                ...solvedChallenges
            };
        }

        await userRef.update({
            'progress.games.debuggingDetective': updatedGameData,
            'lastActive': firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log("✅ Debugging game progress updated successfully!");
    } catch (error) {
        console.error("❌ Error updating game progress:", error);
    }
};

    // Update Coding Exercise Game progress
    async function updateCodingExerciseProgress(scoreEarned) {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error("No user logged in - cannot update coding exercise progress");
            return false;
        }
        
        try {
            const userRef = progressDB.collection('users').doc(user.uid);
            
            // Get current progress
            const doc = await userRef.get();
            
            if (!doc.exists) {
                console.log("User document does not exist, creating new one...");
                await createNewUserDocument(userRef, user);
                // Try again after creating document
                const newDoc = await userRef.get();
                if (!newDoc.exists) {
                    throw new Error("Failed to create user document");
                }
            }
            
            const userData = doc.exists ? doc.data() : (await userRef.get()).data();
            const currentCodingGame = userData.progress?.games?.codingExercise || {
                score: 0,
                bestScore: 0,
                problemsSolved: 0,
                lastPlayed: null
            };
            
            // Calculate new score and check if it's a best score
            const newScore = currentCodingGame.score + scoreEarned;
            const newBestScore = Math.max(currentCodingGame.bestScore, newScore);
            
            const updatedCodingGameData = {
                score: newScore,
                bestScore: newBestScore,
                problemsSolved: currentCodingGame.problemsSolved + 1,
                lastPlayed: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            console.log("Updating coding exercise progress:", updatedCodingGameData);
            
            // Update progress
            await userRef.update({
                'progress.games.codingExercise': updatedCodingGameData,
                'lastActive': firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log("✅ Coding exercise progress updated successfully!");
            
            // Return whether this was a new best score
            return newScore > currentCodingGame.bestScore;
            
        } catch (error) {
            console.error("❌ Error updating coding exercise progress:", error);
            return false;
        }
    }

    // Get current coding exercise progress
    async function getCodingExerciseProgress() {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error("No user logged in");
            return null;
        }
        
        try {
            const doc = await progressDB.collection('users').doc(user.uid).get();
            if (!doc.exists) {
                console.log("User document doesn't exist, creating new one...");
                const userRef = progressDB.collection('users').doc(user.uid);
                const userData = await createNewUserDocument(userRef, user);
                return userData.progress.games.codingExercise;
            }
            
            const codingExerciseProgress = doc.data().progress?.games?.codingExercise || {
                score: 0,
                bestScore: 0,
                problemsSolved: 0,
                lastPlayed: null
            };
            
            console.log("Retrieved coding exercise progress:", codingExerciseProgress);
            return codingExerciseProgress;
        } catch (error) {
            console.error("❌ Error getting coding exercise progress:", error);
            return null;
        }
    }

    // Update AI Artist progress
    async function updateAIArtistProgress() {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error("No user logged in");
            return;
        }
        
        try {
            const userRef = progressDB.collection('users').doc(user.uid);
            
            // Get current progress
            const doc = await userRef.get();
            if (!doc.exists) {
                await createNewUserDocument(userRef, user);
                return;
            }
            
            const userData = doc.data();
            const currentProgress = userData.progress?.games?.aiArtist || {
                visualizationsCreated: 0,
                lastUsed: null
            };
            
            await userRef.update({
                'progress.games.aiArtist': {
                    visualizationsCreated: currentProgress.visualizationsCreated + 1,
                    lastUsed: firebase.firestore.FieldValue.serverTimestamp()
                },
                'lastActive': firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log("✅ AI Artist progress updated successfully!");
        } catch (error) {
            console.error("❌ Error updating AI Artist progress:", error);
        }
    }

    // Get user progress data
    async function getUserProgress() {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error("No user logged in");
            return null;
        }
        
        try {
            const doc = await progressDB.collection('users').doc(user.uid).get();
            if (!doc.exists) {
                console.log("User document doesn't exist, creating new one...");
                const userRef = progressDB.collection('users').doc(user.uid);
                const userData = await createNewUserDocument(userRef, user);
                return userData.progress;
            }
            
            const progress = doc.data().progress;
            console.log("Retrieved user progress:", progress);
            return progress;
        } catch (error) {
            console.error("❌ Error getting user progress:", error);
            return null;
        }
    }

    // Get complete user data (including profile info)
    async function getUserData() {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error("No user logged in");
            return null;
        }
        
        try {
            const doc = await progressDB.collection('users').doc(user.uid).get();
            if (!doc.exists) {
                console.log("User document doesn't exist, creating new one...");
                const userRef = progressDB.collection('users').doc(user.uid);
                return await createNewUserDocument(userRef, user);
            }
            
            const userData = doc.data();
            console.log("Retrieved complete user data:", userData);
            return userData;
        } catch (error) {
            console.error("❌ Error getting user data:", error);
            return null;
        }
    }

    // Display user progress on dashboard (helper function)
    async function displayUserProgress() {
        try {
            const userData = await getUserData();
            if (!userData) {
                console.log("No user data available");
                return;
            }

            console.log("=== USER PROGRESS SUMMARY ===");
            console.log(`📧 Email: ${userData.email}`);
            console.log(`👤 Display Name: ${userData.displayName || 'Not set'}`);
            console.log(`📅 Member Since: ${userData.createdAt?.toDate?.() || 'Unknown'}`);
            console.log(`🕐 Last Active: ${userData.lastActive?.toDate?.() || 'Unknown'}`);
            
            const progress = userData.progress;
            console.log("\n📊 EXERCISE PROGRESS:");
            console.log(`  ✅ Completed: ${progress.exercises.completed}`);
            console.log(`  🏆 Total Score: ${progress.exercises.totalScore}`);
            
            console.log("\n🎮 GAME PROGRESS:");
            console.log(`  🕵️ Debugging Detective Level: ${progress.games.debuggingDetective.level}`);
            console.log(`  🕵️ Debugging Detective Score: ${progress.games.debuggingDetective.score}`);
            console.log(`  🎨 AI Artist Visualizations: ${progress.games.aiArtist.visualizationsCreated}`);
            console.log(`  💻 Coding Exercise Score: ${progress.games.codingExercise.score}`);
            console.log(`  🏆 Coding Exercise Best Score: ${progress.games.codingExercise.bestScore}`);
            console.log(`  ✅ Problems Solved: ${progress.games.codingExercise.problemsSolved}`);
            
            console.log("\n📹 VIDEO LESSONS:");
            console.log(`  ✅ Completed: ${progress.videoLessons.totalCompleted}`);
            console.log(`  📈 Progress: ${progress.videoLessons.progressPercentage}%`);
            
            console.log("\n🎯 OVERALL PROGRESS:");
            console.log(`  📚 Current Lesson: ${progress.currentLesson}`);
            console.log(`  📊 Overall Progress: ${progress.overallProgress}%`);
            
            return userData;
        } catch (error) {
            console.error("❌ Error displaying user progress:", error);
            return null;
        }
    }

    // Debug function to test the connection
    async function testFirebaseConnection() {
        console.log("Testing Firebase connection...");
        
        try {
            // Test write
            await updateExerciseProgress(10, true);
            
            // Test read
            const progress = await getUserProgress();
            console.log("✅ Firebase connection test successful!");
            console.log("Current progress:", progress);
            
        } catch (error) {
            console.error("❌ Firebase connection test failed:", error);
        }
    }

    // Make functions globally available
    window.CodeSafariProgressTracker = {
        updateExerciseProgress,
        updateDebuggingGameProgress,
        updateCodingExerciseProgress,
        getCodingExerciseProgress,
        updateAIArtistProgress,
        getUserProgress,
        getUserData,
        displayUserProgress,
        testFirebaseConnection,
        checkAndSetupUser,
        // Keep legacy function for compatibility
        initializeUserDocument
    };

    // Call this function when user logs in to test and setup
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // Don't run test automatically, just setup user
            console.log("User authenticated, data will be loaded when needed");
        } else {
            console.warn("User not logged in");
        }
    });
// Add these new methods to the existing window.CodeSafariProgressTracker object
window.CodeSafariProgressTracker.debuggingDetective = {
    // Track detailed challenge completion
    async trackChallengeCompletion(challengeData) {
        const {
            challengeId,
            difficulty,
            pointsEarned,
            hintsUsed,
            attempts,
            timeSpent,
            wasAlreadySolved = false
        } = challengeData;
        
        try {
            const currentProgress = await window.CodeSafariProgressTracker.getUserProgress();
            if (!currentProgress) return false;
            
            const gameProgress = currentProgress.games?.debuggingDetective || {};
            
            // Update statistics
            const currentStats = gameProgress.statistics || {
                totalHintsUsed: 0,
                timeSpent: 0,
                difficultyBreakdown: {
                    easy: { completed: 0, score: 0 },
                    medium: { completed: 0, score: 0 },
                    hard: { completed: 0, score: 0 }
                }
            };
            
            // Update difficulty-specific stats
            const difficultyStats = currentStats.difficultyBreakdown[difficulty] || { completed: 0, score: 0 };
            if (!wasAlreadySolved) {
                difficultyStats.completed += 1;
                difficultyStats.score += pointsEarned;
            }
            
            const updatedStats = {
                totalHintsUsed: currentStats.totalHintsUsed + hintsUsed,
                timeSpent: currentStats.timeSpent + timeSpent,
                difficultyBreakdown: {
                    ...currentStats.difficultyBreakdown,
                    [difficulty]: difficultyStats
                }
            };
            
            // Update the game progress
            await window.CodeSafariProgressTracker.updateDebuggingGameProgress(
                gameProgress.level || 1,
                wasAlreadySolved ? gameProgress.score : (gameProgress.score || 0) + pointsEarned,
                gameProgress.badges || [],
                wasAlreadySolved ? gameProgress.challengesCompleted : (gameProgress.challengesCompleted || 0) + 1
            );
            
            return true;
        } catch (error) {
            console.error("❌ Error tracking challenge completion:", error);
            return false;
        }
    },

    // Check if challenge is already solved
    async isChallengeAlreadySolved(challengeId) {
        try {
            const progress = await window.CodeSafariProgressTracker.getUserProgress();
            return progress?.games?.debuggingDetective?.solvedChallenges?.[challengeId] === true;
        } catch (error) {
            console.error("❌ Error checking challenge status:", error);
            return false;
        }
    }
};
}