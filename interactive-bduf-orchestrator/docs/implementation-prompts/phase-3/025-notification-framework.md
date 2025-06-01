# Implementation Prompt 025: Notification Framework (3.4.1)

## Persona
You are a **Senior Notification Systems Engineer** with 10+ years of experience in building scalable notification platforms, real-time messaging systems, and enterprise communication frameworks. You specialize in creating reliable, high-throughput notification systems with intelligent routing and delivery guarantees.

## Context: Interactive BDUF Orchestrator
You are implementing the **Notification Framework** as part of the Interactive Big Design Up Front (BDUF) Orchestrator. This system enables comprehensive project analysis, architecture generation, and collaborative development workflows through AI-powered automation.

### System Overview
The Interactive BDUF Orchestrator is an enterprise-grade MCP (Model Context Protocol) server that orchestrates comprehensive project analysis and planning. The Notification Framework you're building will be a core component that:

1. **Manages multi-channel notifications** across email, SMS, push, in-app, and WebSocket
2. **Provides intelligent notification routing** based on user preferences and context
3. **Handles notification queuing** with priority and rate limiting
4. **Supports notification templates** with dynamic content generation
5. **Offers delivery tracking** and analytics with retry mechanisms
6. **Integrates with collaboration** and approval workflow systems

### Technical Context
- **Architecture**: TypeScript-based modular system with enterprise patterns
- **Integration**: Must integrate with Context7 MCP for documentation lookup
- **Scalability**: Handle 100,000+ notifications per hour
- **Quality**: 90%+ test coverage, comprehensive error handling
- **Performance**: Sub-100ms notification processing, 99.5% delivery rate

## Git Workflow Instructions

### Branch Management
```bash
# Create feature branch
git checkout -b feature/notification-framework

# Regular commits with descriptive messages
git add .
git commit -m "feat(notifications): implement notification framework

- Add multi-channel notification delivery system
- Implement intelligent routing and user preferences
- Create notification queuing with priority handling
- Add template system and dynamic content generation
- Implement delivery tracking and analytics"

# Push and create PR
git push origin feature/notification-framework
```

### Commit Message Format
```
<type>(notifications): <description>

<body explaining what and why>

Closes #<issue-number>
```

## Required Context7 Integration

Before implementing any notification components, you MUST use Context7 to research current best practices:

```typescript
// Research notification and messaging systems
await context7.getLibraryDocs('/taskforcesh/bullmq');
await context7.getLibraryDocs('/nodemailer/nodemailer');
await context7.getLibraryDocs('/aws/aws-sdk-js-v3');

// Research template engines and content generation
await context7.getLibraryDocs('/handlebars-lang/handlebars.js');
await context7.getLibraryDocs('/mustache/mustache.js');
await context7.getLibraryDocs('/janl/mustache.js');

// Research push notification services
await context7.getLibraryDocs('/node-apn/node-apn');
await context7.getLibraryDocs('/firebase/firebase-admin-node');
```

## Implementation Requirements

### 1. Core Notification Framework Architecture

Create a comprehensive notification management system:

