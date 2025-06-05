// lib/alerting.ts
/**
 * Alerting and notification system for critical issues
 */

interface AlertConfig {
    enabled: boolean;
    channels: {
      email?: {
        enabled: boolean;
        recipients: string[];
        smtpConfig?: {
          host: string;
          port: number;
          secure: boolean;
          auth: {
            user: string;
            pass: string;
          };
        };
      };
      slack?: {
        enabled: boolean;
        webhookUrl: string;
        channel: string;
      };
      discord?: {
        enabled: boolean;
        webhookUrl: string;
      };
      webhook?: {
        enabled: boolean;
        url: string;
        headers?: Record<string, string>;
      };
    };
    thresholds: {
      errorRate: number; // errors per hour
      responseTime: number; // milliseconds
      memoryUsage: number; // percentage
      criticalErrorCount: number; // number of critical errors
    };
    cooldown: number; // minutes between alerts for same issue
  }
  
  interface Alert {
    id: string;
    type: 'CRITICAL_ERROR' | 'HIGH_ERROR_RATE' | 'SLOW_RESPONSE' | 'HIGH_MEMORY' | 'SERVICE_DOWN';
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: string;
    context: Record<string, any>;
    resolved?: boolean;
    resolvedAt?: string;
  }
  
  // In-memory alert tracking
  const alertHistory: Alert[] = [];
  const alertCooldowns: Map<string, number> = new Map();
  
  const defaultConfig: AlertConfig = {
    enabled: process.env.NODE_ENV === 'production',
    channels: {
      email: {
        enabled: !!process.env.SMTP_HOST,
        recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
        smtpConfig: process.env.SMTP_HOST ? {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
          },
        } : undefined,
      },
      slack: {
        enabled: !!process.env.SLACK_WEBHOOK_URL,
        webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
        channel: process.env.SLACK_CHANNEL || '#alerts',
      },
      discord: {
        enabled: !!process.env.DISCORD_WEBHOOK_URL,
        webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
      },
      webhook: {
        enabled: !!process.env.CUSTOM_ALERT_WEBHOOK_URL,
        url: process.env.CUSTOM_ALERT_WEBHOOK_URL || '',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.CUSTOM_WEBHOOK_AUTH || '',
        },
      },
    },
    thresholds: {
      errorRate: parseInt(process.env.ALERT_ERROR_RATE_THRESHOLD || '10'),
      responseTime: parseInt(process.env.ALERT_RESPONSE_TIME_THRESHOLD || '60000'),
      memoryUsage: parseInt(process.env.ALERT_MEMORY_THRESHOLD || '90'),
      criticalErrorCount: parseInt(process.env.ALERT_CRITICAL_ERROR_THRESHOLD || '3'),
    },
    cooldown: parseInt(process.env.ALERT_COOLDOWN_MINUTES || '15'),
  };
  
  /**
   * Send alert through configured channels
   */
  export async function sendAlert(alert: Alert, config: AlertConfig = defaultConfig) {
    if (!config.enabled) {
      console.log('[ALERTS] Alerting disabled, skipping:', alert.title);
      return;
    }
  
    // Check cooldown
    const cooldownKey = `${alert.type}-${alert.severity}`;
    const lastAlert = alertCooldowns.get(cooldownKey);
    const now = Date.now();
    const cooldownMs = config.cooldown * 60 * 1000;
  
    if (lastAlert && (now - lastAlert) < cooldownMs) {
      console.log('[ALERTS] Alert in cooldown period, skipping:', alert.title);
      return;
    }
  
    // Update cooldown
    alertCooldowns.set(cooldownKey, now);
  
    // Store alert
    alertHistory.unshift(alert);
    if (alertHistory.length > 100) {
      alertHistory.splice(100);
    }
  
    console.log('[ALERTS] Sending alert:', alert.title);
  
    // Send to all enabled channels
    const promises = [];
  
    if (config.channels.slack?.enabled) {
      promises.push(sendSlackAlert(alert, config.channels.slack));
    }
  
    if (config.channels.discord?.enabled) {
      promises.push(sendDiscordAlert(alert, config.channels.discord));
    }
  
    if (config.channels.email?.enabled && config.channels.email.smtpConfig) {
      promises.push(sendEmailAlert(alert, config.channels.email));
    }
  
    if (config.channels.webhook?.enabled) {
      promises.push(sendWebhookAlert(alert, config.channels.webhook));
    }
  
    // Wait for all notifications to complete
    try {
      await Promise.allSettled(promises);
      console.log('[ALERTS] Alert sent successfully:', alert.id);
    } catch (error) {
      console.error('[ALERTS] Failed to send some notifications:', error);
    }
  }
  
  /**
   * Check system conditions and trigger alerts if necessary
   */
  export function checkAlertConditions(
    errorStats: any,
    healthStatus: any,
    config: AlertConfig = defaultConfig
  ) {
    const now = new Date().toISOString();
  
    // Check error rate
    if (errorStats.summary.errorsLastHour >= config.thresholds.errorRate) {
      sendAlert({
        id: generateAlertId(),
        type: 'HIGH_ERROR_RATE',
        severity: 'warning',
        title: '🚨 High Error Rate Detected',
        message: `Error rate is ${errorStats.summary.errorsLastHour} errors in the last hour (threshold: ${config.thresholds.errorRate})`,
        timestamp: now,
        context: {
          errorRate: errorStats.summary.errorsLastHour,
          threshold: config.thresholds.errorRate,
          errorsByType: errorStats.byType,
        },
      }, config);
    }
  
    // Check critical errors
    const criticalErrors = errorStats.severityDistribution?.critical || 0;
    if (criticalErrors >= config.thresholds.criticalErrorCount) {
      sendAlert({
        id: generateAlertId(),
        type: 'CRITICAL_ERROR',
        severity: 'critical',
        title: '🔥 Critical Errors Detected',
        message: `${criticalErrors} critical errors detected (threshold: ${config.thresholds.criticalErrorCount})`,
        timestamp: now,
        context: {
          criticalErrorCount: criticalErrors,
          threshold: config.thresholds.criticalErrorCount,
          recentErrors: errorStats.recentErrorTypes,
        },
      }, config);
    }
  
    // Check memory usage
    if (healthStatus.checks?.memory) {
      const memoryUsagePercent = (healthStatus.checks.memory.heapUsed / healthStatus.checks.memory.heapTotal) * 100;
      if (memoryUsagePercent >= config.thresholds.memoryUsage) {
        sendAlert({
          id: generateAlertId(),
          type: 'HIGH_MEMORY',
          severity: 'warning',
          title: '🧠 High Memory Usage',
          message: `Memory usage is ${memoryUsagePercent.toFixed(1)}% (threshold: ${config.thresholds.memoryUsage}%)`,
          timestamp: now,
          context: {
            memoryUsagePercent,
            threshold: config.thresholds.memoryUsage,
            memoryStats: healthStatus.checks.memory,
          },
        }, config);
      }
    }
  
    // Check response time
    if (healthStatus.checks?.responseTime && healthStatus.checks.responseTime >= config.thresholds.responseTime) {
      sendAlert({
        id: generateAlertId(),
        type: 'SLOW_RESPONSE',
        severity: 'warning',
        title: '🐌 Slow Response Time',
        message: `Average response time is ${(healthStatus.checks.responseTime / 1000).toFixed(1)}s (threshold: ${(config.thresholds.responseTime / 1000).toFixed(1)}s)`,
        timestamp: now,
        context: {
          responseTime: healthStatus.checks.responseTime,
          threshold: config.thresholds.responseTime,
        },
      }, config);
    }
  
    // Check service health
    if (healthStatus.status === 'unhealthy') {
      sendAlert({
        id: generateAlertId(),
        type: 'SERVICE_DOWN',
        severity: 'critical',
        title: '💀 Service Unhealthy',
        message: 'Service health check failed - system is in unhealthy state',
        timestamp: now,
        context: {
          healthStatus: healthStatus.status,
          checks: healthStatus.checks,
          errors: healthStatus.errors,
        },
      }, config);
    }
  }
  
  /**
   * Send Slack notification
   */
  async function sendSlackAlert(alert: Alert, config: { webhookUrl: string; channel: string }) {
    const color = alert.severity === 'critical' ? '#ff0000' : 
                 alert.severity === 'warning' ? '#ffaa00' : '#00ff00';
  
    const payload = {
      channel: config.channel,
      username: 'Aplycat Monitor',
      icon_emoji: ':cat:',
      attachments: [
        {
          color,
          title: alert.title,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Type',
              value: alert.type,
              short: true,
            },
            {
              title: 'Timestamp',
              value: new Date(alert.timestamp).toLocaleString(),
              short: true,
            },
          ],
          footer: 'Aplycat Monitoring',
          ts: Math.floor(new Date(alert.timestamp).getTime() / 1000),
        },
      ],
    };
  
    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`Slack API returned ${response.status}`);
      }
  
      console.log('[ALERTS] Slack notification sent successfully');
    } catch (error) {
      console.error('[ALERTS] Failed to send Slack notification:', error);
    }
  }
  
  /**
   * Send Discord notification
   */
  async function sendDiscordAlert(alert: Alert, config: { webhookUrl: string }) {
    const color = alert.severity === 'critical' ? 0xff0000 : 
                 alert.severity === 'warning' ? 0xffaa00 : 0x00ff00;
  
    const payload = {
      embeds: [
        {
          title: alert.title,
          description: alert.message,
          color,
          fields: [
            {
              name: 'Severity',
              value: alert.severity.toUpperCase(),
              inline: true,
            },
            {
              name: 'Type',
              value: alert.type,
              inline: true,
            },
            {
              name: 'Timestamp',
              value: new Date(alert.timestamp).toLocaleString(),
              inline: true,
            },
          ],
          footer: {
            text: 'Aplycat Monitoring',
          },
          timestamp: alert.timestamp,
        },
      ],
    };
  
    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`Discord API returned ${response.status}`);
      }
  
      console.log('[ALERTS] Discord notification sent successfully');
    } catch (error) {
      console.error('[ALERTS] Failed to send Discord notification:', error);
    }
  }
  
  /**
   * Send email notification
   */
  async function sendEmailAlert(alert: Alert, config: any) {
    // Note: This requires a proper email service implementation
    // For production, you'd use nodemailer or a service like SendGrid
    
    console.log('[ALERTS] Email notification would be sent to:', config.recipients);
    console.log('[ALERTS] Email content:', {
      subject: `[Aplycat Alert] ${alert.title}`,
      body: `
  ${alert.title}
  
  ${alert.message}
  
  Severity: ${alert.severity.toUpperCase()}
  Type: ${alert.type}
  Timestamp: ${new Date(alert.timestamp).toLocaleString()}
  
  Context: ${JSON.stringify(alert.context, null, 2)}
  
  ---
  Aplycat Monitoring System
      `.trim(),
    });
  
    // TODO: Implement actual email sending
    // const transporter = nodemailer.createTransporter(config.smtpConfig);
    // await transporter.sendMail({ ... });
  }
  
  /**
   * Send custom webhook notification
   */
  async function sendWebhookAlert(alert: Alert, config: { url: string; headers?: Record<string, string> }) {
    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify({
          alert,
          service: 'aplycat-resume-analysis',
          timestamp: new Date().toISOString(),
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }
  
      console.log('[ALERTS] Webhook notification sent successfully');
    } catch (error) {
      console.error('[ALERTS] Failed to send webhook notification:', error);
    }
  }
  
  /**
   * Get alert history
   */
  export function getAlertHistory(limit: number = 50): Alert[] {
    return alertHistory.slice(0, limit);
  }
  
  /**
   * Clear alert history
   */
  export function clearAlertHistory() {
    alertHistory.length = 0;
    alertCooldowns.clear();
  }
  
  /**
   * Generate unique alert ID
   */
  function generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Mark alert as resolved
   */
  export function resolveAlert(alertId: string) {
    const alert = alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      console.log('[ALERTS] Alert resolved:', alertId);
    }
  }
  
  /**
   * Test alert system
   */
  export async function testAlerts(config: AlertConfig = defaultConfig) {
    const testAlert: Alert = {
      id: generateAlertId(),
      type: 'CRITICAL_ERROR',
      severity: 'info',
      title: '🧪 Test Alert',
      message: 'This is a test alert to verify the notification system is working correctly.',
      timestamp: new Date().toISOString(),
      context: {
        test: true,
        environment: process.env.NODE_ENV,
      },
    };
  
    await sendAlert(testAlert, config);
    return testAlert.id;
  }