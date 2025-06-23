import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-middleware';
import { db } from '@/lib/db';
import { CreditTransactionType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult.error) {
      return authResult.error;
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') || '25')));
    const status = url.searchParams.get('status');
    const provider = url.searchParams.get('provider');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const search = url.searchParams.get('search');

    const skip = (page - 1) * limit;

    const whereConditions: any = {};
    if (dateFrom || dateTo) {
      whereConditions.createdAt = {};
      if (dateFrom) whereConditions.createdAt.gte = new Date(dateFrom);
      if (dateTo) whereConditions.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    let transactions: any[] = [];
    let totalCount = 0;

    // Fetch Stripe Transactions
    if (!provider || provider === 'stripe') {
        const stripeWhere: any = {
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
            const meta = event.metadata as any;
            return {
                id: event.id, provider: 'stripe', amount: meta.amount, currency: meta.currency?.toUpperCase() || 'MZN',
                status: 'completed', createdAt: event.createdAt, user: event.user, description: event.description,
            };
        }));
    }

    // Fetch MPesa Transactions
    if (!provider || provider === 'mpesa') {
        const mpesaWhere: any = { ...whereConditions };
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
            id: p.id, provider: 'mpesa', amount: p.amount, currency: 'MZN', status: p.status.toLowerCase(),
            createdAt: p.createdAt, user: p.user, description: `MPesa purchase for ${p.credits} credits`,
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

    return NextResponse.json({
      success: true,
      data: paginatedTransactions,
      pagination: { page, limit, total: totalCount, pages: Math.ceil(totalCount / limit) },
      summary,
      filters: { status, provider, dateFrom, dateTo, search },
    });

  } catch (error) {
    console.error('[ADMIN_TRANSACTIONS] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
} 