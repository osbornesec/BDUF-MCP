# Implementation Prompt 022: Interactive Approval Tools (3.2.2)

## Persona
You are a **Senior UI/UX Engineer** with 10+ years of experience in building interactive web applications, approval interfaces, and enterprise collaboration tools. You specialize in creating intuitive, responsive user interfaces that handle complex workflows while maintaining excellent user experience.

## Context: Interactive BDUF Orchestrator
You are implementing the **Interactive Approval Tools** as part of the Interactive Big Design Up Front (BDUF) Orchestrator. This system enables comprehensive project analysis, architecture generation, and collaborative development workflows through AI-powered automation.

### System Overview
The Interactive BDUF Orchestrator is an enterprise-grade MCP (Model Context Protocol) server that orchestrates comprehensive project analysis and planning. The Interactive Approval Tools you're building will be a core component that:

1. **Provides intuitive approval interfaces** for different approval types and workflows
2. **Enables real-time collaboration** during the approval process
3. **Offers rich document viewing** with commenting and annotation capabilities
4. **Supports mobile-responsive** approval workflows
5. **Integrates with notification systems** for seamless user experience
6. **Provides approval analytics** and progress tracking dashboards

### Technical Context
- **Architecture**: TypeScript-based modular system with enterprise patterns
- **Integration**: Must integrate with Context7 MCP for documentation lookup
- **Scalability**: Handle 100+ concurrent approval sessions
- **Quality**: 90%+ test coverage, comprehensive error handling
- **Performance**: Sub-300ms response times, responsive design for all devices

## Git Workflow Instructions

### Branch Management
```bash
# Create feature branch
git checkout -b feature/interactive-approval-tools

# Regular commits with descriptive messages
git add .
git commit -m "feat(approval-ui): implement interactive approval tools

- Add approval dashboard and workflow interfaces
- Implement document viewer with annotation capabilities
- Create mobile-responsive approval forms
- Add real-time collaboration features
- Implement approval progress tracking"

# Push and create PR
git push origin feature/interactive-approval-tools
```

### Commit Message Format
```
<type>(approval-ui): <description>

<body explaining what and why>

Closes #<issue-number>
```

## Required Context7 Integration

Before implementing any approval UI components, you MUST use Context7 to research current best practices:

```typescript
// Research modern UI frameworks and libraries
await context7.getLibraryDocs('/facebook/react');
await context7.getLibraryDocs('/vuejs/vue');
await context7.getLibraryDocs('/sveltejs/svelte');

// Research component libraries and design systems
await context7.getLibraryDocs('/mui/material-ui');
await context7.getLibraryDocs('/chakra-ui/chakra-ui');
await context7.getLibraryDocs('/ant-design/ant-design');

// Research document viewing and annotation
await context7.getLibraryDocs('/pdfjs-dist/pdfjs-dist');
await context7.getLibraryDocs('/fabricjs/fabric.js');
```

## Implementation Requirements

### 1. Core Approval Interface Architecture

Create a comprehensive approval interface system:

```typescript
// src/interfaces/approval/ApprovalInterface.ts
export interface ApprovalInterfaceProps {
  requestId: string;
  workflowId: string;
  currentUser: User;
  permissions: ApprovalPermission[];
  onApprovalSubmit: (decision: ApprovalDecision) => Promise<void>;
  onCommentAdd: (comment: Comment) => Promise<void>;
  onAnnotationAdd: (annotation: Annotation) => Promise<void>;
}

export interface ApprovalDecision {
  action: ApprovalAction;
  comments: string;
  attachments: File[];
  annotations: Annotation[];
  customFields: Record<string, any>;
  delegateToUserId?: string;
  escalateToUserId?: string;
}

export enum ApprovalAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_CHANGES = 'request_changes',
  DELEGATE = 'delegate',
  ESCALATE = 'escalate',
  ABSTAIN = 'abstain'
}

export interface ApprovalViewerState {
  currentDocument: DocumentMetadata | null;
  annotations: Annotation[];
  comments: Comment[];
  zoomLevel: number;
  viewMode: ViewMode;
  selectedAnnotation: string | null;
  collaborators: CollaboratorPresence[];
}

export enum ViewMode {
  DOCUMENT = 'document',
  COMPARISON = 'comparison',
  SPLIT_VIEW = 'split_view',
  FULL_SCREEN = 'full_screen'
}

export class ApprovalInterface extends React.Component<ApprovalInterfaceProps, ApprovalViewerState> {
  private documentViewer: DocumentViewer;
  private annotationEngine: AnnotationEngine;
  private collaborationEngine: CollaborationEngine;
  private websocketConnection: WebSocket;

  constructor(props: ApprovalInterfaceProps) {
    super(props);
    
    this.state = {
      currentDocument: null,
      annotations: [],
      comments: [],
      zoomLevel: 1.0,
      viewMode: ViewMode.DOCUMENT,
      selectedAnnotation: null,
      collaborators: []
    };

    this.setupComponents();
    this.connectWebSocket();
  }

  componentDidMount(): void {
    this.loadApprovalRequest();
    this.setupKeyboardShortcuts();
  }

  render(): React.ReactElement {
    return (
      <div className="approval-interface">
        <ApprovalHeader
          request={this.state.currentRequest}
          workflow={this.state.currentWorkflow}
          onActionClick={this.handleActionClick}
        />
        
        <div className="approval-content">
          <ApprovalSidebar
            workflow={this.state.currentWorkflow}
            currentStage={this.state.currentStage}
            approvals={this.state.approvals}
            onStageSelect={this.handleStageSelect}
          />
          
          <ApprovalMainView
            document={this.state.currentDocument}
            annotations={this.state.annotations}
            comments={this.state.comments}
            viewMode={this.state.viewMode}
            zoomLevel={this.state.zoomLevel}
            collaborators={this.state.collaborators}
            onAnnotationAdd={this.handleAnnotationAdd}
            onCommentAdd={this.handleCommentAdd}
            onViewModeChange={this.handleViewModeChange}
            onZoomChange={this.handleZoomChange}
          />
          
          <ApprovalActionsPanel
            permissions={this.props.permissions}
            currentStage={this.state.currentStage}
            onApprovalSubmit={this.handleApprovalSubmit}
            onDelegateClick={this.handleDelegateClick}
            onEscalateClick={this.handleEscalateClick}
          />
        </div>
        
        <ApprovalFooter
          progress={this.state.workflowProgress}
          timeRemaining={this.state.timeRemaining}
          lastActivity={this.state.lastActivity}
        />
      </div>
    );
  }

  private async loadApprovalRequest(): Promise<void> {
    try {
      const response = await this.approvalService.getApprovalRequest(this.props.requestId);
      
      this.setState({
        currentRequest: response.request,
        currentWorkflow: response.workflow,
        currentStage: response.currentStage,
        approvals: response.approvals,
        workflowProgress: response.progress
      });

      // Load associated documents
      await this.loadDocuments(response.request.itemId);
      
    } catch (error) {
      this.handleError('Failed to load approval request', error);
    }
  }

  private async loadDocuments(itemId: string): Promise<void> {
    try {
      const documents = await this.documentService.getApprovalDocuments(itemId);
      
      if (documents.length > 0) {
        const primaryDocument = documents[0];
        await this.documentViewer.loadDocument(primaryDocument);
        
        this.setState({
          currentDocument: primaryDocument,
          availableDocuments: documents
        });
        
        // Load existing annotations and comments
        await this.loadAnnotationsAndComments(primaryDocument.id);
      }
      
    } catch (error) {
      this.handleError('Failed to load documents', error);
    }
  }

  private async handleApprovalSubmit(decision: ApprovalDecision): Promise<void> {
    try {
      // Validate decision
      this.validateApprovalDecision(decision);
      
      // Show confirmation dialog
      const confirmed = await this.showConfirmationDialog(decision);
      if (!confirmed) return;

      // Submit approval
      await this.props.onApprovalSubmit(decision);
      
      // Show success message
      this.showSuccessMessage('Approval submitted successfully');
      
      // Refresh data
      await this.loadApprovalRequest();
      
    } catch (error) {
      this.handleError('Failed to submit approval', error);
    }
  }

  private async handleAnnotationAdd(annotation: Annotation): Promise<void> {
    try {
      // Add annotation to document
      await this.annotationEngine.addAnnotation(annotation);
      
      // Update state
      this.setState(prevState => ({
        annotations: [...prevState.annotations, annotation]
      }));
      
      // Notify collaborators
      this.collaborationEngine.broadcastAnnotation(annotation);
      
      // Call parent handler
      await this.props.onAnnotationAdd(annotation);
      
    } catch (error) {
      this.handleError('Failed to add annotation', error);
    }
  }

  private setupComponents(): void {
    this.documentViewer = new DocumentViewer({
      container: this.documentViewerRef.current,
      enableAnnotations: true,
      enableCollaboration: true,
      onAnnotationSelect: this.handleAnnotationSelect,
      onDocumentClick: this.handleDocumentClick
    });

    this.annotationEngine = new AnnotationEngine({
      documentViewer: this.documentViewer,
      onAnnotationCreate: this.handleAnnotationCreate,
      onAnnotationUpdate: this.handleAnnotationUpdate,
      onAnnotationDelete: this.handleAnnotationDelete
    });

    this.collaborationEngine = new CollaborationEngine({
      requestId: this.props.requestId,
      userId: this.props.currentUser.id,
      onCollaboratorJoin: this.handleCollaboratorJoin,
      onCollaboratorLeave: this.handleCollaboratorLeave,
      onCursorMove: this.handleCursorMove
    });
  }

  private connectWebSocket(): void {
    this.websocketConnection = new WebSocket(this.getWebSocketUrl());
    
    this.websocketConnection.onopen = () => {
      this.joinApprovalSession();
    };
    
    this.websocketConnection.onmessage = (event) => {
      this.handleWebSocketMessage(JSON.parse(event.data));
    };
    
    this.websocketConnection.onclose = () => {
      this.handleWebSocketClose();
    };
  }

  private handleWebSocketMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'approval_submitted':
        this.handleRemoteApprovalSubmitted(message.data);
        break;
        
      case 'annotation_added':
        this.handleRemoteAnnotationAdded(message.data);
        break;
        
      case 'comment_added':
        this.handleRemoteCommentAdded(message.data);
        break;
        
      case 'collaborator_cursor':
        this.handleRemoteCollaboratorCursor(message.data);
        break;
        
      case 'stage_completed':
        this.handleStageCompleted(message.data);
        break;
    }
  }
}
```

