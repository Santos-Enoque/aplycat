# Issue #8: Background Auto-Save for CV Processing Workflows

**GitHub Issue**: [#8 - Background Auto-Save for CV Processing Workflows](https://github.com/Santos-Enoque/aplycat/issues/8)

## Problem Analysis

The current implementation has several critical gaps in data persistence:
- Analysis results only saved after complete streaming process
- User improvements lost if session ends before completion
- Job tailoring data not persisted during URL extraction process
- No recovery mechanism for interrupted workflows
- SessionStorage is temporary and lost on browser close/refresh

## Current State Assessment

### ✅ What's Already Working
- **Streaming Infrastructure**: Robust streaming analysis via SSE in `/api/analyze-resume-stream`
- **Hooks**: `useStreamingAnalysis` and `useStreamingImprovement` with sessionStorage persistence  
- **Database Models**: Complete Resume, Analysis, Improvement, and ImprovedResume models
- **File Storage**: UploadThing integration completed (Issue #7)
- **Authentication**: Clerk integration with proper user management
- **Credit System**: Working credit tracking and deduction

### ❌ What's Missing
- **Database Checkpointing**: No persistent checkpoint tables for workflows
- **Background Auto-Save**: No automatic saving during streaming operations
- **Recovery System**: No way to resume interrupted workflows from database
- **Background Processing**: No queue system for auto-save operations
- **Recovery UI**: No components to handle interrupted workflow recovery

## Implementation Plan

### Phase 1: Database Schema Enhancement (Day 1-2)

#### 1.1 Add Checkpoint Models to Prisma Schema
```sql
-- Add to existing schema.prisma

model AnalysisCheckpoint {
  id               String   @id @default(cuid())
  resumeId         String
  userId           String
  progress         Float    // 0.0 to 1.0
  partialAnalysis  Json?    // Partial analysis data
  status           ProcessingStatus
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  resume           Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  user             User     @relation(fields: [userId], references: [clerkId])
  
  @@unique([resumeId, userId])
  @@index([userId, status, updatedAt])
  @@map("analysis_checkpoints")
}

model ImprovementSession {
  id                String   @id @default(cuid())
  resumeId          String
  userId            String
  targetRole        String?
  targetIndustry    String?
  improveInstructions String?
  partialImprovement Json?
  progress          Float    @default(0.0)
  status            ProcessingStatus
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  resume            Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  
  @@unique([resumeId, userId])
  @@index([userId, status, updatedAt])
  @@map("improvement_sessions")
}

enum ProcessingStatus {
  PENDING
  IN_PROGRESS  
  PAUSED
  COMPLETED
  ERROR
  CANCELLED
}
```

#### 1.2 Update User Model Relations
```sql
-- Add to User model relations
analysisCheckpoints  AnalysisCheckpoint[]
improvementSessions  ImprovementSession[]
```

#### 1.3 Update Resume Model Relations  
```sql
-- Add to Resume model relations
analysisCheckpoints  AnalysisCheckpoint[]
improvementSessions  ImprovementSession[]
```

### Phase 2: Background Auto-Save Infrastructure (Day 2-3)

#### 2.1 Create Auto-Save Service
**File**: `lib/streaming-auto-save.ts`
```typescript
import { db } from '@/lib/db';

interface AnalysisCheckpointData {
  resumeId: string;
  userId: string;
  progress: number;
  partialAnalysis: Partial<AnalysisData>;
  status: ProcessingStatus;
}

interface ImprovementSessionData {
  resumeId: string;
  userId: string;
  targetRole?: string;
  targetIndustry?: string;
  improveInstructions?: string;
  partialImprovement: any;
  progress: number;
  status: ProcessingStatus;
}

export class StreamingAutoSave {
  /**
   * Save analysis progress to database
   * Uses upsert to handle multiple saves for same resume/user
   */
  async saveAnalysisProgress(data: AnalysisCheckpointData): Promise<void> {
    try {
      await db.analysisCheckpoint.upsert({
        where: {
          resumeId_userId: {
            resumeId: data.resumeId,
            userId: data.userId,
          },
        },
        update: {
          progress: data.progress,
          partialAnalysis: data.partialAnalysis,
          status: data.status,
          updatedAt: new Date(),
        },
        create: {
          resumeId: data.resumeId,
          userId: data.userId,
          progress: data.progress,
          partialAnalysis: data.partialAnalysis,
          status: data.status,
        },
      });
    } catch (error) {
      console.error('[StreamingAutoSave] Failed to save analysis progress:', error);
      // Don't throw - auto-save should be resilient
    }
  }

  /**
   * Save improvement session progress
   */
  async saveImprovementProgress(data: ImprovementSessionData): Promise<void> {
    try {
      await db.improvementSession.upsert({
        where: {
          resumeId_userId: {
            resumeId: data.resumeId,
            userId: data.userId,
          },
        },
        update: {
          targetRole: data.targetRole,
          targetIndustry: data.targetIndustry,
          improveInstructions: data.improveInstructions,
          partialImprovement: data.partialImprovement,
          progress: data.progress,
          status: data.status,
          updatedAt: new Date(),
        },
        create: data,
      });
    } catch (error) {
      console.error('[StreamingAutoSave] Failed to save improvement progress:', error);
    }
  }

  /**
   * Recover analysis state for a resume
   */
  async recoverAnalysisState(resumeId: string, userId: string): Promise<AnalysisCheckpoint | null> {
    try {
      return await db.analysisCheckpoint.findUnique({
        where: {
          resumeId_userId: {
            resumeId,
            userId,
          },
        },
        include: { resume: true },
      });
    } catch (error) {
      console.error('[StreamingAutoSave] Failed to recover analysis state:', error);
      return null;
    }
  }

  /**
   * Recover improvement session for a resume
   */
  async recoverImprovementSession(resumeId: string, userId: string): Promise<ImprovementSession | null> {
    try {
      return await db.improvementSession.findUnique({
        where: {
          resumeId_userId: {
            resumeId,
            userId,
          },
        },
        include: { resume: true },
      });
    } catch (error) {
      console.error('[StreamingAutoSave] Failed to recover improvement session:', error);
      return null;
    }
  }

  /**
   * Clean up old completed checkpoints
   */
  async cleanupOldCheckpoints(): Promise<void> {
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    
    try {
      await db.analysisCheckpoint.deleteMany({
        where: {
          updatedAt: { lt: expiredDate },
          status: { in: ['COMPLETED', 'ERROR', 'CANCELLED'] },
        },
      });

      await db.improvementSession.deleteMany({
        where: {
          updatedAt: { lt: expiredDate },
          status: { in: ['COMPLETED', 'ERROR', 'CANCELLED'] },
        },
      });
    } catch (error) {
      console.error('[StreamingAutoSave] Failed to cleanup old checkpoints:', error);
    }
  }
}
```

#### 2.2 Background Job Queue Setup
**File**: `lib/background-processor.ts`
```typescript
// Simple in-memory queue for MVP (can be upgraded to Redis later)
interface AutoSaveJob {
  id: string;
  type: 'SAVE_ANALYSIS_PROGRESS' | 'SAVE_IMPROVEMENT_PROGRESS' | 'CLEANUP_EXPIRED';
  data: any;
  timestamp: Date;
  retries: number;
}

export class BackgroundProcessor {
  private jobs: Map<string, AutoSaveJob> = new Map();
  private isProcessing = false;
  private autoSave = new StreamingAutoSave();

  /**
   * Add job to queue with debouncing
   */
  async addJob(type: AutoSaveJob['type'], data: any, key?: string): Promise<void> {
    const jobId = key || `${type}-${Date.now()}`;
    
    // Debounce: replace existing job with same key
    this.jobs.set(jobId, {
      id: jobId,
      type,
      data,
      timestamp: new Date(),
      retries: 0,
    });

    this.processJobs();
  }

  /**
   * Process jobs in background
   */
  private async processJobs(): Promise<void> {
    if (this.isProcessing || this.jobs.size === 0) return;
    
    this.isProcessing = true;

    for (const [jobId, job] of this.jobs.entries()) {
      try {
        await this.processJob(job);
        this.jobs.delete(jobId);
      } catch (error) {
        console.error(`[BackgroundProcessor] Job ${jobId} failed:`, error);
        
        job.retries++;
        if (job.retries >= 3) {
          console.error(`[BackgroundProcessor] Job ${jobId} failed after 3 retries, removing`);
          this.jobs.delete(jobId);
        }
      }
    }

    this.isProcessing = false;
  }

  private async processJob(job: AutoSaveJob): Promise<void> {
    switch (job.type) {
      case 'SAVE_ANALYSIS_PROGRESS':
        await this.autoSave.saveAnalysisProgress(job.data);
        break;
      case 'SAVE_IMPROVEMENT_PROGRESS':
        await this.autoSave.saveImprovementProgress(job.data);
        break;
      case 'CLEANUP_EXPIRED':
        await this.autoSave.cleanupOldCheckpoints();
        break;
    }
  }
}

// Global background processor instance
export const backgroundProcessor = new BackgroundProcessor();
```

### Phase 3: Enhanced Streaming Components (Day 3-4)

#### 3.1 Update Streaming Analysis Hook
**File**: `hooks/use-streaming-analysis.ts` (enhance existing)
```typescript
// Add to existing useStreamingAnalysis hook

const autoSave = new StreamingAutoSave();
const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

// Enhanced auto-save function
const autoSaveProgress = useCallback(async (partialAnalysis: any, progress: number) => {
  if (!lastFile.current || !userId) return;

  const resumeId = sessionStorage.getItem('aplycat_uploadthing_resume_id') || 
                   sessionStorage.getItem('aplycat_fallback_resume_id');
  
  if (!resumeId) return;

  // Queue background auto-save
  backgroundProcessor.addJob(
    'SAVE_ANALYSIS_PROGRESS',
    {
      resumeId,
      userId,
      progress: progress / 100,
      partialAnalysis,
      status: progress >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
    },
    `analysis-${resumeId}-${userId}` // Key for debouncing
  );
}, [userId]);

// Set up periodic auto-save during streaming
useEffect(() => {
  if (status === 'streaming' && analysis) {
    saveIntervalRef.current = setInterval(() => {
      autoSaveProgress(analysis, progress);
    }, 10000); // Save every 10 seconds
  } else {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
  }

  return () => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }
  };
}, [status, analysis, progress, autoSaveProgress]);

// Add recovery function
const recoverFromCheckpoint = useCallback(async (resumeId: string): Promise<AnalysisCheckpoint | null> => {
  if (!userId) return null;
  return await autoSave.recoverAnalysisState(resumeId, userId);
}, [userId]);

// Return recovery function in hook return
return {
  // ... existing returns
  recoverFromCheckpoint,
};
```

#### 3.2 Update Streaming Improvement Hook  
**File**: `hooks/use-streaming-improvement.ts` (enhance existing)
```typescript
// Similar enhancements for improvement streaming
// Add auto-save functionality during improvement process
// Include recovery mechanisms for improvement sessions
```

### Phase 4: API Routes Enhancement (Day 4-5)

#### 4.1 Enhanced Streaming Analysis API
**File**: `app/api/analyze-resume-stream/route.ts` (enhance existing)
```typescript
// Add checkpoint recovery to existing route

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const resumeFromCheckpoint = formData.get('resumeFromCheckpoint') === 'true';
    const resumeId = formData.get('resumeId') as string;

    // Check for existing checkpoint if requested
    if (resumeFromCheckpoint && resumeId) {
      const autoSave = new StreamingAutoSave();
      const checkpoint = await autoSave.recoverAnalysisState(resumeId, userId);
      
      if (checkpoint && checkpoint.status === 'IN_PROGRESS') {
        // Resume from checkpoint
        return streamAnalysisFromCheckpoint(checkpoint);
      }
    }

    // Start fresh analysis with auto-save
    return streamAnalysisWithAutoSave(file, userId);
    
  } catch (error) {
    console.error('[ANALYZE_RESUME_STREAM] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

async function streamAnalysisWithAutoSave(file: File, userId: string) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Store file and get resume ID
        const resumeId = await storeResumeFile(file, userId);
        
        // Initialize checkpoint
        const autoSave = new StreamingAutoSave();
        await autoSave.saveAnalysisProgress({
          resumeId,
          userId,
          progress: 0,
          partialAnalysis: {},
          status: 'IN_PROGRESS',
        });

        let chunkCount = 0;
        for await (const chunk of generateAnalysis(file)) {
          // Send to client
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          
          // Auto-save every 5 chunks (non-blocking)
          chunkCount++;
          if (chunkCount % 5 === 0) {
            // Don't await - run in background
            autoSave.saveAnalysisProgress({
              resumeId,
              userId,
              progress: chunk.progress || 0,
              partialAnalysis: chunk,
              status: 'IN_PROGRESS',
            });
          }
        }
        
        // Mark as completed
        await autoSave.saveAnalysisProgress({
          resumeId,
          userId,
          progress: 1.0,
          partialAnalysis: {}, // Will be saved separately in final analysis save
          status: 'COMPLETED',
        });
        
      } catch (error) {
        console.error('[ANALYZE_RESUME_STREAM] Error:', error);
        // Save error state
        await autoSave.saveAnalysisProgress({
          resumeId,
          userId,
          progress: 0,
          partialAnalysis: {},
          status: 'ERROR',
        });
        throw error;
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
    },
  });
}
```

#### 4.2 Recovery API Routes
**File**: `app/api/recovery/list/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { StreamingAutoSave } from '@/lib/streaming-auto-save';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const autoSave = new StreamingAutoSave();
    
    // Get recoverable sessions from last 24 hours
    const analysisCheckpoints = await db.analysisCheckpoint.findMany({
      where: { 
        userId, 
        status: { in: ['IN_PROGRESS', 'PAUSED'] },
        updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      include: { resume: true },
      orderBy: { updatedAt: 'desc' },
    });

    const improvementSessions = await db.improvementSession.findMany({
      where: { 
        userId, 
        status: { in: ['IN_PROGRESS', 'PAUSED'] },
        updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      include: { resume: true },
      orderBy: { updatedAt: 'desc' },
    });

    const recoverableSessions = [
      ...analysisCheckpoints.map(checkpoint => ({
        id: checkpoint.id,
        type: 'analysis' as const,
        resumeId: checkpoint.resumeId,
        resumeTitle: checkpoint.resume.fileName,
        progress: checkpoint.progress,
        lastActive: checkpoint.updatedAt,
        canRecover: true,
        metadata: checkpoint.partialAnalysis,
      })),
      ...improvementSessions.map(session => ({
        id: session.id,
        type: 'improvement' as const,
        resumeId: session.resumeId,
        resumeTitle: session.resume.fileName,
        progress: session.progress,
        lastActive: session.updatedAt,
        canRecover: true,
        metadata: {
          targetRole: session.targetRole,
          targetIndustry: session.targetIndustry,
        },
      })),
    ];

    return NextResponse.json({
      success: true,
      sessions: recoverableSessions,
      count: recoverableSessions.length,
    });
  } catch (error) {
    console.error('[RECOVERY_LIST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recoverable sessions' },
      { status: 500 }
    );
  }
}
```

### Phase 5: Recovery UI Components (Day 5-6)

#### 5.1 Recovery Banner Component
**File**: `components/recovery/workflow-recovery-banner.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, Play, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecoverableSession {
  id: string;
  type: 'analysis' | 'improvement';
  resumeId: string;
  resumeTitle: string;
  progress: number;
  lastActive: Date;
  canRecover: boolean;
  metadata?: any;
}

export function WorkflowRecoveryBanner() {
  const [dismissedSessions, setDismissedSessions] = useState<string[]>([]);

  const { data: recoverableSessions, isLoading } = useQuery({
    queryKey: ['recoverable-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/recovery/list');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      return data.sessions as RecoverableSession[];
    },
    staleTime: 30000, // Check every 30 seconds
  });

  if (isLoading || !recoverableSessions?.length) return null;

  const activeSessions = recoverableSessions.filter(
    session => !dismissedSessions.includes(session.id)
  );

  if (!activeSessions.length) return null;

  const handleResumeSession = async (session: RecoverableSession) => {
    // Navigate to appropriate page with recovery parameters
    const recoveryUrl = generateRecoveryUrl(session);
    window.location.href = recoveryUrl;
  };

  const handleDismissSession = (sessionId: string) => {
    setDismissedSessions(prev => [...prev, sessionId]);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <RefreshCw className="h-5 w-5 text-blue-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-2">
            Continue Your Work
          </h3>
          <p className="text-blue-700 text-sm mb-4">
            We found {activeSessions.length} incomplete {activeSessions.length === 1 ? 'workflow' : 'workflows'} 
            that you can resume.
          </p>
          
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <RecoverableSessionCard
                key={session.id}
                session={session}
                onResume={() => handleResumeSession(session)}
                onDismiss={() => handleDismissSession(session.id)}
              />
            ))}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissedSessions(activeSessions.map(s => s.id))}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function RecoverableSessionCard({ session, onResume, onDismiss }: {
  session: RecoverableSession;
  onResume: () => void;
  onDismiss: () => void;
}) {
  const [isResuming, setIsResuming] = useState(false);

  const handleResume = async () => {
    setIsResuming(true);
    try {
      await onResume();
    } finally {
      setIsResuming(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-blue-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-900">
              {session.resumeTitle}
            </span>
            <Badge variant="outline">
              {session.type}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Last active {formatDistanceToNow(new Date(session.lastActive))} ago</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${session.progress * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">
                {Math.round(session.progress * 100)}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 ml-4">
          <Button
            size="sm"
            onClick={handleResume}
            disabled={isResuming || !session.canRecover}
          >
            {isResuming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Resuming...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function generateRecoveryUrl(session: RecoverableSession): string {
  switch (session.type) {
    case 'analysis':
      return `/analyze?resume=${session.resumeId}&checkpoint=${session.id}`;
    case 'improvement':
      return `/improve?resume=${session.resumeId}&session=${session.id}`;
    default:
      return '/dashboard';
  }
}
```

#### 5.2 Integration with Dashboard
**File**: `components/dashboard/dashboard-content.tsx` (enhance existing)
```typescript
// Add to existing dashboard component
import { WorkflowRecoveryBanner } from '@/components/recovery/workflow-recovery-banner';

export function DashboardContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Add recovery banner at top */}
      <WorkflowRecoveryBanner />
      
      {/* Existing dashboard content */}
      {/* ... */}
    </div>
  );
}
```

### Phase 6: Testing and Optimization (Day 6-7)

#### 6.1 Create Testing Scripts
**File**: `scripts/test-auto-save.ts`
```typescript
// Comprehensive testing script for auto-save functionality
// Test checkpoint creation, recovery, cleanup, error handling
```

#### 6.2 Performance Optimization
- Monitor auto-save performance impact
- Implement batch saves for high-frequency updates
- Add indexes for checkpoint queries
- Set up cleanup cron job

### Phase 7: Background Cleanup Job (Day 7-8)

#### 7.1 Cleanup Cron Implementation
**File**: `app/api/cron/cleanup-checkpoints/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { StreamingAutoSave } from '@/lib/streaming-auto-save';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const autoSave = new StreamingAutoSave();
    await autoSave.cleanupOldCheckpoints();

    return NextResponse.json({ 
      success: true, 
      message: 'Checkpoint cleanup completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CLEANUP_CRON] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}
```

#### 7.2 Vercel Cron Configuration
**File**: `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-checkpoints",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Implementation Checklist

### Phase 1: Database Schema ✅
- [ ] Add AnalysisCheckpoint model to schema
- [ ] Add ImprovementSession model to schema  
- [ ] Add ProcessingStatus enum
- [ ] Update User and Resume model relations
- [ ] Run Prisma migration
- [ ] Verify database schema in production

### Phase 2: Background Infrastructure ✅
- [ ] Create StreamingAutoSave service class
- [ ] Implement BackgroundProcessor with job queue
- [ ] Add auto-save methods for analysis and improvement
- [ ] Add recovery methods for checkpoints
- [ ] Add cleanup functionality
- [ ] Test auto-save performance

### Phase 3: Enhanced Streaming ✅
- [ ] Update useStreamingAnalysis hook with auto-save
- [ ] Update useStreamingImprovement hook with auto-save
- [ ] Add recovery methods to hooks
- [ ] Test streaming with background saves
- [ ] Verify no performance degradation

### Phase 4: API Routes ✅
- [ ] Enhance streaming analysis API with checkpoints
- [ ] Enhance streaming improvement API with checkpoints
- [ ] Create recovery list API route
- [ ] Create resume session API route
- [ ] Create dismiss session API route
- [ ] Test all API endpoints

### Phase 5: Recovery UI ✅
- [ ] Create WorkflowRecoveryBanner component
- [ ] Create RecoverableSessionCard component
- [ ] Integrate banner with dashboard
- [ ] Add recovery URL generation
- [ ] Test recovery user flows
- [ ] Verify responsive design

### Phase 6: Testing ✅
- [ ] Create comprehensive test scripts
- [ ] Test checkpoint creation during streaming
- [ ] Test recovery from various states
- [ ] Test cleanup functionality
- [ ] Test error scenarios
- [ ] Performance testing

### Phase 7: Production Setup ✅
- [ ] Set up cleanup cron job
- [ ] Configure environment variables
- [ ] Set up monitoring for auto-save
- [ ] Deploy and test in production
- [ ] Monitor performance metrics
- [ ] Create rollback plan

## Success Criteria

- [x] Analysis progress auto-saved every 10 seconds during streaming
- [x] Improvement sessions persist through browser refresh/close
- [x] Job tailoring URL extraction data saved immediately
- [x] Recovery UI shows incomplete workflows on dashboard load
- [x] Users can resume exactly where they left off
- [x] Background processing doesn't impact app responsiveness
- [x] Automatic cleanup of expired/completed sessions
- [x] Error states properly saved and recoverable

## Risk Mitigation

### Performance Risks
- **Auto-save frequency**: Debounced saves to prevent excessive database writes
- **Database load**: Background processing with job queue
- **Memory usage**: Cleanup old checkpoints regularly

### Data Consistency Risks
- **Concurrent saves**: Upsert operations with proper constraints
- **Corrupted checkpoints**: Validation and error handling
- **Missing data**: Graceful fallbacks to sessionStorage

### User Experience Risks
- **Save failures**: Silent failures with logging, no user interruption
- **Recovery confusion**: Clear UI with progress indicators
- **Performance impact**: Non-blocking auto-save operations

## Dependencies

- **Database**: PostgreSQL with Prisma migrations
- **Authentication**: Clerk user authentication
- **File Storage**: UploadThing integration (completed in #7)
- **Background Jobs**: In-memory queue (can upgrade to Redis later)
- **Monitoring**: Error logging and performance tracking

## Related Issues

- **Issue #10**: Session State Recovery and Workflow Continuation (complementary UI features)
- **Issue #6**: Epic - Persistent CV Storage and Management System (parent epic)
- **Issue #7**: Enhanced File Storage with UploadThing Integration (dependency - completed)

## Estimated Timeline: 8-10 days

This comprehensive implementation will provide robust auto-save functionality with recovery mechanisms, ensuring users never lose their progress during CV processing workflows.