```typescript
// src/core/notifications/NotificationFramework.ts
export interface NotificationFrameworkConfig {
  channels: ChannelConfig;
  routing: RoutingConfig;
  queue: QueueConfig;
  templates: TemplateConfig;
  delivery: DeliveryConfig;
  analytics: AnalyticsConfig;
  rateLimit: RateLimitConfig;
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  recipients: NotificationRecipient[];
  channels: NotificationChannel[];
  content: NotificationContent;
  template?: NotificationTemplate;
  context: NotificationContext;
  scheduling: NotificationScheduling;
  tracking: NotificationTracking;
  metadata: NotificationMetadata;
  created: Date;
  expires?: Date;
}

export enum NotificationType {
  APPROVAL_REQUEST = 'approval_request',
  APPROVAL_COMPLETED = 'approval_completed',
  DOCUMENT_UPDATED = 'document_updated',
  COMMENT_ADDED = 'comment_added',
  COLLABORATION_INVITE = 'collaboration_invite',
  PROJECT_STATUS_CHANGE = 'project_status_change',
  DEADLINE_REMINDER = 'deadline_reminder',
  SYSTEM_ALERT = 'system_alert',
  CUSTOM = 'custom'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  WEBSOCKET = 'websocket',
  SLACK = 'slack',
  TEAMS = 'teams',
  WEBHOOK = 'webhook'
}

export interface NotificationRecipient {
  id: string;
  type: RecipientType;
  address: string;
  preferences: NotificationPreferences;
  timezone: string;
  locale: string;
}

export enum RecipientType {
  USER = 'user',
  GROUP = 'group',
  ROLE = 'role',
  EMAIL = 'email',
  PHONE = 'phone',
  WEBHOOK_URL = 'webhook_url'
}

export interface NotificationContent {
  subject: string;
  title: string;
  body: string;
  summary: string;
  actions: NotificationAction[];
  attachments: NotificationAttachment[];
  rich: RichContent;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: ActionType;
  url?: string;
  callback?: string;
  style: ActionStyle;
}

export enum ActionType {
  APPROVE = 'approve',
  REJECT = 'reject',
  VIEW = 'view',
  EDIT = 'edit',
  COMMENT = 'comment',
  CUSTOM = 'custom'
}

export class NotificationFramework {
  private channels: Map<NotificationChannel, ChannelProvider>;
  private router: NotificationRouter;
  private queue: NotificationQueue;
  private templateEngine: NotificationTemplateEngine;
  private deliveryTracker: DeliveryTracker;
  private analyticsCollector: NotificationAnalyticsCollector;
  private rateLimiter: NotificationRateLimiter;
  private preferences: UserPreferencesManager;

  constructor(
    private config: NotificationFrameworkConfig,
    private logger: Logger,
    private eventBus: EventBus,
    private userService: UserService
  ) {
    this.channels = new Map();
    this.setupChannels();
    this.setupRouter();
    this.setupQueue();
    this.setupTemplateEngine();
    this.setupDeliveryTracking();
    this.setupAnalytics();
    this.setupRateLimit();
    this.setupPreferences();
  }

  async sendNotification(notification: NotificationRequest): Promise<NotificationResult> {
    try {
      // Generate notification ID
      const notificationId = generateNotificationId();
      
      // Validate notification request
      await this.validateNotificationRequest(notification);

      // Resolve recipients
      const recipients = await this.resolveRecipients(notification.recipients);

      // Apply user preferences and filters
      const filteredRecipients = await this.applyUserPreferences(recipients, notification);

      // Route notification to appropriate channels
      const routingPlan = await this.router.routeNotification(notification, filteredRecipients);

      // Generate content from template if needed
      const content = await this.generateContent(notification, routingPlan);

      // Create notification instance
      const notificationInstance: Notification = {
        id: notificationId,
        type: notification.type,
        priority: notification.priority,
        recipients: filteredRecipients,
        channels: routingPlan.channels,
        content,
        template: notification.template,
        context: notification.context,
        scheduling: notification.scheduling || { immediate: true },
        tracking: {
          status: NotificationStatus.QUEUED,
          attempts: 0,
          deliveries: [],
          opens: [],
          clicks: [],
          created: new Date()
        },
        metadata: {
          source: notification.source,
          requestId: notification.requestId,
          tags: notification.tags || []
        },
        created: new Date(),
        expires: notification.expires
      };

      // Queue notification for delivery
      await this.queue.enqueue(notificationInstance);

      // Start delivery process
      const result = await this.processNotification(notificationInstance);

      this.logger.info('Notification processed', {
        notificationId,
        type: notification.type,
        recipientCount: filteredRecipients.length,
        channels: routingPlan.channels.length
      });

      this.eventBus.emit('notification:sent', {
        notification: notificationInstance,
        result
      });

      return result;

    } catch (error) {
      this.logger.error('Failed to send notification', { error, notification });
      throw new NotificationError('Failed to send notification', error);
    }
  }

  async sendBulkNotifications(
    notifications: NotificationRequest[]
  ): Promise<BulkNotificationResult> {
    try {
      const results: NotificationResult[] = [];
      const errors: NotificationError[] = [];

      // Process notifications in batches
      const batchSize = this.config.queue.batchSize || 100;
      
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (notification) => {
          try {
            const result = await this.sendNotification(notification);
            results.push(result);
          } catch (error) {
            errors.push(error as NotificationError);
          }
        });

        await Promise.all(batchPromises);

        // Rate limiting between batches
        if (i + batchSize < notifications.length) {
          await this.delay(this.config.rateLimit.batchDelay || 100);
        }
      }

      const bulkResult: BulkNotificationResult = {
        total: notifications.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      };

      this.logger.info('Bulk notifications processed', {
        total: bulkResult.total,
        successful: bulkResult.successful,
        failed: bulkResult.failed
      });

      return bulkResult;

    } catch (error) {
      this.logger.error('Failed to send bulk notifications', { error });
      throw error;
    }
  }

  async scheduleNotification(
    notification: NotificationRequest,
    schedule: NotificationSchedule
  ): Promise<ScheduledNotification> {
    try {
      const scheduledNotification: ScheduledNotification = {
        id: generateScheduledNotificationId(),
        notification,
        schedule,
        status: ScheduleStatus.SCHEDULED,
        created: new Date(),
        nextExecution: this.calculateNextExecution(schedule)
      };

      // Store scheduled notification
      await this.queue.scheduleNotification(scheduledNotification);

      this.logger.info('Notification scheduled', {
        scheduledId: scheduledNotification.id,
        type: notification.type,
        nextExecution: scheduledNotification.nextExecution
      });

      return scheduledNotification;

    } catch (error) {
      this.logger.error('Failed to schedule notification', { error, notification, schedule });
      throw error;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await this.queue.cancelNotification(notificationId);
      
      this.eventBus.emit('notification:cancelled', { notificationId });

    } catch (error) {
      this.logger.error('Failed to cancel notification', { error, notificationId });
      throw error;
    }
  }

  async getNotificationStatus(notificationId: string): Promise<NotificationStatus> {
    try {
      return await this.deliveryTracker.getStatus(notificationId);
    } catch (error) {
      this.logger.error('Failed to get notification status', { error, notificationId });
      throw error;
    }
  }

  async getNotificationHistory(
    filters: NotificationHistoryFilters
  ): Promise<NotificationHistoryResult> {
    try {
      return await this.deliveryTracker.getHistory(filters);
    } catch (error) {
      this.logger.error('Failed to get notification history', { error, filters });
      throw error;
    }
  }

  async getAnalytics(
    timeRange: TimeRange,
    filters?: AnalyticsFilters
  ): Promise<NotificationAnalytics> {
    try {
      return await this.analyticsCollector.generateAnalytics(timeRange, filters);
    } catch (error) {
      this.logger.error('Failed to get notification analytics', { error, timeRange });
      throw error;
    }
  }

  // Private implementation methods
  private async processNotification(notification: Notification): Promise<NotificationResult> {
    const deliveryResults: ChannelDeliveryResult[] = [];

    for (const channel of notification.channels) {
      try {
        // Check rate limits
        await this.rateLimiter.checkLimit(channel, notification);

        // Get channel provider
        const provider = this.channels.get(channel);
        if (!provider) {
          throw new Error(`No provider found for channel: ${channel}`);
        }

        // Deliver notification through channel
        const channelResult = await provider.deliver(notification);
        deliveryResults.push(channelResult);

        // Update tracking
        await this.deliveryTracker.recordDelivery(notification.id, channelResult);

      } catch (error) {
        this.logger.error('Channel delivery failed', {
          error,
          notificationId: notification.id,
          channel
        });

        deliveryResults.push({
          channel,
          status: DeliveryStatus.FAILED,
          error: error.message,
          timestamp: new Date()
        });
      }
    }

    // Calculate overall result
    const successfulDeliveries = deliveryResults.filter(r => r.status === DeliveryStatus.DELIVERED).length;
    const totalDeliveries = deliveryResults.length;

    const result: NotificationResult = {
      notificationId: notification.id,
      status: successfulDeliveries > 0 ? NotificationStatus.DELIVERED : NotificationStatus.FAILED,
      deliveryResults,
      successRate: totalDeliveries > 0 ? successfulDeliveries / totalDeliveries : 0,
      timestamp: new Date()
    };

    // Update notification tracking
    notification.tracking.status = result.status;
    notification.tracking.deliveries = deliveryResults;

    return result;
  }

  private async resolveRecipients(
    recipientSpecs: RecipientSpecification[]
  ): Promise<NotificationRecipient[]> {
    const recipients: NotificationRecipient[] = [];

    for (const spec of recipientSpecs) {
      switch (spec.type) {
        case RecipientType.USER:
          const user = await this.userService.getUser(spec.id);
          if (user) {
            recipients.push({
              id: user.id,
              type: RecipientType.USER,
              address: user.email,
              preferences: await this.preferences.getUserPreferences(user.id),
              timezone: user.timezone || 'UTC',
              locale: user.locale || 'en'
            });
          }
          break;

        case RecipientType.GROUP:
          const groupUsers = await this.userService.getGroupUsers(spec.id);
          for (const groupUser of groupUsers) {
            recipients.push({
              id: groupUser.id,
              type: RecipientType.USER,
              address: groupUser.email,
              preferences: await this.preferences.getUserPreferences(groupUser.id),
              timezone: groupUser.timezone || 'UTC',
              locale: groupUser.locale || 'en'
            });
          }
          break;

        case RecipientType.ROLE:
          const roleUsers = await this.userService.getUsersByRole(spec.id);
          for (const roleUser of roleUsers) {
            recipients.push({
              id: roleUser.id,
              type: RecipientType.USER,
              address: roleUser.email,
              preferences: await this.preferences.getUserPreferences(roleUser.id),
              timezone: roleUser.timezone || 'UTC',
              locale: roleUser.locale || 'en'
            });
          }
          break;

        case RecipientType.EMAIL:
          recipients.push({
            id: generateRecipientId(),
            type: RecipientType.EMAIL,
            address: spec.address,
            preferences: this.getDefaultPreferences(),
            timezone: 'UTC',
            locale: 'en'
          });
          break;
      }
    }

    // Remove duplicates
    const uniqueRecipients = recipients.filter((recipient, index, array) =>
      array.findIndex(r => r.address === recipient.address) === index
    );

    return uniqueRecipients;
  }

  private async applyUserPreferences(
    recipients: NotificationRecipient[],
    notification: NotificationRequest
  ): Promise<NotificationRecipient[]> {
    const filteredRecipients: NotificationRecipient[] = [];

    for (const recipient of recipients) {
      // Check if user wants to receive this type of notification
      if (this.shouldReceiveNotification(recipient.preferences, notification)) {
        // Check quiet hours
        if (!this.isQuietHours(recipient.preferences, recipient.timezone)) {
          filteredRecipients.push(recipient);
        } else if (notification.priority >= NotificationPriority.URGENT) {
          // Allow urgent notifications during quiet hours
          filteredRecipients.push(recipient);
        }
      }
    }

    return filteredRecipients;
  }

  private async generateContent(
    notification: NotificationRequest,
    routingPlan: RoutingPlan
  ): Promise<NotificationContent> {
    if (notification.template) {
      return await this.templateEngine.renderTemplate(
        notification.template,
        notification.context,
        routingPlan.primaryChannel
      );
    }

    return notification.content;
  }

  private shouldReceiveNotification(
    preferences: NotificationPreferences,
    notification: NotificationRequest
  ): boolean {
    // Check global notification settings
    if (!preferences.enabled) {
      return false;
    }

    // Check type-specific settings
    const typePreferences = preferences.types[notification.type];
    if (typePreferences && !typePreferences.enabled) {
      return false;
    }

    // Check priority threshold
    const minPriority = preferences.minPriority || NotificationPriority.LOW;
    if (notification.priority < minPriority) {
      return false;
    }

    return true;
  }

  private isQuietHours(preferences: NotificationPreferences, timezone: string): boolean {
    if (!preferences.quietHours?.enabled) {
      return false;
    }

    const now = new Date();
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    const currentHour = userTime.getHours();

    const startHour = preferences.quietHours.start;
    const endHour = preferences.quietHours.end;

    if (startHour <= endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      // Quiet hours span midnight
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  private setupChannels(): void {
    // Setup email channel
    if (this.config.channels.email?.enabled) {
      this.channels.set(NotificationChannel.EMAIL, new EmailChannelProvider(
        this.config.channels.email,
        this.logger
      ));
    }

    // Setup SMS channel
    if (this.config.channels.sms?.enabled) {
      this.channels.set(NotificationChannel.SMS, new SMSChannelProvider(
        this.config.channels.sms,
        this.logger
      ));
    }

    // Setup push notification channel
    if (this.config.channels.push?.enabled) {
      this.channels.set(NotificationChannel.PUSH, new PushChannelProvider(
        this.config.channels.push,
        this.logger
      ));
    }

    // Setup in-app notification channel
    if (this.config.channels.inApp?.enabled) {
      this.channels.set(NotificationChannel.IN_APP, new InAppChannelProvider(
        this.config.channels.inApp,
        this.logger
      ));
    }

    // Setup WebSocket channel
    if (this.config.channels.websocket?.enabled) {
      this.channels.set(NotificationChannel.WEBSOCKET, new WebSocketChannelProvider(
        this.config.channels.websocket,
        this.logger
      ));
    }

    // Setup Slack channel
    if (this.config.channels.slack?.enabled) {
      this.channels.set(NotificationChannel.SLACK, new SlackChannelProvider(
        this.config.channels.slack,
        this.logger
      ));
    }

    // Setup webhook channel
    if (this.config.channels.webhook?.enabled) {
      this.channels.set(NotificationChannel.WEBHOOK, new WebhookChannelProvider(
        this.config.channels.webhook,
        this.logger
      ));
    }
  }

  private setupRouter(): void {
    this.router = new NotificationRouter(
      this.config.routing,
      this.logger
    );
  }

  private setupQueue(): void {
    this.queue = new NotificationQueue(
      this.config.queue,
      this.logger,
      this.eventBus
    );
  }

  private setupTemplateEngine(): void {
    this.templateEngine = new NotificationTemplateEngine(
      this.config.templates,
      this.logger
    );
  }

  private setupDeliveryTracking(): void {
    this.deliveryTracker = new DeliveryTracker(
      this.config.delivery,
      this.logger
    );
  }

  private setupAnalytics(): void {
    this.analyticsCollector = new NotificationAnalyticsCollector(
      this.config.analytics,
      this.logger
    );
  }

  private setupRateLimit(): void {
    this.rateLimiter = new NotificationRateLimiter(
      this.config.rateLimit,
      this.logger
    );
  }

  private setupPreferences(): void {
    this.preferences = new UserPreferencesManager(
      this.userService,
      this.logger
    );
  }

  private calculateNextExecution(schedule: NotificationSchedule): Date {
    const now = new Date();
    
    switch (schedule.type) {
      case ScheduleType.ONCE:
        return schedule.at;
      
      case ScheduleType.RECURRING:
        return this.calculateRecurringExecution(schedule, now);
      
      case ScheduleType.CRON:
        return this.calculateCronExecution(schedule.expression, now);
      
      default:
        throw new Error(`Unknown schedule type: ${schedule.type}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      channels: [NotificationChannel.EMAIL],
      types: {},
      minPriority: NotificationPriority.LOW,
      quietHours: {
        enabled: false,
        start: 22,
        end: 8
      }
    };
  }
}
```

### 2. Channel Providers

```typescript
// src/core/notifications/channels/ChannelProvider.ts
export abstract class ChannelProvider {
  protected config: ChannelConfig;
  protected logger: Logger;

