// Debug utility to track loading states and prevent infinite loading
export class LoadingTracker {
  private static instance: LoadingTracker;
  private loadingStates: Map<string, { start: number; timeout?: NodeJS.Timeout }> = new Map();
  
  static getInstance(): LoadingTracker {
    if (!LoadingTracker.instance) {
      LoadingTracker.instance = new LoadingTracker();
    }
    return LoadingTracker.instance;
  }
  
  startLoading(key: string, timeoutMs: number = 10000): void {
    const existing = this.loadingStates.get(key);
    if (existing?.timeout) {
      clearTimeout(existing.timeout);
    }
    
    const timeout = setTimeout(() => {
      console.warn(`⚠️ Loading timeout for ${key} after ${timeoutMs}ms`);
      this.endLoading(key);
    }, timeoutMs);
    
    this.loadingStates.set(key, {
      start: Date.now(),
      timeout
    });
    
    console.log(`🔄 Started loading: ${key}`);
  }
  
  endLoading(key: string): void {
    const state = this.loadingStates.get(key);
    if (state) {
      if (state.timeout) {
        clearTimeout(state.timeout);
      }
      const duration = Date.now() - state.start;
      console.log(`✅ Ended loading: ${key} (${duration}ms)`);
      this.loadingStates.delete(key);
    }
  }
  
  isLoading(key: string): boolean {
    return this.loadingStates.has(key);
  }
  
  getActiveLoadings(): string[] {
    return Array.from(this.loadingStates.keys());
  }
  
  clearAll(): void {
    this.loadingStates.forEach((state, key) => {
      if (state.timeout) {
        clearTimeout(state.timeout);
      }
      console.log(`🧹 Cleared loading: ${key}`);
    });
    this.loadingStates.clear();
  }
}

// Global instance
export const loadingTracker = LoadingTracker.getInstance(); 