### 2. Document Viewer with Annotation System

```typescript
// src/interfaces/approval/DocumentViewer.ts
export interface DocumentViewerConfig {
  container: HTMLElement;
  enableAnnotations: boolean;
  enableCollaboration: boolean;
  supportedFormats: DocumentFormat[];
  maxZoomLevel: number;
  minZoomLevel: number;
  onAnnotationSelect: (annotation: Annotation) => void;
  onDocumentClick: (position: DocumentPosition) => void;
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  userId: string;
  userName: string;
  position: AnnotationPosition;
  content: AnnotationContent;
  style: AnnotationStyle;
  timestamp: Date;
  replies: AnnotationReply[];
  resolved: boolean;
  metadata: AnnotationMetadata;
}

export enum AnnotationType {
  HIGHLIGHT = 'highlight',
  NOTE = 'note',
  ARROW = 'arrow',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  FREEHAND = 'freehand',
  TEXT = 'text',
  STAMP = 'stamp'
}

export interface AnnotationPosition {
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  coordinates?: Point[];
}

export class DocumentViewer {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private document: DocumentData | null = null;
  private annotations: Map<string, Annotation> = new Map();
  private currentPage: number = 1;
  private zoomLevel: number = 1.0;
  private viewportOffset: Point = { x: 0, y: 0 };
  private isAnnotating: boolean = false;
  private currentAnnotationType: AnnotationType = AnnotationType.HIGHLIGHT;
  private collaboratorCursors: Map<string, CollaboratorCursor> = new Map();

  constructor(private config: DocumentViewerConfig) {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupAnnotationTools();
  }

  async loadDocument(documentMetadata: DocumentMetadata): Promise<void> {
    try {
      // Load document data based on format
      const documentData = await this.loadDocumentData(documentMetadata);
      this.document = documentData;
      
      // Render first page
      await this.renderPage(1);
      
      // Setup page navigation
      this.setupPageNavigation();
      
    } catch (error) {
      throw new DocumentViewerError('Failed to load document', error);
    }
  }

  private async loadDocumentData(metadata: DocumentMetadata): Promise<DocumentData> {
    switch (metadata.format) {
      case DocumentFormat.PDF:
        return await this.loadPdfDocument(metadata);
      
      case DocumentFormat.IMAGE:
        return await this.loadImageDocument(metadata);
      
      case DocumentFormat.HTML:
        return await this.loadHtmlDocument(metadata);
      
      case DocumentFormat.MARKDOWN:
        return await this.loadMarkdownDocument(metadata);
      
      default:
        throw new Error(`Unsupported document format: ${metadata.format}`);
    }
  }

  private async loadPdfDocument(metadata: DocumentMetadata): Promise<DocumentData> {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/static/js/pdf.worker.min.js';
    
    const loadingTask = pdfjsLib.getDocument(metadata.url);
    const pdf = await loadingTask.promise;
    
    const pages: PageData[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      
      pages.push({
        number: pageNum,
        width: viewport.width,
        height: viewport.height,
        content: page
      });
    }
    
    return {
      format: DocumentFormat.PDF,
      pages,
      totalPages: pdf.numPages,
      metadata
    };
  }

  async addAnnotation(annotation: Annotation): Promise<void> {
    // Validate annotation
    this.validateAnnotation(annotation);
    
    // Add to collection
    this.annotations.set(annotation.id, annotation);
    
    // Render annotation on canvas
    await this.renderAnnotation(annotation);
    
    // Emit event
    this.emitAnnotationEvent('annotation_added', annotation);
  }

  private async renderAnnotation(annotation: Annotation): Promise<void> {
    const ctx = this.context;
    
    // Transform coordinates to current viewport
    const screenPos = this.documentToScreenCoordinates(annotation.position);
    
    // Set style
    ctx.strokeStyle = annotation.style.strokeColor || '#FF0000';
    ctx.fillStyle = annotation.style.fillColor || 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = annotation.style.strokeWidth || 2;
    
    switch (annotation.type) {
      case AnnotationType.HIGHLIGHT:
        await this.renderHighlightAnnotation(ctx, annotation, screenPos);
        break;
        
      case AnnotationType.RECTANGLE:
        await this.renderRectangleAnnotation(ctx, annotation, screenPos);
        break;
        
      case AnnotationType.CIRCLE:
        await this.renderCircleAnnotation(ctx, annotation, screenPos);
        break;
        
      case AnnotationType.ARROW:
        await this.renderArrowAnnotation(ctx, annotation, screenPos);
        break;
        
      case AnnotationType.NOTE:
        await this.renderNoteAnnotation(ctx, annotation, screenPos);
        break;
        
      case AnnotationType.FREEHAND:
        await this.renderFreehandAnnotation(ctx, annotation, screenPos);
        break;
    }
  }

  private async renderHighlightAnnotation(
    ctx: CanvasRenderingContext2D,
    annotation: Annotation,
    position: Point
  ): Promise<void> {
    ctx.globalAlpha = 0.3;
    ctx.fillRect(
      position.x,
      position.y,
      annotation.position.width || 100,
      annotation.position.height || 20
    );
    ctx.globalAlpha = 1.0;
  }

  private async renderNoteAnnotation(
    ctx: CanvasRenderingContext2D,
    annotation: Annotation,
    position: Point
  ): Promise<void> {
    // Draw note icon
    const iconSize = 20;
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(position.x, position.y, iconSize, iconSize);
    
    // Draw note indicator
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.fillText('!', position.x + 7, position.y + 14);
    
    // Show note content on hover/click
    if (annotation.id === this.selectedAnnotationId) {
      this.showAnnotationTooltip(annotation, position);
    }
  }

  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private handleMouseDown(event: MouseEvent): void {
    const position = this.getEventPosition(event);
    
    if (this.isAnnotating) {
      this.startAnnotation(position);
    } else {
      // Check for annotation selection
      const annotation = this.getAnnotationAtPosition(position);
      if (annotation) {
        this.selectAnnotation(annotation);
        this.config.onAnnotationSelect(annotation);
      } else {
        this.config.onDocumentClick(this.screenToDocumentCoordinates(position));
      }
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    const position = this.getEventPosition(event);
    
    if (this.isAnnotating && this.currentAnnotation) {
      this.updateCurrentAnnotation(position);
      this.renderCurrentAnnotation();
    }
    
    // Update cursor position for collaboration
    this.updateCollaboratorCursor(position);
  }

  private handleMouseUp(event: MouseEvent): void {
    if (this.isAnnotating && this.currentAnnotation) {
      this.finalizeCurrentAnnotation();
    }
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    
    if (event.ctrlKey) {
      // Zoom
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      this.setZoomLevel(this.zoomLevel + delta);
    } else {
      // Pan
      this.viewportOffset.x -= event.deltaX;
      this.viewportOffset.y -= event.deltaY;
      this.render();
    }
  }

  async setZoomLevel(level: number): Promise<void> {
    this.zoomLevel = Math.max(
      this.config.minZoomLevel,
      Math.min(this.config.maxZoomLevel, level)
    );
    
    await this.render();
  }

  async navigateToPage(pageNumber: number): Promise<void> {
    if (pageNumber < 1 || pageNumber > this.document!.totalPages) {
      throw new Error('Invalid page number');
    }
    
    this.currentPage = pageNumber;
    await this.renderPage(pageNumber);
  }

  private async renderPage(pageNumber: number): Promise<void> {
    if (!this.document) return;
    
    const page = this.document.pages[pageNumber - 1];
    if (!page) return;
    
    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render page content based on format
    await this.renderPageContent(page);
    
    // Render annotations for this page
    await this.renderPageAnnotations(pageNumber);
    
    // Render collaborator cursors
    this.renderCollaboratorCursors();
  }

  private async renderPageContent(page: PageData): Promise<void> {
    switch (this.document!.format) {
      case DocumentFormat.PDF:
        await this.renderPdfPage(page);
        break;
        
      case DocumentFormat.IMAGE:
        await this.renderImagePage(page);
        break;
        
      case DocumentFormat.HTML:
        await this.renderHtmlPage(page);
        break;
    }
  }

  private async renderPdfPage(page: PageData): Promise<void> {
    const pdfPage = page.content as any; // PDF.js page object
    const viewport = pdfPage.getViewport({ 
      scale: this.zoomLevel,
      offsetX: this.viewportOffset.x,
      offsetY: this.viewportOffset.y
    });
    
    // Set canvas size
    this.canvas.width = viewport.width;
    this.canvas.height = viewport.height;
    
    // Render page
    const renderContext = {
      canvasContext: this.context,
      viewport: viewport
    };
    
    await pdfPage.render(renderContext).promise;
  }

  enableAnnotationMode(type: AnnotationType): void {
    this.isAnnotating = true;
    this.currentAnnotationType = type;
    this.canvas.style.cursor = this.getAnnotationCursor(type);
  }

  disableAnnotationMode(): void {
    this.isAnnotating = false;
    this.currentAnnotationType = AnnotationType.HIGHLIGHT;
    this.canvas.style.cursor = 'default';
  }

  private getAnnotationCursor(type: AnnotationType): string {
    switch (type) {
      case AnnotationType.HIGHLIGHT:
        return 'text';
      case AnnotationType.RECTANGLE:
      case AnnotationType.CIRCLE:
        return 'crosshair';
      case AnnotationType.ARROW:
        return 'copy';
      case AnnotationType.NOTE:
        return 'help';
      case AnnotationType.FREEHAND:
        return 'pencil';
      default:
        return 'crosshair';
    }
  }

  exportAnnotations(): Annotation[] {
    return Array.from(this.annotations.values());
  }

  importAnnotations(annotations: Annotation[]): void {
    this.annotations.clear();
    
    for (const annotation of annotations) {
      this.annotations.set(annotation.id, annotation);
    }
    
    this.render();
  }
}
```