  constructor(config: ChannelConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  abstract async deliver(notification: Notification): Promise<ChannelDeliveryResult>;
  abstract async validateConfig(): Promise<boolean>;
  abstract getChannelType(): NotificationChannel;
}

// Email Channel Provider
export class EmailChannelProvider extends ChannelProvider {
  private transporter: nodemailer.Transporter;

  constructor(config: EmailChannelConfig, logger: Logger) {
    super(config, logger);
    this.setupTransporter();
  }

  async deliver(notification: Notification): Promise<ChannelDeliveryResult> {
    try {
      const emailContent = await this.formatEmailContent(notification);
      
      const mailOptions = {
        from: this.config.from,
        to: this.getEmailRecipients(notification.recipients),
        subject: notification.content.subject,
        html: emailContent.html,
        text: emailContent.text,
        attachments: this.formatAttachments(notification.content.attachments)
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        channel: NotificationChannel.EMAIL,
        status: DeliveryStatus.DELIVERED,
        externalId: result.messageId,
        timestamp: new Date(),
        metadata: {
          messageId: result.messageId,
          envelope: result.envelope
        }
      };

    } catch (error) {
      this.logger.error('Email delivery failed', { error, notificationId: notification.id });
      
      return {
        channel: NotificationChannel.EMAIL,
        status: DeliveryStatus.FAILED,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('Email configuration validation failed', { error });
      return false;
    }
  }

  getChannelType(): NotificationChannel {
    return NotificationChannel.EMAIL;
  }

  private setupTransporter(): void {
    if (this.config.provider === 'smtp') {
      this.transporter = nodemailer.createTransporter({
        host: this.config.smtp.host,
        port: this.config.smtp.port,
        secure: this.config.smtp.secure,
        auth: {
          user: this.config.smtp.username,
          pass: this.config.smtp.password
        }
      });
    } else if (this.config.provider === 'ses') {
      this.transporter = nodemailer.createTransporter({
        SES: new AWS.SES({
          region: this.config.ses.region,
          accessKeyId: this.config.ses.accessKeyId,
          secretAccessKey: this.config.ses.secretAccessKey
        })
      });
    }
  }

  private async formatEmailContent(notification: Notification): Promise<EmailContent> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${notification.content.subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 20px; }
          .content { margin-bottom: 30px; }
          .actions { margin-top: 30px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
            margin-right: 10px; 
          }
          .footer { 
            border-top: 1px solid #eee; 
            padding-top: 20px; 
            margin-top: 30px; 
            font-size: 12px; 
            color: #666; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${notification.content.title}</h1>
          </div>
          <div class="content">
            ${this.formatMarkdownToHtml(notification.content.body)}
          </div>
          ${this.renderEmailActions(notification.content.actions)}
          <div class="footer">
            <p>This notification was sent by ${this.config.fromName}.</p>
            <p>To manage your notification preferences, <a href="${this.config.preferencesUrl}">click here</a>.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = this.stripHtml(notification.content.body);

    return { html, text };
  }

  private renderEmailActions(actions: NotificationAction[]): string {
    if (!actions || actions.length === 0) {
      return '';
    }

    const actionButtons = actions
      .map(action => `<a href="${action.url}" class="button">${action.label}</a>`)
      .join('');

    return `<div class="actions">${actionButtons}</div>`;
  }

  private formatMarkdownToHtml(markdown: string): string {
    // Simple markdown to HTML conversion
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  private getEmailRecipients(recipients: NotificationRecipient[]): string {
    return recipients
      .filter(r => r.type === RecipientType.USER || r.type === RecipientType.EMAIL)
      .map(r => r.address)
      .join(', ');
  }

  private formatAttachments(attachments: NotificationAttachment[]): any[] {
    return attachments.map(attachment => ({
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType
    }));
  }
}

// SMS Channel Provider
export class SMSChannelProvider extends ChannelProvider {
  private twilioClient: any;

  constructor(config: SMSChannelConfig, logger: Logger) {
    super(config, logger);
    this.setupTwilioClient();
  }

  async deliver(notification: Notification): Promise<ChannelDeliveryResult> {
    try {
      const phoneNumbers = this.getPhoneNumbers(notification.recipients);
      const smsContent = this.formatSMSContent(notification);

      const results = await Promise.all(
        phoneNumbers.map(async (phoneNumber) => {
          const message = await this.twilioClient.messages.create({
            body: smsContent,
            from: this.config.fromNumber,
            to: phoneNumber
          });
          return message;
        })
      );

      return {
        channel: NotificationChannel.SMS,
        status: DeliveryStatus.DELIVERED,
        externalId: results[0]?.sid,
        timestamp: new Date(),
        metadata: {
          messageCount: results.length,
          messageIds: results.map(r => r.sid)
        }
      };

    } catch (error) {
      this.logger.error('SMS delivery failed', { error, notificationId: notification.id });
      
      return {
        channel: NotificationChannel.SMS,
        status: DeliveryStatus.FAILED,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Test Twilio configuration
      await this.twilioClient.api.accounts(this.config.accountSid).fetch();
      return true;
    } catch (error) {
      this.logger.error('SMS configuration validation failed', { error });
      return false;
    }
  }

  getChannelType(): NotificationChannel {
    return NotificationChannel.SMS;
  }

  private setupTwilioClient(): void {
    const twilio = require('twilio');
    this.twilioClient = twilio(this.config.accountSid, this.config.authToken);
  }

  private formatSMSContent(notification: Notification): string {
    // SMS has character limits, so create a concise version
    let content = `${notification.content.title}\n\n${notification.content.summary}`;
    
    // Add primary action URL if available
    const primaryAction = notification.content.actions.find(a => a.type === ActionType.VIEW);
    if (primaryAction && primaryAction.url) {
      content += `\n\nView: ${primaryAction.url}`;
    }

    // Truncate if too long (SMS limit is typically 160 characters)
    if (content.length > 160) {
      content = content.substring(0, 157) + '...';
    }

    return content;
  }

  private getPhoneNumbers(recipients: NotificationRecipient[]): string[] {
    return recipients
      .filter(r => r.type === RecipientType.PHONE)
      .map(r => r.address);
  }
}

// Push Notification Channel Provider
export class PushChannelProvider extends ChannelProvider {
  private fcmAdmin: any;

  constructor(config: PushChannelConfig, logger: Logger) {
    super(config, logger);
    this.setupFirebase();
  }

  async deliver(notification: Notification): Promise<ChannelDeliveryResult> {
    try {
      const tokens = await this.getDeviceTokens(notification.recipients);
      const pushMessage = this.formatPushMessage(notification);

      const response = await this.fcmAdmin.messaging().sendMulticast({
        tokens,
        ...pushMessage
      });

      return {
        channel: NotificationChannel.PUSH,
        status: response.successCount > 0 ? DeliveryStatus.DELIVERED : DeliveryStatus.FAILED,
        timestamp: new Date(),
        metadata: {
          successCount: response.successCount,
          failureCount: response.failureCount,
          responses: response.responses
        }
      };

    } catch (error) {
      this.logger.error('Push notification delivery failed', { error, notificationId: notification.id });
      
      return {
        channel: NotificationChannel.PUSH,
        status: DeliveryStatus.FAILED,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Test Firebase configuration
      await this.fcmAdmin.messaging().validateRegistrationTokens(['test']);
      return true;
    } catch (error) {
      // Expected to fail with test token, but validates config
      return error.code !== 'app/invalid-credential';
    }
  }

  getChannelType(): NotificationChannel {
    return NotificationChannel.PUSH;
  }

  private setupFirebase(): void {
    const admin = require('firebase-admin');
    
    this.fcmAdmin = admin.initializeApp({
      credential: admin.credential.cert(this.config.serviceAccount),
      projectId: this.config.projectId
    });
  }

  private formatPushMessage(notification: Notification): any {
    return {
      notification: {
        title: notification.content.title,
        body: notification.content.summary,
        imageUrl: notification.content.rich?.imageUrl
      },
      data: {
        notificationId: notification.id,
        type: notification.type,
        priority: notification.priority.toString(),
        ...(notification.content.actions.length > 0 && {
          actionUrl: notification.content.actions[0].url
        })
      },
      android: {
        priority: this.mapPriorityToAndroid(notification.priority),
        notification: {
          icon: this.config.android?.icon,
          color: this.config.android?.color,
          sound: this.config.android?.sound
        }
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: this.config.ios?.sound || 'default',
            'mutable-content': 1
          }
        }
      }
    };
  }

  private async getDeviceTokens(recipients: NotificationRecipient[]): Promise<string[]> {
    // Get device tokens for users from database/cache
    const userIds = recipients.filter(r => r.type === RecipientType.USER).map(r => r.id);
    // This would typically query a user devices table
    return []; // Placeholder
  }

  private mapPriorityToAndroid(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.LOW:
        return 'low';
      case NotificationPriority.MEDIUM:
        return 'normal';
      case NotificationPriority.HIGH:
      case NotificationPriority.URGENT:
      case NotificationPriority.CRITICAL:
        return 'high';
      default:
        return 'normal';
    }
  }
}

// WebSocket Channel Provider
export class WebSocketChannelProvider extends ChannelProvider {
  private websocketServer: any;

