import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromDB } from "@/lib/auth/user-sync";
import { mpesaService } from "@/lib/mpesa-service";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        console.log("[MPESA_STATUS] Checking payment status");

        // Get and validate user
        const user = await getCurrentUserFromDB();
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not authenticated" },
                { status: 401 }
            );
        }

        // Get payment ID from query parameters
        const { searchParams } = new URL(request.url);
        const paymentId = searchParams.get('paymentId');

        if (!paymentId) {
            return NextResponse.json(
                { success: false, message: "Payment ID is required" },
                { status: 400 }
            );
        }

        // Verify payment belongs to user
        const payment = await db.mpesaPayment.findFirst({
            where: {
                id: paymentId,
                userId: user.id
            },
            select: {
                id: true,
                status: true,
                amount: true,
                customerMsisdn: true,
                transactionReference: true,
                thirdPartyReference: true,
                mpesaConversationId: true,
                mpesaTransactionId: true,
                mpesaResponseCode: true,
                mpesaResponseDescription: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!payment) {
            return NextResponse.json(
                { success: false, message: "Payment not found" },
                { status: 404 }
            );
        }

        // Check current status with MPesa if payment is still pending
        if (payment.status === 'PENDING') {
            console.log(`[MPESA_STATUS] Checking status with MPesa for payment: ${paymentId}`);
            
            const statusResult = await mpesaService.checkPaymentStatus(paymentId);
            
            // Get updated payment after status check
            const updatedPayment = await db.mpesaPayment.findUnique({
                where: { id: paymentId },
                select: {
                    id: true,
                    status: true,
                    amount: true,
                    customerMsisdn: true,
                    transactionReference: true,
                    mpesaConversationId: true,
                    mpesaTransactionId: true,
                    mpesaResponseDescription: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            
            // Return updated status
            return NextResponse.json({
                success: true,
                payment: updatedPayment,
                statusCheck: {
                    checked: true,
                    message: statusResult.message,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            // Payment is already completed or failed, return current status
            return NextResponse.json({
                success: true,
                payment: {
                    ...payment,
                    // Mask phone number for security
                    customerMsisdn: payment.customerMsisdn ? `${payment.customerMsisdn.substring(0, 6)}***` : null
                },
                statusCheck: {
                    checked: false,
                    message: 'Payment status is final',
                    timestamp: new Date().toISOString()
                }
            });
        }

    } catch (error) {
        console.error("[MPESA_STATUS] Error checking payment status:", error);
        
        return NextResponse.json(
            { 
                success: false, 
                message: error instanceof Error ? error.message : "Internal server error" 
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log("[MPESA_STATUS] Manual status check requested");

        // Get and validate user
        const user = await getCurrentUserFromDB();
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not authenticated" },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { paymentId } = body;

        if (!paymentId) {
            return NextResponse.json(
                { success: false, message: "Payment ID is required" },
                { status: 400 }
            );
        }

        // Verify payment belongs to user
        const payment = await db.mpesaPayment.findFirst({
            where: {
                id: paymentId,
                userId: user.id
            }
        });

        if (!payment) {
            return NextResponse.json(
                { success: false, message: "Payment not found" },
                { status: 404 }
            );
        }

        // Force status check with MPesa
        console.log(`[MPESA_STATUS] Force checking status for payment: ${paymentId}`);
        
        const statusResult = await mpesaService.checkPaymentStatus(paymentId);
        
        // Get updated payment info
        const updatedPayment = await db.mpesaPayment.findUnique({
            where: { id: paymentId },
            select: {
                id: true,
                status: true,
                amount: true,
                customerMsisdn: true,
                transactionReference: true,
                mpesaConversationId: true,
                mpesaTransactionId: true,
                mpesaResponseDescription: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return NextResponse.json({
            success: true,
            payment: {
                ...updatedPayment,
                // Mask phone number for security  
                customerMsisdn: updatedPayment?.customerMsisdn ? `${updatedPayment.customerMsisdn.substring(0, 6)}***` : null
            },
            statusCheck: {
                checked: true,
                message: statusResult.message,
                timestamp: new Date().toISOString(),
                mpesaStatus: statusResult.status
            }
        });

    } catch (error) {
        console.error("[MPESA_STATUS] Error in manual status check:", error);
        
        return NextResponse.json(
            { 
                success: false, 
                message: error instanceof Error ? error.message : "Internal server error" 
            },
            { status: 500 }
        );
    }
} 