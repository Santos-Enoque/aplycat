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

    // Build where conditions
    const whereConditions: any = {};

    // Date range filter
    if (dateFrom || dateTo) {
      whereConditions.createdAt = {};
      if (dateFrom) {
        whereConditions.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereConditions.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }

    // Get Stripe transactions (credit purchases) - exclude those from M-Pesa/PaySuite
    const stripeWhereConditions = {
      ...whereConditions,
      type: CreditTransactionType.PURCHASE,
      // Exclude M-Pesa and PaySuite credit transactions to avoid duplicates
      AND: [
        { NOT: { description: { contains: "MPESA", mode: 'insensitive' as const } } },
        { NOT: { description: { contains: "PAYSUITE", mode: 'insensitive' as const } } },
      ],
    };

    // Search filter for Stripe
    if (search) {
      stripeWhereConditions.AND = [
        ...stripeWhereConditions.AND,
        {
          OR: [
            { description: { contains: search, mode: 'insensitive' } },
            { user: { firstName: { contains: search, mode: 'insensitive' } } },
            { user: { lastName: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ]
        }
      ];
    }

    const [stripeTransactions, stripeTotal] = await Promise.all([
      (!provider || provider === 'stripe') ? db.creditTransaction.findMany({
        where: stripeWhereConditions,
        include: {
          user: {
            select: {
              id: true,
              clerkId: true,
              firstName: true,
              lastName: true,
              email: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: provider === 'stripe' ? skip : 0,
        take: provider === 'stripe' ? limit : undefined,
      }) : [],
      (!provider || provider === 'stripe') ? db.creditTransaction.count({
        where: stripeWhereConditions,
      }) : 0,
    ]);

    // Get MPesa transactions
    const mpesaWhereConditions = {
      ...whereConditions,
    };

    // Status filter for MPesa
    if (status) {
      mpesaWhereConditions.status = status.toUpperCase();
    }

    // Search filter for MPesa
    if (search) {
      mpesaWhereConditions.OR = [
        { customerMsisdn: { contains: search } },
        { transactionReference: { contains: search } },
        { mpesaTransactionId: { contains: search } },
      ];
    }

    const [mpesaTransactions, mpesaTotal] = await Promise.all([
      (!provider || provider === 'mpesa') ? db.mpesaPayment.findMany({
        where: mpesaWhereConditions,
        include: {
          user: {
            select: {
              id: true,
              clerkId: true,
              firstName: true,
              lastName: true,
              email: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: provider === 'mpesa' ? skip : 0,
        take: provider === 'mpesa' ? limit : undefined,
      }) : [],
      (!provider || provider === 'mpesa') ? db.mpesaPayment.count({
        where: mpesaWhereConditions,
      }) : 0,
    ]);

    // Transform and combine transactions
    const allTransactions = [
      // Stripe transactions
      ...stripeTransactions.map(tx => ({
        id: tx.id,
        type: 'credit_purchase',
        provider: 'stripe' as const,
        amount: Math.abs(tx.amount),
        description: tx.description,
        status: 'completed',
        createdAt: tx.createdAt,
        completedAt: tx.createdAt,
        user: tx.user,
        credits: Math.abs(tx.amount),
        currency: 'USD',
        paymentMethod: 'credit_card',
        reference: null,
        phoneNumber: null,
        errorMessage: null,
      })),

      // MPesa transactions
      ...mpesaTransactions.map(payment => ({
        id: payment.id,
        type: 'credit_purchase',
        provider: 'mpesa' as const,
        packageType: payment.packageType,
        credits: payment.credits,
        amount: payment.amount,
        currency: 'MZN',
        status: payment.status.toLowerCase(),
        paymentMethod: 'mpesa',
        phoneNumber: payment.customerMsisdn,
        reference: payment.transactionReference,
        mpesaTransactionId: payment.mpesaTransactionId,
        conversationId: payment.mpesaConversationId,
        createdAt: payment.createdAt,
        completedAt: null,
        errorMessage: payment.mpesaResponseDescription,
        user: payment.user,
      }))
    ];

    // Sort combined transactions
    const sortedTransactions = allTransactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination for combined results
    let paginatedTransactions = sortedTransactions;
    let totalCount = stripeTotal + mpesaTotal;

    if (!provider) {
      paginatedTransactions = sortedTransactions.slice(skip, skip + limit);
    } else {
      totalCount = provider === 'stripe' ? stripeTotal : mpesaTotal;
    }

    // Status filter for combined results
    if (status && !provider) {
      const filteredTransactions = paginatedTransactions.filter(tx => 
        tx.status.toLowerCase() === status.toLowerCase()
      );
      paginatedTransactions = filteredTransactions;
      // Note: This affects pagination accuracy for combined results
    }

    // Calculate summary statistics
    const completedTransactions = sortedTransactions.filter(tx => 
      tx.status === 'completed' || tx.status === 'COMPLETED'
    );
    
    // Calculate revenue in MZN (convert USD to MZN for display)
    const usdToMznRate = 64; // Approximate exchange rate
    const totalRevenue = completedTransactions.reduce((sum, tx) => {
      if (tx.provider === 'stripe') {
        const usdAmount = tx.amount / 100; // Convert cents to dollars
        return sum + (usdAmount * usdToMznRate); // Convert to MZN
      } else if (tx.provider === 'mpesa') {
        return sum + tx.amount; // Already in MZN
      }
      return sum;
    }, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayTransactions = completedTransactions.filter(tx => 
      new Date(tx.createdAt) >= todayStart
    );
    
    const todayRevenue = todayTransactions.reduce((sum, tx) => {
      if (tx.provider === 'stripe') {
        const usdAmount = tx.amount / 100;
        return sum + (usdAmount * usdToMznRate); // Convert to MZN
      } else if (tx.provider === 'mpesa') {
        return sum + tx.amount; // Already in MZN
      }
      return sum;
    }, 0);

    const summary = {
      totalTransactions: totalCount,
      completedTransactions: completedTransactions.length,
      pendingTransactions: sortedTransactions.filter(tx => 
        tx.status === 'pending' || tx.status === 'PENDING'
      ).length,
      failedTransactions: sortedTransactions.filter(tx => 
        tx.status === 'failed' || tx.status === 'FAILED' || tx.status === 'CANCELLED'
      ).length,
      totalRevenue: totalRevenue,
      todayRevenue: todayRevenue,
      todayTransactions: todayTransactions.length,
    };

    return NextResponse.json({
      success: true,
      data: paginatedTransactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      summary,
      filters: {
        status,
        provider,
        dateFrom,
        dateTo,
        search,
      },
    });
  } catch (error) {
    console.error('[ADMIN_TRANSACTIONS] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 