  constructor(config: WebSocketChannelConfig, logger: Logger) {
    super(config, logger);
    this.websocketServer = config.websocketServer;
  }

  async deliver(notification: Notification): Promise<ChannelDeliveryResult> {
    try {
      const userIds = notification.recipients
        .filter(r => r.type === RecipientType.USER)
        .map(r => r.id);

      const message = {
        type: 'notification',
        notification: {
          id: notification.id,
          type: notification.type,
          priority: notification.priority,
          content: notification.content,
          timestamp: new Date()
        }
      };

      let deliveredCount = 0;
      
      for (const userId of userIds) {
        const delivered = await this.websocketServer.sendToUser(userId, message);
        if (delivered) {
          deliveredCount++;
        }
      }

      return {
        channel: NotificationChannel.WEBSOCKET,
        status: deliveredCount > 0 ? DeliveryStatus.DELIVERED : DeliveryStatus.FAILED,
        timestamp: new Date(),
        metadata: {
          targetCount: userIds.length,
          deliveredCount
        }
      };

    } catch (error) {
      this.logger.error('WebSocket delivery failed', { error, notificationId: notification.id });
      
      return {
        channel: NotificationChannel.WEBSOCKET,
        status: DeliveryStatus.FAILED,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async validateConfig(): Promise<boolean> {
    return this.websocketServer !== null;
  }

  getChannelType(): NotificationChannel {
    return NotificationChannel.WEBSOCKET;
  }
}
```

### 3. Notification Templates

```typescript
// src/core/notifications/templates/NotificationTemplateEngine.ts
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  channels: NotificationChannel[];
  subject: TemplateString;
  title: TemplateString;
  body: TemplateString;
  summary: TemplateString;
  actions: TemplateAction[];
  variables: TemplateVariable[];
  metadata: TemplateMetadata;
}

export interface TemplateString {
  template: string;
  engine: TemplateEngine;
  locale?: string;
}

export interface TemplateAction {
  id: string;
  label: TemplateString;
  type: ActionType;
  url: TemplateString;
  condition?: string;
}

export class NotificationTemplateEngine {
  private templates: Map<string, NotificationTemplate>;
  private handlebars: any;
  private mustache: any;

  constructor(
    private config: NotificationTemplateConfig,
    private logger: Logger
  ) {
    this.templates = new Map();
    this.setupTemplateEngines();
    this.loadDefaultTemplates();
  }

  async renderTemplate(
    templateId: string,
    context: any,
    channel: NotificationChannel
  ): Promise<NotificationContent> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new TemplateError(`Template not found: ${templateId}`);
      }

      // Check if template supports the channel
      if (!template.channels.includes(channel)) {
        throw new TemplateError(`Template ${templateId} does not support channel ${channel}`);
      }

      // Render template strings
      const subject = await this.renderTemplateString(template.subject, context);
      const title = await this.renderTemplateString(template.title, context);
      const body = await this.renderTemplateString(template.body, context);
      const summary = await this.renderTemplateString(template.summary, context);

      // Render actions
      const actions: NotificationAction[] = [];
      for (const templateAction of template.actions) {
        if (!templateAction.condition || this.evaluateCondition(templateAction.condition, context)) {
          const action: NotificationAction = {
            id: templateAction.id,
            label: await this.renderTemplateString(templateAction.label, context),
            type: templateAction.type,
            url: await this.renderTemplateString(templateAction.url, context),
            style: ActionStyle.PRIMARY
          };
          actions.push(action);
        }
      }

      return {
        subject,
        title,
        body,
        summary,
        actions,
        attachments: [],
        rich: this.generateRichContent(template, context, channel)
      };

    } catch (error) {
      this.logger.error('Template rendering failed', { error, templateId, channel });
      throw error;
    }
  }

