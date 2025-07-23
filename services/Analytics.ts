// Analytics service for tracking user interactions and app performance
// You can integrate with services like Firebase Analytics, Mixpanel, or Amplitude

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export interface UserProperties {
  userId: string;
  role: string;
  email?: string;
}

class AnalyticsService {
  private isEnabled: boolean = true;
  private userId?: string;
  private userRole?: string;

  /**
   * Initialize analytics with user properties
   */
  initialize(userProperties: UserProperties): void {
    this.userId = userProperties.userId;
    this.userRole = userProperties.role;
    console.log('📊 Analytics initialized for user:', userProperties.userId);
  }

  /**
   * Track an event
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        userId: this.userId,
        userRole: this.userRole,
        timestamp: Date.now(),
      },
    };

    console.log('📊 Analytics Event:', event);
    
    // Here you would send to your analytics service
    // Example: Firebase Analytics, Mixpanel, etc.
    this.sendToAnalyticsService(event);
  }

  /**
   * Track user registration
   */
  trackUserRegistration(userId: string, role: string): void {
    this.trackEvent('user_registered', {
      userId,
      role,
      registrationMethod: 'email',
    });
  }

  /**
   * Track event creation
   */
  trackEventCreation(eventId: string, eventType: string): void {
    this.trackEvent('event_created', {
      eventId,
      eventType,
      createdBy: this.userId,
    });
  }

  /**
   * Track event registration
   */
  trackEventRegistration(eventId: string, eventTitle: string): void {
    this.trackEvent('event_registered', {
      eventId,
      eventTitle,
      registeredBy: this.userId,
    });
  }

  /**
   * Track event bookmark
   */
  trackEventBookmark(eventId: string, isBookmarked: boolean): void {
    this.trackEvent('event_bookmarked', {
      eventId,
      isBookmarked,
      bookmarkedBy: this.userId,
    });
  }

  /**
   * Track app performance
   */
  trackPerformance(metric: string, value: number): void {
    this.trackEvent('performance_metric', {
      metric,
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: string): void {
    this.trackEvent('app_error', {
      errorMessage: error.message,
      errorStack: error.stack,
      context,
      userId: this.userId,
    });
  }

  /**
   * Send to analytics service (placeholder for actual implementation)
   */
  private sendToAnalyticsService(event: AnalyticsEvent): void {
    // Implement your analytics service integration here
    // Examples:
    // - Firebase Analytics
    // - Mixpanel
    // - Amplitude
    // - Custom analytics endpoint
    
    // For now, we'll just log to console
    // In production, replace this with actual analytics service calls
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log('📊 Analytics', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Get analytics status
   */
  getStatus(): { enabled: boolean; userId?: string; userRole?: string } {
    return {
      enabled: this.isEnabled,
      userId: this.userId,
      userRole: this.userRole,
    };
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();
export default analytics; 