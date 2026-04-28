import { useState, useEffect } from 'react';
import { get, set, del, keys } from 'idb-keyval';
import { StoryData } from '../types';

export interface SavedStory {
  id: string;
  date: number;
  story: StoryData;
}

export const useStoryLibrary = () => {
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);

  const loadLibrary = async () => {
    setIsLoadingLibrary(true);
    try {
      const allKeys = await keys();
      const storyKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith('story_'));
      
      const stories: SavedStory[] = [];
      for (const key of storyKeys) {
        const data = await get(key);
        if (data) {
          stories.push(data as SavedStory);
        }
      }
      
      // Sort by date descending (newest first)
      stories.sort((a, b) => b.date - a.date);
      setSavedStories(stories);
    } catch (e) {
      console.error("Failed to load library from IndexedDB", e);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  const saveStory = async (story: StoryData) => {
    try {
      const id = `story_${Date.now()}`;
      const newStory: SavedStory = {
        id,
        date: Date.now(),
        story
      };
      await set(id, newStory);
      await loadLibrary(); // Reload list
      return true;
    } catch (e) {
      console.error("Failed to save story to IndexedDB", e);
      return false;
    }
  };

  const deleteStory = async (id: string) => {
    try {
      await del(id);
      await loadLibrary();
      return true;
    } catch (e) {
      console.error("Failed to delete story", e);
      return false;
    }
  };

  return { savedStories, isLoadingLibrary, saveStory, deleteStory };
};