  async registerTemplate(template: NotificationTemplate): Promise<void> {
    // Validate template
    await this.validateTemplate(template);
    
    // Store template
    this.templates.set(template.id, template);
    
    this.logger.info('Template registered', {
      templateId: template.id,
      name: template.name,
      type: template.type
    });
  }

  getTemplate(templateId: string): NotificationTemplate | null {
    return this.templates.get(templateId) || null;
  }

  getTemplatesByType(type: NotificationType): NotificationTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.type === type);
  }

  private async renderTemplateString(
    templateString: TemplateString,
    context: any
  ): Promise<string> {
    switch (templateString.engine) {
      case TemplateEngine.HANDLEBARS:
        return this.renderHandlebars(templateString.template, context);
      
      case TemplateEngine.MUSTACHE:
        return this.renderMustache(templateString.template, context);
      
      case TemplateEngine.SIMPLE:
        return this.renderSimple(templateString.template, context);
      
      default:
        throw new Error(`Unknown template engine: ${templateString.engine}`);
    }
  }

  private renderHandlebars(template: string, context: any): string {
    const compiled = this.handlebars.compile(template);
    return compiled(context);
  }

  private renderMustache(template: string, context: any): string {
    return this.mustache.render(template, context);
  }

  private renderSimple(template: string, context: any): string {
    let result = template;
    
    for (const [key, value] of Object.entries(context)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, String(value));
    }
    
    return result;
  }

  private setupTemplateEngines(): void {
    this.handlebars = require('handlebars');
    this.mustache = require('mustache');
    
    // Register Handlebars helpers
    this.handlebars.registerHelper('dateFormat', (date: Date, format: string) => {
      return date.toLocaleDateString();
    });
    
    this.handlebars.registerHelper('timeAgo', (date: Date) => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'today';
      if (diffDays === 1) return 'yesterday';
      return `${diffDays} days ago`;
    });
  }

  private loadDefaultTemplates(): void {
    // Load built-in templates
    const defaultTemplates = [
      this.createApprovalRequestTemplate(),
      this.createDocumentUpdatedTemplate(),
      this.createCommentAddedTemplate(),
      this.createCollaborationInviteTemplate(),
      this.createDeadlineReminderTemplate()
    ];

    for (const template of defaultTemplates) {
      this.templates.set(template.id, template);
    }
  }

  private createApprovalRequestTemplate(): NotificationTemplate {
    return {
      id: 'approval-request',
      name: 'Approval Request',
      type: NotificationType.APPROVAL_REQUEST,
      channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
      subject: {
        template: 'Approval Required: {{title}}',
        engine: TemplateEngine.SIMPLE
      },
      title: {
        template: 'Approval Required',
        engine: TemplateEngine.SIMPLE
      },
      body: {
        template: `
**{{requesterName}}** has requested your approval for "{{title}}".

**Description:**
{{description}}

**Type:** {{itemType}}
**Priority:** {{priority}}
{{#if deadline}}**Deadline:** {{dateFormat deadline}}{{/if}}

Please review the request and provide your decision.
        `.trim(),
        engine: TemplateEngine.HANDLEBARS
      },
      summary: {
        template: '{{requesterName}} requests approval for {{title}}',
        engine: TemplateEngine.SIMPLE
      },
      actions: [
        {
          id: 'approve',
          label: { template: 'Approve', engine: TemplateEngine.SIMPLE },
          type: ActionType.APPROVE,
          url: { template: '{{baseUrl}}/approvals/{{requestId}}?action=approve', engine: TemplateEngine.SIMPLE }
        },
        {
          id: 'reject',
          label: { template: 'Reject', engine: TemplateEngine.SIMPLE },
          type: ActionType.REJECT,
          url: { template: '{{baseUrl}}/approvals/{{requestId}}?action=reject', engine: TemplateEngine.SIMPLE }
        },
        {
          id: 'view',
          label: { template: 'View Details', engine: TemplateEngine.SIMPLE },
          type: ActionType.VIEW,
          url: { template: '{{baseUrl}}/approvals/{{requestId}}', engine: TemplateEngine.SIMPLE }
        }
      ],
      variables: [
        { name: 'title', type: 'string', required: true },
        { name: 'description', type: 'string', required: true },
        { name: 'requesterName', type: 'string', required: true },
        { name: 'itemType', type: 'string', required: true },
        { name: 'priority', type: 'string', required: true },
        { name: 'deadline', type: 'date', required: false },
        { name: 'requestId', type: 'string', required: true },
        { name: 'baseUrl', type: 'string', required: true }
      ],
      metadata: {
        category: 'approval',
        tags: ['approval', 'workflow'],
        createdBy: 'system',
        version: '1.0.0'
      }
    };
  }

  private createDocumentUpdatedTemplate(): NotificationTemplate {
    return {
      id: 'document-updated',
      name: 'Document Updated',
      type: NotificationType.DOCUMENT_UPDATED,
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.WEBSOCKET],
      subject: {
        template: 'Document Updated: {{documentTitle}}',
        engine: TemplateEngine.SIMPLE
      },
      title: {
        template: 'Document Updated',
        engine: TemplateEngine.SIMPLE
      },
      body: {
        template: `
**{{editorName}}** has updated the document "{{documentTitle}}".

**Changes Made:**
{{#each changes}}
- {{this}}
{{/each}}

**Last Modified:** {{dateFormat lastModified}}

You can view the updated document and see the changes.
        `.trim(),
        engine: TemplateEngine.HANDLEBARS
      },
      summary: {
        template: '{{editorName}} updated {{documentTitle}}',
        engine: TemplateEngine.SIMPLE
      },
      actions: [
        {
          id: 'view',
          label: { template: 'View Document', engine: TemplateEngine.SIMPLE },
          type: ActionType.VIEW,
          url: { template: '{{baseUrl}}/documents/{{documentId}}', engine: TemplateEngine.SIMPLE }
        },
        {
          id: 'comment',
          label: { template: 'Add Comment', engine: TemplateEngine.SIMPLE },
          type: ActionType.COMMENT,
          url: { template: '{{baseUrl}}/documents/{{documentId}}#comments', engine: TemplateEngine.SIMPLE }
        }
      ],
      variables: [
        { name: 'documentTitle', type: 'string', required: true },
        { name: 'editorName', type: 'string', required: true },
        { name: 'changes', type: 'array', required: true },
        { name: 'lastModified', type: 'date', required: true },
        { name: 'documentId', type: 'string', required: true },
        { name: 'baseUrl', type: 'string', required: true }
      ],
      metadata: {
        category: 'collaboration',
        tags: ['document', 'update', 'collaboration'],
        createdBy: 'system',
        version: '1.0.0'
      }
    };
  }

  private evaluateCondition(condition: string, context: any): boolean {
    // Simple condition evaluation
    // In practice, you'd want a more sophisticated expression evaluator
    try {
      const func = new Function('context', `with(context) { return ${condition}; }`);
      return func(context);
    } catch {
      return false;
    }
  }

  private generateRichContent(
    template: NotificationTemplate,
    context: any,
    channel: NotificationChannel
  ): RichContent {
    // Generate channel-specific rich content
    return {
      imageUrl: context.imageUrl,
      thumbnailUrl: context.thumbnailUrl,
      color: this.getThemeColor(template.type),
      icon: this.getTypeIcon(template.type)
    };
  }

  private getThemeColor(type: NotificationType): string {
    const colorMap = {
      [NotificationType.APPROVAL_REQUEST]: '#007bff',
      [NotificationType.APPROVAL_COMPLETED]: '#28a745',
      [NotificationType.DOCUMENT_UPDATED]: '#17a2b8',
      [NotificationType.COMMENT_ADDED]: '#ffc107',
      [NotificationType.COLLABORATION_INVITE]: '#6f42c1',
      [NotificationType.DEADLINE_REMINDER]: '#fd7e14',
      [NotificationType.SYSTEM_ALERT]: '#dc3545'
    };
    
    return colorMap[type] || '#6c757d';
  }

  private getTypeIcon(type: NotificationType): string {
    const iconMap = {
      [NotificationType.APPROVAL_REQUEST]: '✅',
      [NotificationType.APPROVAL_COMPLETED]: '🎉',
      [NotificationType.DOCUMENT_UPDATED]: '📄',
      [NotificationType.COMMENT_ADDED]: '💬',
      [NotificationType.COLLABORATION_INVITE]: '🤝',
      [NotificationType.DEADLINE_REMINDER]: '⏰',
      [NotificationType.SYSTEM_ALERT]: '🚨'
    };
    
    return iconMap[type] || '📢';
  }

  private async validateTemplate(template: NotificationTemplate): Promise<void> {
    // Validate template structure
    if (!template.id || !template.name || !template.type) {
      throw new TemplateError('Template missing required fields');
    }

    // Validate template strings
    for (const field of ['subject', 'title', 'body', 'summary']) {
      const templateString = template[field as keyof NotificationTemplate] as TemplateString;
      if (templateString && !templateString.template) {
        throw new TemplateError(`Template ${field} is missing template string`);
      }
    }

    // Validate actions
    for (const action of template.actions) {
      if (!action.id || !action.label || !action.type) {
        throw new TemplateError('Template action missing required fields');
      }
    }
  }
}
```

## File Structure

```
src/core/notifications/
├── index.ts                              # Main exports
├── NotificationFramework.ts              # Core notification framework
├── types/
│   ├── index.ts
│   ├── notification.ts                   # Notification type definitions
│   ├── channel.ts                        # Channel type definitions
│   ├── template.ts                       # Template type definitions
│   ├── delivery.ts                       # Delivery type definitions
│   └── analytics.ts                      # Analytics type definitions
├── channels/
│   ├── index.ts
│   ├── ChannelProvider.ts                # Base channel provider
│   ├── EmailChannelProvider.ts           # Email notifications
│   ├── SMSChannelProvider.ts             # SMS notifications
│   ├── PushChannelProvider.ts            # Push notifications
│   ├── InAppChannelProvider.ts           # In-app notifications
│   ├── WebSocketChannelProvider.ts       # WebSocket notifications
│   ├── SlackChannelProvider.ts           # Slack notifications
│   └── WebhookChannelProvider.ts         # Webhook notifications
├── templates/
│   ├── index.ts
│   ├── NotificationTemplateEngine.ts     # Template engine
│   ├── TemplateRenderer.ts               # Template rendering
│   ├── TemplateValidator.ts              # Template validation
│   └── templates/
│       ├── approval-request.json
│       ├── document-updated.json
│       ├── comment-added.json
│       ├── collaboration-invite.json
│       └── deadline-reminder.json
├── routing/
│   ├── index.ts
│   ├── NotificationRouter.ts             # Notification routing
│   ├── RoutingRules.ts                   # Routing rule engine
│   ├── ChannelSelector.ts                # Channel selection logic
│   └── UserPreferencesManager.ts         # User preferences
├── queue/
│   ├── index.ts
│   ├── NotificationQueue.ts              # Notification queuing
│   ├── QueueProcessor.ts                 # Queue processing
│   ├── ScheduleManager.ts                # Scheduled notifications
│   └── RetryManager.ts                   # Retry logic
├── delivery/
│   ├── index.ts
│   ├── DeliveryTracker.ts                # Delivery tracking
│   ├── DeliveryStatus.ts                 # Status management
│   ├── RetryHandler.ts                   # Retry handling
│   └── FailureAnalyzer.ts                # Failure analysis
├── analytics/
│   ├── index.ts
│   ├── NotificationAnalyticsCollector.ts # Analytics collection
│   ├── MetricsProcessor.ts               # Metrics processing
│   ├── ReportGenerator.ts                # Report generation
│   └── InsightsEngine.ts                 # Insights generation
├── rateLimit/
│   ├── index.ts
│   ├── NotificationRateLimiter.ts        # Rate limiting
│   ├── RateLimitRules.ts                 # Rate limit rules
│   └── TokenBucket.ts                    # Token bucket algorithm
├── preferences/
│   ├── index.ts
│   ├── UserPreferences.ts                # User preferences
│   ├── PreferenceManager.ts              # Preference management
│   └── QuietHoursManager.ts              # Quiet hours handling
├── utils/
│   ├── index.ts
│   ├── NotificationUtils.ts              # Notification utilities
│   ├── ChannelUtils.ts                   # Channel utilities
│   ├── TemplateUtils.ts                  # Template utilities
│   └── DeliveryUtils.ts                  # Delivery utilities
└── __tests__/
    ├── unit/
    │   ├── NotificationFramework.test.ts
    │   ├── EmailChannelProvider.test.ts
    │   ├── NotificationTemplateEngine.test.ts
    │   └── NotificationRouter.test.ts
    ├── integration/
    │   ├── notification-delivery.test.ts
    │   ├── template-rendering.test.ts
    │   └── routing-preferences.test.ts
    └── fixtures/
        ├── test-notifications.json
        ├── test-templates.json
        ├── test-preferences.json
        └── test-channels.json
