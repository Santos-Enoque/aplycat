import { NextRequest } from 'next/server';
import { createSuccessResponse, handleApiError, CommonErrors, validateRequiredFields } from '@/lib/utils/api-response';
import { requireAdminAuth } from '@/lib/middleware/auth';
import { db } from '@/lib/db';
import { CreditTransactionType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') || '25')));
    const status = url.searchParams.get('status');
    const provider = url.searchParams.get('provider');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const search = url.searchParams.get('search');

    const skip = (page - 1) * limit;

    interface WhereConditions {
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    }
    
    const whereConditions: WhereConditions = {};
    if (dateFrom || dateTo) {
      whereConditions.createdAt = {};
      if (dateFrom) whereConditions.createdAt.gte = new Date(dateFrom);
      if (dateTo) whereConditions.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    interface TransactionData {
      id: string;
      provider: 'stripe' | 'mpesa';
      amount: number;
      currency: string;
      status: string;
      createdAt: Date;
      user: { email: string; id: string };
      description: string;
      credits?: number;
    }
    
    let transactions: TransactionData[] = [];
    let totalCount = 0;

    // Fetch Stripe Transactions
    if (!provider || provider === 'stripe') {
        const stripeWhere: Record<string, unknown> = {
            ...whereConditions,
            eventType: 'CREDIT_PURCHASE',
            metadata: { path: ['provider'], equals: 'stripe' }
        };
        if (search) {
            stripeWhere.OR = [
                { description: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } }
            ];
        }
        const stripeTransactions = await db.usageEvent.findMany({
            where: stripeWhere,
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
        transactions.push(...stripeTransactions.map(event => {
            const meta = event.metadata as Record<string, unknown>;
            const status = meta.status || 'completed'; // Default for legacy
            return {
                id: event.id, 
                provider: 'stripe' as const, 
                amount: Number(meta.amount) || 0, 
                currency: String(meta.currency).toUpperCase() || 'MZN',
                status: String(status), 
                createdAt: event.createdAt, 
                user: event.user || { id: '', email: 'Unknown' }, 
                description: event.description || '',
                credits: Number(meta.credits) || 0,
            };
        }));
    }

    // Fetch MPesa Transactions
    if (!provider || provider === 'mpesa') {
        const mpesaWhere: Record<string, unknown> = { ...whereConditions };
        if (status) mpesaWhere.status = status.toUpperCase();
        if (search) {
          mpesaWhere.OR = [
            { customerMsisdn: { contains: search } },
            { user: { email: { contains: search, mode: 'insensitive' } } }
          ];
        }
        const mpesaTransactions = await db.mpesaPayment.findMany({
            where: mpesaWhere,
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
        transactions.push(...mpesaTransactions.map(p => ({
            id: p.id, 
            provider: 'mpesa' as const, 
            amount: p.amount, 
            currency: 'MZN', 
            status: p.status.toLowerCase(),
            createdAt: p.createdAt, 
            user: p.user || { id: '', email: 'Unknown' }, 
            description: `MPesa purchase for ${p.credits} credits`,
        })));
    }
    
    // Sort all transactions by date
    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    totalCount = transactions.length;
    const paginatedTransactions = transactions.slice(skip, skip + limit);

    const summary = {
      totalTransactions: totalCount,
      completedTransactions: transactions.filter(tx => tx.status === 'completed').length,
      pendingTransactions: transactions.filter(tx => tx.status === 'pending').length,
      failedTransactions: transactions.filter(tx => tx.status === 'failed' || tx.status === 'cancelled').length,
      totalRevenue: transactions.filter(tx => tx.status === 'completed').reduce((sum, tx) => sum + (tx.currency === 'MZN' ? tx.amount : (tx.amount * 64)), 0),
      todayRevenue: 0,
      todayTransactions: 0,
    };

    return createSuccessResponse({
      transactions: paginatedTransactions,
      pagination: { page, limit, total: totalCount, pages: Math.ceil(totalCount / limit) },
      summary,
      filters: { status, provider, dateFrom, dateTo, search },
    });

  } catch (error) {
    return handleApiError(error, 'ADMIN_TRANSACTIONS');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdminAuth();

    const url = new URL(request.url);
    const transactionId = url.searchParams.get('id');
    const provider = url.searchParams.get('provider');

    const missingFields = validateRequiredFields(
      { transactionId, provider },
      ['transactionId', 'provider']
    );

    if (missingFields.length > 0) {
      return CommonErrors.missingFields(missingFields);
    }

    console.log(`[ADMIN_DELETE] Attempting to delete ${provider} transaction: ${transactionId}`);

    let deletedTransaction = null;

    if (provider === 'stripe') {
      // Delete Stripe transaction (usageEvent)
      deletedTransaction = await db.usageEvent.delete({
        where: { id: transactionId! },
        include: { user: true }
      });
      
      console.log(`[ADMIN_DELETE] Deleted Stripe transaction: ${transactionId}`);
    } else if (provider === 'mpesa') {
      // Delete MPesa transaction
      deletedTransaction = await db.mpesaPayment.delete({
        where: { id: transactionId! },
        include: { user: true }
      });
      
      console.log(`[ADMIN_DELETE] Deleted MPesa transaction: ${transactionId}`);
    } else {
      return CommonErrors.invalidInput(`Unsupported provider: ${provider}`);
    }

    return createSuccessResponse({
      message: 'Transaction deleted successfully',
      deletedTransaction: {
        id: deletedTransaction.id,
        provider,
        userEmail: deletedTransaction.user?.email || 'N/A',
      }
    });

  } catch (error) {
    console.error('[ADMIN_DELETE] Error deleting transaction:', error);
    
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return handleApiError(error, 'ADMIN_DELETE');
  }
} 