### 3. Mobile-Responsive Approval Interface

```typescript
// src/interfaces/approval/MobileApprovalInterface.tsx
export interface MobileApprovalInterfaceProps {
  requestId: string;
  workflowId: string;
  currentUser: User;
  onApprovalSubmit: (decision: ApprovalDecision) => Promise<void>;
}

export interface MobileApprovalState {
  currentView: MobileView;
  request: ApprovalRequest | null;
  workflow: ApprovalWorkflow | null;
  isSubmitting: boolean;
  showConfirmDialog: boolean;
  pendingDecision: ApprovalDecision | null;
}

export enum MobileView {
  OVERVIEW = 'overview',
  DOCUMENT = 'document',
  COMMENTS = 'comments',
  DECISION = 'decision',
  HISTORY = 'history'
}

export class MobileApprovalInterface extends React.Component<
  MobileApprovalInterfaceProps,
  MobileApprovalState
> {
  private touchStartY: number = 0;
  private touchStartX: number = 0;
  private swipeThreshold: number = 50;

  constructor(props: MobileApprovalInterfaceProps) {
    super(props);
    
    this.state = {
      currentView: MobileView.OVERVIEW,
      request: null,
      workflow: null,
      isSubmitting: false,
      showConfirmDialog: false,
      pendingDecision: null
    };
  }

  componentDidMount(): void {
    this.loadApprovalData();
    this.setupTouchHandlers();
  }

  render(): React.ReactElement {
    return (
      <div className="mobile-approval-interface">
        <MobileApprovalHeader
          request={this.state.request}
          currentView={this.state.currentView}
          onBackClick={this.handleBackClick}
          onMenuClick={this.handleMenuClick}
        />
        
        <div className="mobile-approval-content">
          {this.renderCurrentView()}
        </div>
        
        <MobileApprovalNavigation
          currentView={this.state.currentView}
          onViewChange={this.handleViewChange}
          hasDocument={this.hasDocument()}
          hasComments={this.hasComments()}
        />
        
        {this.state.showConfirmDialog && (
          <MobileConfirmDialog
            decision={this.state.pendingDecision}
            onConfirm={this.handleConfirmDecision}
            onCancel={this.handleCancelDecision}
          />
        )}
        
        <MobileApprovalFAB
          onApproveClick={() => this.handleQuickDecision(ApprovalAction.APPROVE)}
          onRejectClick={() => this.handleQuickDecision(ApprovalAction.REJECT)}
          onMoreClick={this.handleMoreActions}
        />
      </div>
    );
  }

  private renderCurrentView(): React.ReactElement {
    switch (this.state.currentView) {
      case MobileView.OVERVIEW:
        return this.renderOverviewView();
      case MobileView.DOCUMENT:
        return this.renderDocumentView();
      case MobileView.COMMENTS:
        return this.renderCommentsView();
      case MobileView.DECISION:
        return this.renderDecisionView();
      case MobileView.HISTORY:
        return this.renderHistoryView();
      default:
        return this.renderOverviewView();
    }
  }

  private renderOverviewView(): React.ReactElement {
    const { request, workflow } = this.state;
    
    if (!request || !workflow) {
      return <MobileLoadingSpinner />;
    }

    return (
      <div className="mobile-overview-view">
        <MobileRequestSummary
          request={request}
          workflow={workflow}
          onDocumentClick={() => this.handleViewChange(MobileView.DOCUMENT)}
        />
        
        <MobileWorkflowProgress
          workflow={workflow}
          currentStage={request.currentStage}
          approvals={request.approvals}
        />
        
        <MobileRecentActivity
          timeline={request.timeline}
          onShowAllClick={() => this.handleViewChange(MobileView.HISTORY)}
        />
        
        <MobileQuickActions
          permissions={this.getUserPermissions()}
          onApproveClick={() => this.handleQuickDecision(ApprovalAction.APPROVE)}
          onRejectClick={() => this.handleQuickDecision(ApprovalAction.REJECT)}
          onMoreClick={() => this.handleViewChange(MobileView.DECISION)}
        />
      </div>
    );
  }

  private renderDocumentView(): React.ReactElement {
    return (
      <div className="mobile-document-view">
        <MobileDocumentViewer
          documentId={this.state.request?.itemId}
          enableAnnotations={true}
          enablePinchZoom={true}
          onAnnotationAdd={this.handleAnnotationAdd}
          onCommentAdd={this.handleCommentAdd}
        />
        
        <MobileDocumentToolbar
          onZoomIn={this.handleZoomIn}
          onZoomOut={this.handleZoomOut}
          onAnnotateClick={this.handleAnnotateClick}
          onCommentClick={this.handleCommentClick}
        />
      </div>
    );
  }

  private renderDecisionView(): React.ReactElement {
    return (
      <div className="mobile-decision-view">
        <MobileDecisionForm
          permissions={this.getUserPermissions()}
          onSubmit={this.handleDecisionSubmit}
          onCancel={() => this.handleViewChange(MobileView.OVERVIEW)}
        />
      </div>
    );
  }

  private setupTouchHandlers(): void {
    const container = document.querySelector('.mobile-approval-interface');
    if (!container) return;

    container.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    });

    container.addEventListener('touchend', (e) => {
      if (!e.changedTouches[0]) return;

      const deltaX = e.changedTouches[0].clientX - this.touchStartX;
      const deltaY = e.changedTouches[0].clientY - this.touchStartY;

      // Horizontal swipe
      if (Math.abs(deltaX) > this.swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          this.handleSwipeRight();
        } else {
          this.handleSwipeLeft();
        }
      }
      
      // Vertical swipe
      if (Math.abs(deltaY) > this.swipeThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > 0) {
          this.handleSwipeDown();
        } else {
          this.handleSwipeUp();
        }
      }
    });
  }

  private handleSwipeLeft(): void {
    const views = Object.values(MobileView);
    const currentIndex = views.indexOf(this.state.currentView);
    const nextIndex = (currentIndex + 1) % views.length;
    this.handleViewChange(views[nextIndex]);
  }

  private handleSwipeRight(): void {
    const views = Object.values(MobileView);
    const currentIndex = views.indexOf(this.state.currentView);
    const prevIndex = currentIndex === 0 ? views.length - 1 : currentIndex - 1;
    this.handleViewChange(views[prevIndex]);
  }

  private handleQuickDecision(action: ApprovalAction): void {
    const decision: ApprovalDecision = {
      action,
      comments: '',
      attachments: [],
      annotations: [],
      customFields: {}
    };

    this.setState({
      pendingDecision: decision,
      showConfirmDialog: true
    });
  }

  private async handleConfirmDecision(): Promise<void> {
    if (!this.state.pendingDecision) return;

    this.setState({ isSubmitting: true });

    try {
      await this.props.onApprovalSubmit(this.state.pendingDecision);
      
      // Show success feedback
      this.showSuccessToast('Decision submitted successfully');
      
      // Navigate back to overview
      this.handleViewChange(MobileView.OVERVIEW);
      
    } catch (error) {
      this.showErrorToast('Failed to submit decision');
    } finally {
      this.setState({
        isSubmitting: false,
        showConfirmDialog: false,
        pendingDecision: null
      });
    }
  }
}
```