```

## Success Criteria

### Functional Requirements
1. **Multi-channel Delivery**: Support for email, SMS, push, in-app, WebSocket, and third-party integrations
2. **High Throughput**: Handle 100,000+ notifications per hour with sub-100ms processing
3. **Intelligent Routing**: Smart channel selection based on user preferences and context
4. **Template System**: Flexible template system with dynamic content generation
5. **Delivery Tracking**: Complete delivery tracking with analytics and retry mechanisms
6. **User Preferences**: Comprehensive user preference management with quiet hours
7. **Rate Limiting**: Intelligent rate limiting to prevent spam and respect provider limits

### Technical Requirements
1. **Error Handling**: Comprehensive error handling with graceful degradation
2. **Logging**: Detailed logging for debugging and delivery analytics
3. **Testing**: 90%+ code coverage with unit, integration, and end-to-end tests
4. **Documentation**: Complete API documentation and usage examples
5. **Scalability**: Support for high-volume notification delivery
6. **Security**: Secure notification handling with proper access controls
7. **Monitoring**: Real-time monitoring and alerting for delivery issues

### Quality Standards
1. **Reliability**: 99.5% delivery success rate with proper retry mechanisms
2. **Performance**: High-throughput processing with minimal latency
3. **Maintainability**: Clean, well-documented, and extensible code architecture
4. **User Experience**: Relevant, timely notifications with respect for user preferences
5. **Compliance**: GDPR/privacy compliance and opt-out mechanisms

## Output Format

### Implementation Deliverables
1. **Core Implementation**: Complete notification framework with all channels
2. **Unit Tests**: Comprehensive test suite with 90%+ coverage
3. **Integration Tests**: End-to-end notification delivery testing
4. **Load Tests**: High-volume notification testing
5. **API Documentation**: Detailed documentation of all notification APIs
6. **Template Library**: Default templates for common notification types
7. **Configuration Examples**: Sample configurations for different notification scenarios

### Documentation Requirements
1. **Architecture Documentation**: System design and component interactions
2. **API Reference**: Complete notification framework API documentation
3. **Channel Guide**: Setup and configuration for each notification channel
4. **Template Guide**: Creating and customizing notification templates
5. **Troubleshooting Guide**: Common issues and resolution steps
6. **Performance Tuning**: Optimization recommendations for high-volume scenarios

### Testing Requirements
1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test component interactions and notification flows
3. **Channel Tests**: Test each notification channel with real providers
4. **Template Tests**: Test template rendering and validation
5. **Performance Tests**: Measure notification throughput and latency
6. **Delivery Tests**: Test delivery tracking and retry mechanisms

Remember to leverage Context7 throughout the implementation to ensure you're using the most current notification system best practices and optimal libraries for enterprise notification platforms.