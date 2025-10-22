/**
 * Session Management Service for Enhanced Security
 * Handles session validation, timeout, and security monitoring
 */

interface SessionData {
  userId: string;
  email: string;
  role: string;
  loginTime: number;
  lastActivity: number;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
}

class SessionService {
  private static readonly SESSION_KEY = 'admin_session';
  private static readonly MAX_IDLE_TIME = 4 * 60 * 60 * 1000; // 4 hours  
  private static readonly MAX_SESSION_TIME = 12 * 60 * 60 * 1000; // 12 hours
  private static readonly ACTIVITY_CHECK_INTERVAL = 60 * 1000; // 1 minute
  
  private activityTimer: NodeJS.Timeout | null = null;
  private sessionWarningTimer: NodeJS.Timeout | null = null;
  private onSessionExpired?: () => void;
  private onSessionWarning?: (timeLeft: number) => void;

  /**
   * Initialize session monitoring
   */
  public static initialize(
    onSessionExpired?: () => void,
    onSessionWarning?: (timeLeft: number) => void
  ): SessionService {
    const service = new SessionService();
    service.onSessionExpired = onSessionExpired;
    service.onSessionWarning = onSessionWarning;
    service.startActivityMonitoring();
    return service;
  }

  /**
   * Create a new session
   */
  public createSession(userData: {
    userId: string;
    email: string;
    role: string;
  }): void {
    const sessionData: SessionData = {
      ...userData,
      loginTime: Date.now(),
      lastActivity: Date.now(),
      sessionId: this.generateSessionId(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
    };

    localStorage.setItem(SessionService.SESSION_KEY, JSON.stringify(sessionData));
    this.logSecurityEvent('SESSION_CREATED', sessionData);
    this.startActivityMonitoring();
  }

  /**
   * Update session activity
   */
  public updateActivity(): void {
    const session = this.getSession();
    if (session) {
      session.lastActivity = Date.now();
      localStorage.setItem(SessionService.SESSION_KEY, JSON.stringify(session));
    }
  }

  /**
   * Get current session data
   */
  public getSession(): SessionData | null {
    try {
      const sessionStr = localStorage.getItem(SessionService.SESSION_KEY);
      if (!sessionStr) return null;
      
      const session: SessionData = JSON.parse(sessionStr);
      
      // Validate session integrity
      if (!this.isSessionValid(session)) {
        this.destroySession();
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Session parsing error:', error);
      this.destroySession();
      return null;
    }
  }

  /**
   * Check if session is valid
   */
  public isSessionValid(session?: SessionData): boolean {
    if (!session) {
      session = this.getSession();
    }
    
    if (!session) return false;

    const now = Date.now();
    const sessionAge = now - session.loginTime;
    const idleTime = now - session.lastActivity;

    // Check maximum session time
    if (sessionAge > SessionService.MAX_SESSION_TIME) {
      this.logSecurityEvent('SESSION_EXPIRED_MAX_TIME', session);
      return false;
    }

    // Check idle timeout
    if (idleTime > SessionService.MAX_IDLE_TIME) {
      this.logSecurityEvent('SESSION_EXPIRED_IDLE', session);
      return false;
    }

    // Check session integrity
    if (!session.sessionId || !session.userId || !session.email) {
      this.logSecurityEvent('SESSION_INTEGRITY_VIOLATION', session);
      return false;
    }

    return true;
  }

  /**
   * Get time until session expires
   */
  public getTimeUntilExpiry(): number {
    const session = this.getSession();
    if (!session) return 0;

    const now = Date.now();
    const maxSessionExpiry = session.loginTime + SessionService.MAX_SESSION_TIME;
    const idleExpiry = session.lastActivity + SessionService.MAX_IDLE_TIME;
    
    return Math.min(maxSessionExpiry - now, idleExpiry - now);
  }

  /**
   * Destroy current session
   */
  public destroySession(): void {
    const session = this.getSession();
    if (session) {
      this.logSecurityEvent('SESSION_DESTROYED', session);
    }
    
    localStorage.removeItem(SessionService.SESSION_KEY);
    this.stopActivityMonitoring();
  }

  /**
   * Start monitoring user activity
   */
  private startActivityMonitoring(): void {
    this.stopActivityMonitoring();

    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const updateActivity = () => this.updateActivity();
    
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Check session validity periodically
    this.activityTimer = setInterval(() => {
      if (!this.isSessionValid()) {
        this.handleSessionExpiry();
        return;
      }

      // Check if we should show warning
      const timeLeft = this.getTimeUntilExpiry();
      const warningThreshold = 5 * 60 * 1000; // 5 minutes

      if (timeLeft <= warningThreshold && timeLeft > 0) {
        this.onSessionWarning?.(timeLeft);
      }
    }, SessionService.ACTIVITY_CHECK_INTERVAL);
  }

  /**
   * Stop activity monitoring
   */
  private stopActivityMonitoring(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }

    if (this.sessionWarningTimer) {
      clearTimeout(this.sessionWarningTimer);
      this.sessionWarningTimer = null;
    }

    // Remove activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const updateActivity = () => this.updateActivity();
    
    activityEvents.forEach(event => {
      document.removeEventListener(event, updateActivity);
    });
  }

  /**
   * Handle session expiry
   */
  private handleSessionExpiry(): void {
    this.destroySession();
    this.onSessionExpired?.();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2);
    return `${timestamp}-${randomStr}`;
  }

  /**
   * Get client IP (best effort)
   */
  private getClientIP(): string {
    // This is a placeholder - in a real app, you'd get this from the server
    return 'client-ip';
  }

  /**
   * Log security events
   */
  private logSecurityEvent(event: string, session: SessionData): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      sessionId: session.sessionId,
      userId: session.userId,
      email: session.email,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
    };

    console.log('Security Event:', logEntry);
    
    // In a real application, send this to your security monitoring service
    // this.sendToSecurityService(logEntry);
  }

  /**
   * Extend session (for active users)
   */
  public extendSession(): boolean {
    const session = this.getSession();
    if (!session || !this.isSessionValid(session)) {
      return false;
    }

    session.lastActivity = Date.now();
    localStorage.setItem(SessionService.SESSION_KEY, JSON.stringify(session));
    this.logSecurityEvent('SESSION_EXTENDED', session);
    return true;
  }

  /**
   * Get session statistics
   */
  public getSessionStats(): {
    sessionAge: number;
    idleTime: number;
    timeUntilExpiry: number;
    isValid: boolean;
  } | null {
    const session = this.getSession();
    if (!session) return null;

    const now = Date.now();
    return {
      sessionAge: now - session.loginTime,
      idleTime: now - session.lastActivity,
      timeUntilExpiry: this.getTimeUntilExpiry(),
      isValid: this.isSessionValid(session),
    };
  }

  /**
   * Check for suspicious activity
   */
  public checkSuspiciousActivity(): boolean {
    const session = this.getSession();
    if (!session) return false;

    // Check for user agent changes (possible session hijacking)
    if (session.userAgent !== navigator.userAgent) {
      this.logSecurityEvent('SUSPICIOUS_USER_AGENT_CHANGE', session);
      return true;
    }

    // Add more security checks as needed
    return false;
  }
}

export default SessionService;
export type { SessionData };