### 4. Approval Dashboard

```typescript
// src/interfaces/approval/ApprovalDashboard.tsx
export interface ApprovalDashboardProps {
  currentUser: User;
  projectId?: string;
  filters?: ApprovalFilters;
}

export interface ApprovalDashboardState {
  pendingApprovals: PendingApproval[];
  recentApprovals: ApprovalRecord[];
  approvalMetrics: ApprovalMetrics;
  selectedRequest: ApprovalRequest | null;
  showRequestDetails: boolean;
  loading: boolean;
  error: string | null;
}

export class ApprovalDashboard extends React.Component<
  ApprovalDashboardProps,
  ApprovalDashboardState
> {
  private refreshInterval: NodeJS.Timeout | null = null;
  private websocketConnection: WebSocket | null = null;

  constructor(props: ApprovalDashboardProps) {
    super(props);
    
    this.state = {
      pendingApprovals: [],
      recentApprovals: [],
      approvalMetrics: this.getEmptyMetrics(),
      selectedRequest: null,
      showRequestDetails: false,
      loading: true,
      error: null
    };
  }

  componentDidMount(): void {
    this.loadDashboardData();
    this.setupAutoRefresh();
    this.connectWebSocket();
  }

  componentWillUnmount(): void {
    this.cleanupResources();
  }

  render(): React.ReactElement {
    return (
      <div className="approval-dashboard">
        <DashboardHeader
          user={this.props.currentUser}
          metrics={this.state.approvalMetrics}
          onRefreshClick={this.handleRefreshClick}
        />
        
        <div className="dashboard-content">
          <div className="dashboard-main">
            <ApprovalMetricsPanel
              metrics={this.state.approvalMetrics}
              loading={this.state.loading}
              onMetricClick={this.handleMetricClick}
            />
            
            <PendingApprovalsPanel
              approvals={this.state.pendingApprovals}
              loading={this.state.loading}
              onApprovalClick={this.handleApprovalClick}
              onBulkAction={this.handleBulkAction}
            />
            
            <RecentActivityPanel
              activities={this.state.recentApprovals}
              loading={this.state.loading}
              onActivityClick={this.handleActivityClick}
            />
          </div>
          
          <div className="dashboard-sidebar">
            <ApprovalFiltersPanel
              filters={this.props.filters}
              onFiltersChange={this.handleFiltersChange}
            />
            
            <QuickActionsPanel
              onCreateWorkflowClick={this.handleCreateWorkflowClick}
              onBulkApproveClick={this.handleBulkApproveClick}
              onExportClick={this.handleExportClick}
            />
          </div>
        </div>
        
        {this.state.showRequestDetails && this.state.selectedRequest && (
          <ApprovalRequestModal
            request={this.state.selectedRequest}
            onClose={this.handleCloseRequestDetails}
            onApprovalSubmit={this.handleModalApprovalSubmit}
          />
        )}
      </div>
    );
  }

  private async loadDashboardData(): Promise<void> {
    this.setState({ loading: true, error: null });

    try {
      const [pendingApprovals, recentApprovals, metrics] = await Promise.all([
        this.approvalService.getPendingApprovals(this.props.currentUser.id),
        this.approvalService.getRecentApprovals(this.props.currentUser.id),
        this.approvalService.getApprovalMetrics(this.props.projectId)
      ]);

      this.setState({
        pendingApprovals,
        recentApprovals,
        approvalMetrics: metrics,
        loading: false
      });

    } catch (error) {
      this.setState({
        error: 'Failed to load dashboard data',
        loading: false
      });
    }
  }

  private handleApprovalClick = async (approval: PendingApproval): Promise<void> => {
    try {
      const request = await this.approvalService.getApprovalRequest(approval.requestId);
      
      this.setState({
        selectedRequest: request,
        showRequestDetails: true
      });
      
    } catch (error) {
      this.showErrorToast('Failed to load approval request details');
    }
  };

  private handleBulkAction = async (
    action: BulkApprovalAction,
    approvalIds: string[]
  ): Promise<void> => {
    if (approvalIds.length === 0) return;

    const confirmed = await this.showConfirmDialog(
      `Are you sure you want to ${action} ${approvalIds.length} approval(s)?`
    );
    
    if (!confirmed) return;

    try {
      await this.approvalService.bulkApprovalAction(action, approvalIds);
      
      this.showSuccessToast(`Successfully ${action}d ${approvalIds.length} approval(s)`);
      
      // Refresh data
      await this.loadDashboardData();
      
    } catch (error) {
      this.showErrorToast(`Failed to ${action} approvals`);
    }
  };

  private setupAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.loadDashboardData();
    }, 30000); // Refresh every 30 seconds
  }

  private connectWebSocket(): void {
    this.websocketConnection = new WebSocket(this.getWebSocketUrl());
    
    this.websocketConnection.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleRealtimeUpdate(message);
    };
  }

  private handleRealtimeUpdate(message: WebSocketMessage): void {
    switch (message.type) {
      case 'new_approval_request':
        this.handleNewApprovalRequest(message.data);
        break;
        
      case 'approval_submitted':
        this.handleApprovalSubmitted(message.data);
        break;
        
      case 'workflow_completed':
        this.handleWorkflowCompleted(message.data);
        break;
    }
  }

  private cleanupResources(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    if (this.websocketConnection) {
      this.websocketConnection.close();
    }
  }
}
```

