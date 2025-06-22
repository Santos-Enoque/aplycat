import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-middleware';
import { paymentService } from '@/lib/services/payment-service';

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
    
    // Fetch all transactions from the centralized service
    let allTransactions = await paymentService.getPaymentHistory();

    // Apply filters on the combined data
    if (provider) {
      allTransactions = allTransactions.filter(tx => tx.provider === provider);
    }
    if (status) {
      allTransactions = allTransactions.filter(tx => tx.status && tx.status.toLowerCase() === status.toLowerCase());
    }
    if (dateFrom) {
      allTransactions = allTransactions.filter(tx => new Date(tx.createdAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      allTransactions = allTransactions.filter(tx => new Date(tx.createdAt) <= new Date(dateTo + 'T23:59:59.999Z'));
    }
    if (search) {
      const lowercasedSearch = search.toLowerCase();
      allTransactions = allTransactions.filter(tx => 
        (tx.user?.firstName?.toLowerCase().includes(lowercasedSearch)) ||
        (tx.user?.lastName?.toLowerCase().includes(lowercasedSearch)) ||
        (tx.user?.email?.toLowerCase().includes(lowercasedSearch)) ||
        (tx.id.includes(lowercasedSearch))
      );
    }

    // Calculate summary statistics on the filtered data
    const completedTransactions = allTransactions.filter(tx => tx.status === 'completed');
    const usdToMznRate = 64; // Approximate rate for revenue calculation
    const totalRevenue = completedTransactions.reduce((sum, tx) => {
      if (tx.currency === 'MZN') {
        return sum + tx.amount;
      }
      if (tx.currency === 'USD') {
        return sum + (tx.amount * usdToMznRate);
      }
      return sum;
    }, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTransactions = completedTransactions.filter(tx => new Date(tx.createdAt) >= todayStart);
    const todayRevenue = todayTransactions.reduce((sum, tx) => {
        if (tx.currency === 'MZN') return sum + tx.amount;
        if (tx.currency === 'USD') return sum + (tx.amount * usdToMznRate);
        return sum;
    }, 0);


    // Apply pagination to the filtered data
    const totalCount = allTransactions.length;
    const paginatedTransactions = allTransactions.slice((page - 1) * limit, page * limit);

    const summary = {
      totalTransactions: totalCount,
      completedTransactions: completedTransactions.length,
      pendingTransactions: allTransactions.filter(tx => tx.status === 'pending').length,
      failedTransactions: allTransactions.filter(tx => tx.status === 'failed' || tx.status === 'cancelled').length,
      totalRevenue,
      todayRevenue,
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
      filters: { status, provider, dateFrom, dateTo, search },
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