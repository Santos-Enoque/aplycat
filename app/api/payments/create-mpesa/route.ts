import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromDB } from "@/lib/auth/user-sync";
import { mpesaService } from "@/lib/mpesa-service";
import { stripeClient } from "@/lib/stripe/client";
import type { CreditPackageType } from "@/lib/stripe/config";

interface CreateMpesaPaymentRequest {
    packageType: CreditPackageType;
    phoneNumber: string;
    description?: string;
}

export async function POST(request: NextRequest) {
    try {
        console.log("[CREATE_MPESA] Processing MPesa payment request");

        // Get and validate user
        const user = await getCurrentUserFromDB();
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not authenticated" },
                { status: 401 }
            );
        }

        // Parse request body
        const body: CreateMpesaPaymentRequest = await request.json();
        const { packageType, phoneNumber, description } = body;

        // Validate required fields
        if (!packageType || !phoneNumber) {
            return NextResponse.json(
                { success: false, message: "Package type and phone number are required" },
                { status: 400 }
            );
        }

        // Get package details (same system as Stripe)
        let packageDetails;
        try {
            packageDetails = stripeClient.getCreditPackage(packageType);
        } catch (error) {
            return NextResponse.json(
                { success: false, message: "Invalid package type" },
                { status: 400 }
            );
        }

        console.log(`[CREATE_MPESA] Creating payment for user ${user.clerkId}: ${packageType} - ${packageDetails.credits} credits (${packageDetails.price} MZN)`);

        // Save user phone number for future use
        try {
            await mpesaService.saveUserPhoneNumber(user.clerkId, phoneNumber);
        } catch (error) {
            console.warn('[CREATE_MPESA] Failed to save phone number:', error);
            // Continue with payment even if saving phone fails
        }

        // Create MPesa payment using package system
        const paymentResult = await mpesaService.createPayment({
            userId: user.id,
            packageType: packageType,
            phoneNumber
        });

        if (paymentResult.success) {
            console.log(`[CREATE_MPESA] Payment initiated successfully: ${paymentResult.paymentId}`);
            
            return NextResponse.json({
                success: true,
                message: paymentResult.message,
                paymentId: paymentResult.paymentId,
                conversationId: paymentResult.conversationId,
                requiresUserAction: paymentResult.requiresUserAction,
                immediateResult: paymentResult.immediateResult,
                shouldRetryPolling: paymentResult.shouldRetryPolling,
                package: {
                    id: packageType,
                    name: packageDetails.name,
                    credits: packageDetails.credits,
                    price: packageDetails.price,
                },
                amount: packageDetails.price,
                currency: 'MZN',
                instructions: {
                    step1: "Check your phone for an MPesa payment prompt",
                    step2: "Enter your MPesa PIN to confirm the payment",
                    step3: "Wait for payment confirmation",
                    timeout: "Payment request will expire in 2 minutes"
                }
            });
        } else {
            console.error(`[CREATE_MPESA] Payment failed: ${paymentResult.message}`);
            
            return NextResponse.json({
                success: false,
                message: paymentResult.message,
                paymentId: paymentResult.paymentId,
                immediateResult: paymentResult.immediateResult,
                shouldRetryPolling: paymentResult.shouldRetryPolling
            }, { status: 400 });
        }

    } catch (error) {
        console.error("[CREATE_MPESA] Error creating MPesa payment:", error);
        
        return NextResponse.json(
            { 
                success: false, 
                message: error instanceof Error ? error.message : "Internal server error" 
            },
            { status: 500 }
        );
    }
}

// GET method to retrieve available packages and user's saved phone number
export async function GET() {
    try {
        const user = await getCurrentUserFromDB();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user's saved phone number
        const savedPhoneNumber = await mpesaService.getUserPhoneNumber(user.clerkId);
        
        // Get all available packages (same as Stripe)
        const packages = stripeClient.getAllCreditPackages().map(pkg => ({
            id: pkg.id,
            name: pkg.name,
            credits: pkg.credits,
            price: pkg.price,
            currency: 'MZN',
            pricePerCredit: pkg.pricePerCredit,
            description: pkg.description
        }));

        return NextResponse.json({
            success: true,
            packages,
            user: {
                savedPhoneNumber,
                hasPhoneNumber: !!savedPhoneNumber
            },
            paymentMethod: 'mpesa',
            currency: 'MZN',
            limits: {
                minimum: 1,
                maximum: 10000,
                currency: 'MZN'
            }
        });

    } catch (error) {
        console.error("[GET_MPESA_INFO] Error:", error);
        
        return NextResponse.json(
            { error: 'Failed to get payment information' },
            { status: 500 }
        );
    }
} 