## File Structure

```
src/interfaces/approval/
├── index.ts                              # Main exports
├── ApprovalInterface.tsx                 # Main approval interface
├── MobileApprovalInterface.tsx           # Mobile-responsive interface
├── ApprovalDashboard.tsx                 # Approval dashboard
├── components/
│   ├── index.ts
│   ├── ApprovalHeader.tsx                # Interface header
│   ├── ApprovalSidebar.tsx               # Workflow sidebar
│   ├── ApprovalMainView.tsx              # Main content view
│   ├── ApprovalActionsPanel.tsx          # Actions panel
│   ├── ApprovalFooter.tsx                # Interface footer
│   ├── DocumentViewer.tsx                # Document viewer component
│   ├── AnnotationTools.tsx               # Annotation toolbar
│   ├── CommentSystem.tsx                 # Comment system
│   └── ProgressTracker.tsx               # Progress tracking
├── mobile/
│   ├── index.ts
│   ├── MobileApprovalHeader.tsx          # Mobile header
│   ├── MobileApprovalNavigation.tsx      # Mobile navigation
│   ├── MobileDocumentViewer.tsx          # Mobile document viewer
│   ├── MobileDecisionForm.tsx            # Mobile decision form
│   ├── MobileConfirmDialog.tsx           # Mobile confirmation dialog
│   └── MobileFAB.tsx                     # Floating action button
├── dashboard/
│   ├── index.ts
│   ├── DashboardHeader.tsx               # Dashboard header
│   ├── ApprovalMetricsPanel.tsx          # Metrics display
│   ├── PendingApprovalsPanel.tsx         # Pending approvals list
│   ├── RecentActivityPanel.tsx           # Recent activity feed
│   ├── ApprovalFiltersPanel.tsx          # Filter controls
│   └── QuickActionsPanel.tsx             # Quick action buttons
├── viewers/
│   ├── index.ts
│   ├── DocumentViewer.ts                 # Core document viewer
│   ├── PdfViewer.ts                      # PDF document viewer
│   ├── ImageViewer.ts                    # Image document viewer
│   ├── HtmlViewer.ts                     # HTML document viewer
│   └── MarkdownViewer.ts                 # Markdown document viewer
├── annotations/
│   ├── index.ts
│   ├── AnnotationEngine.ts               # Annotation engine
│   ├── AnnotationRenderer.ts             # Annotation rendering
│   ├── AnnotationTools.tsx               # Annotation tools UI
│   └── types.ts                          # Annotation types
├── collaboration/
│   ├── index.ts
│   ├── CollaborationEngine.ts            # Real-time collaboration
│   ├── PresenceIndicator.tsx             # User presence indicator
│   ├── CursorTracker.ts                  # Cursor tracking
│   └── ActivityFeed.tsx                  # Activity feed
├── forms/
│   ├── index.ts
│   ├── ApprovalDecisionForm.tsx          # Decision form
│   ├── CommentForm.tsx                   # Comment form
│   ├── DelegationForm.tsx                # Delegation form
│   └── EscalationForm.tsx                # Escalation form
├── styles/
│   ├── approval-interface.scss           # Main interface styles
│   ├── mobile-approval.scss              # Mobile styles
│   ├── dashboard.scss                    # Dashboard styles
│   ├── document-viewer.scss              # Document viewer styles
│   └── annotations.scss                  # Annotation styles
├── utils/
│   ├── index.ts
│   ├── ApprovalInterfaceUtils.ts         # Interface utilities
│   ├── DocumentUtils.ts                  # Document utilities
│   ├── AnnotationUtils.ts                # Annotation utilities
│   └── MobileUtils.ts                    # Mobile utilities
└── __tests__/
    ├── unit/
    │   ├── ApprovalInterface.test.tsx
    │   ├── DocumentViewer.test.ts
    │   ├── AnnotationEngine.test.ts
    │   └── MobileApprovalInterface.test.tsx
    ├── integration/
    │   ├── approval-workflow.test.tsx
    │   ├── document-annotation.test.tsx
    │   └── mobile-approval.test.tsx
    └── fixtures/
        ├── test-approvals.json
        ├── test-documents.json
        └── test-annotations.json
```

