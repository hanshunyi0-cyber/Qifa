// services/chinaCloud.ts
// This service wraps LeanCloud (TDS) for China-accessible cloud features.
// It serves as a direct replacement for Firebase when in "China Mode".

import 'leancloud-storage';
const AV = (window as any).AV;

import type { UserProfile, Post, StudyResource } from '../types';

let isInitialized = false;

// NOTE TO USER: 
// To make this work in production, you must register at https://www.leancloud.cn/ (or TDS)
// and obtain an App ID and App Key.
// Replace the placeholders below or set them in your environment variables.
const APP_ID = process.env.VITE_LEANCLOUD_APP_ID || "Please-Set-LeanCloud-App-ID";
const APP_KEY = process.env.VITE_LEANCLOUD_APP_KEY || "Please-Set-LeanCloud-App-Key";
const SERVER_URL = process.env.VITE_LEANCLOUD_SERVER_URL || "https://your-custom-domain.api.lncldglobal.com";

export const initChinaCloud = () => {
    if (isInitialized) return;
    try {
        if (!AV) {
            console.error("LeanCloud SDK not loaded. Check index.html importmap.");
            return;
        }
        
        // Only init if keys are present (basic check)
        if (!APP_ID || APP_ID.includes("Please-Set")) {
            console.warn("LeanCloud App ID missing. China mode will not work fully.");
            return;
        }

        AV.init({
            appId: APP_ID,
            appKey: APP_KEY,
            serverURL: SERVER_URL
        });
        isInitialized = true;
        console.log("China Cloud (LeanCloud) Initialized");
    } catch (e) {
        console.error("Failed to init LeanCloud", e);
    }
};

// --- AUTH MAPPING ---

export const cnLogin = async (email: string, password: string): Promise<UserProfile> => {
    try {
        const user = await AV.User.logIn(email, password); // LeanCloud uses username/email
        const userData = user.toJSON();
        
        // Map LeanCloud user to our UserProfile
        return {
            name: userData.name || userData.username,
            email: userData.email,
            phone: userData.mobilePhoneNumber,
            studentId: userData.studentId || '',
            school: userData.school || '',
            degreeLevel: userData.degreeLevel || '',
            program: userData.program || '',
            startDate: userData.startDate || '',
            currentLocation: userData.currentLocation || '',
            targetCity: userData.targetCity || '',
            role: userData.role || 'USER',
            status: 'ACTIVE',
            isOnline: true
        };
    } catch (e: any) {
        throw new Error(e.message || "CN Login Failed");
    }
};

export const cnRegister = async (profile: UserProfile, password: string): Promise<void> => {
    try {
        const user = new AV.User();
        // Use email as username for simplicity, or allow phone
        user.setUsername(profile.email || profile.phone || `user_${Date.now()}`);
        user.setPassword(password);
        if (profile.email) user.setEmail(profile.email);
        if (profile.phone) user.setMobilePhoneNumber(profile.phone);
        
        // Set custom fields
        user.set('name', profile.name);
        user.set('school', profile.school);
        user.set('program', profile.program);
        user.set('role', 'USER');
        
        await user.signUp();
    } catch (e: any) {
        throw new Error(e.message || "CN Register Failed");
    }
};

export const cnLogout = async () => {
    await AV.User.logOut();
};

export const cnCheckCurrentUser = (): UserProfile | null => {
    const user = AV.User.current();
    if (!user) return null;
    const userData = user.toJSON();
    return {
        name: userData.name || userData.username,
        email: userData.email,
        phone: userData.mobilePhoneNumber,
        studentId: userData.studentId || '',
        school: userData.school || '',
        degreeLevel: userData.degreeLevel || '',
        program: userData.program || '',
        startDate: userData.startDate || '',
        currentLocation: userData.currentLocation || '',
        targetCity: userData.targetCity || '',
        role: userData.role || 'USER',
        status: 'ACTIVE',
        isOnline: true
    };
};

// --- DATA MAPPING ---

export const cnFetchPosts = async (): Promise<Post[]> => {
    try {
        const query = new AV.Query('Post');
        query.descending('createdAt');
        query.limit(50);
        const results = await query.find();
        return results.map((r: any) => {
            const data = r.toJSON();
            return {
                id: r.id || '',
                authorId: data.authorId,
                authorName: data.authorName,
                authorRole: data.authorRole,
                title: data.title,
                content: data.content,
                likes: data.likes || [],
                comments: data.comments || [],
                timestamp: new Date(data.createdAt).getTime()
            } as Post;
        });
    } catch (e) {
        console.error("CN Fetch Posts Error", e);
        return [];
    }
};

export const cnCreatePost = async (postData: Partial<Post>) => {
    try {
        const PostObj = AV.Object.extend('Post');
        const post = new PostObj();
        post.set('title', postData.title);
        post.set('content', postData.content);
        post.set('authorId', postData.authorId);
        post.set('authorName', postData.authorName);
        post.set('authorRole', postData.authorRole);
        post.set('likes', []);
        post.set('comments', []);
        await post.save();
    } catch (e) {
        throw e;
    }
};

export const cnAddComment = async (postId: string, comment: any) => {
    const post = AV.Object.createWithoutData('Post', postId);
    post.add('comments', comment);
    await post.save();
};

export const cnLikePost = async (postId: string, userId: string, isLike: boolean) => {
    const post = AV.Object.createWithoutData('Post', postId);
    if (isLike) {
        post.addUnique('likes', userId);
    } else {
        post.remove('likes', userId);
    }
    await post.save();
};