## Success Criteria

### Functional Requirements
1. **Interactive Interfaces**: Intuitive approval interfaces supporting various document types and workflows
2. **Document Viewing**: Rich document viewer with annotation and commenting capabilities
3. **Mobile Responsiveness**: Full-featured mobile approval interface with touch optimization
4. **Real-time Collaboration**: Live collaboration features with presence indicators and cursor tracking
5. **Approval Dashboard**: Comprehensive dashboard for approval management and analytics
6. **Accessibility**: WCAG 2.1 AA compliance for accessibility
7. **Performance**: Sub-300ms response times with smooth animations and interactions

### Technical Requirements
1. **Error Handling**: Comprehensive error handling with user-friendly messages
2. **Logging**: Detailed logging for debugging and user analytics
3. **Testing**: 90%+ code coverage with unit, integration, and end-to-end tests
4. **Documentation**: Complete component documentation and usage examples
5. **Cross-browser Support**: Support for modern browsers and mobile devices
6. **Offline Capability**: Basic offline functionality for viewing and commenting
7. **Security**: Secure document viewing with proper access controls

### Quality Standards
1. **User Experience**: Intuitive, responsive interface with excellent usability
2. **Performance**: Fast loading times and smooth interactions
3. **Reliability**: Robust error handling and graceful degradation
4. **Maintainability**: Clean, well-documented, and reusable component architecture
5. **Scalability**: Support for large documents and high user concurrency

## Output Format

### Implementation Deliverables
1. **Core Implementation**: Complete interactive approval interface components
2. **Unit Tests**: Comprehensive test suite with 90%+ coverage
3. **Integration Tests**: End-to-end approval interface testing
4. **Accessibility Tests**: WCAG compliance verification
5. **Component Documentation**: Detailed documentation of all components
6. **Style Guide**: UI/UX guidelines and component library
7. **Performance Benchmarks**: Interface performance metrics and optimization

### Documentation Requirements
1. **Component Documentation**: Complete component API and usage documentation
2. **User Guide**: End-user documentation for approval interfaces
3. **Mobile Guide**: Mobile-specific usage instructions
4. **Accessibility Guide**: Accessibility features and compliance information
5. **Troubleshooting Guide**: Common issues and resolution steps
6. **Style Guide**: Design system and component library documentation

### Testing Requirements
1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test component interactions and approval workflows
3. **Accessibility Tests**: Verify WCAG compliance and screen reader support
4. **Mobile Tests**: Test mobile interface on various devices and browsers
5. **Performance Tests**: Measure interface loading times and responsiveness
6. **Usability Tests**: User experience testing and feedback collection

Remember to leverage Context7 throughout the implementation to ensure you're using the most current UI/UX best practices and optimal libraries for interactive approval interfaces.