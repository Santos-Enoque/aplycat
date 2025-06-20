import crypto from 'crypto';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { PaymentStatus, CreditTransactionType } from '@prisma/client';
import { stripeClient } from '@/lib/stripe/client';
import type { CreditPackageType } from '@/lib/stripe/config';

// ===== TYPES AND INTERFACES =====
interface C2BPaymentData {
    customerNumber: string;
    amount: string;
    transactionReference: string;
    thirdPartyReference: string;
}

interface C2BPaymentResponse {
    output_ResponseCode: string;
    output_ResponseDesc: string;
    output_TransactionID: string;
    output_ConversationID: string;
    output_ThirdPartyReference: string;
}

interface QueryStatusResponse {
    output_ResponseCode: string;
    output_ResponseDesc: string;
    output_ResponseTransactionStatus: string;
    output_ConversationID: string;
    output_ThirdPartyReference: string;
    output_TransactionID?: string;
}

interface CreateMpesaPaymentData {
    userId: string;
    packageType: CreditPackageType;
    phoneNumber: string;
}

export interface MpesaPaymentResult {
    success: boolean;
    paymentId: string;
    conversationId?: string;
    message: string;
    requiresUserAction?: boolean;
    immediateResult: boolean;
    shouldRetryPolling?: boolean;
}

// ===== HELPER FUNCTIONS =====

/**
 * Validate and format Mozambique phone number for MPesa
 * Accepts both 258XXXXXXXXX and XXXXXXXXX formats
 */
function validateAndFormatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    const validPrefixes = ['82', '83', '84', '85', '86', '87'];
    
    // Check if it starts with 258 (full format)
    if (cleaned.startsWith('258')) {
        if (cleaned.length !== 12) {
            throw new Error('Invalid phone number. Full format should be 258XXXXXXXXX (12 digits total).');
        }
        
        const localNumber = cleaned.substring(3);
        const prefix = localNumber.substring(0, 2);
        
        if (!validPrefixes.includes(prefix)) {
            throw new Error(`Invalid phone number prefix. Valid prefixes: ${validPrefixes.join(', ')}`);
        }
        
        if (localNumber.length !== 9) {
            throw new Error('Invalid phone number. Local part should have 9 digits.');
        }
        
        return cleaned; // Already has 258 prefix
    }
    
    // Check if it's local format (9 digits starting with valid prefix)
    if (cleaned.length === 9) {
        const prefix = cleaned.substring(0, 2);
        
        if (!validPrefixes.includes(prefix)) {
            throw new Error(`Invalid phone number prefix. Valid prefixes: ${validPrefixes.join(', ')}`);
        }
        
        // Add 258 prefix for local numbers
        return `258${cleaned}`;
    }
    
    throw new Error('Invalid phone number format. Use 258XXXXXXXXX or XXXXXXXXX format with valid prefixes: ' + validPrefixes.join(', '));
}

/**
 * Generate unique transaction references
 */
function generateTransactionReferences() {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
    const uniqueId = randomUUID().slice(0, 8).toUpperCase();
    
    return {
        transactionReference: `MPESA${timestamp}`,
        thirdPartyReference: `APLYCAT${timestamp}${uniqueId}`
    };
}

/**
 * Get access token for MPesa API. Used for direct API calls like status checks.
 */
async function getAccessToken(): Promise<string> {
    const apiKey = process.env.MPESA_API_KEY;
    const publicKey = process.env.MPESA_PUBLIC_KEY;

    if (!apiKey || !publicKey) {
        throw new Error("MPesa API Key or Public Key is not configured in environment variables.");
    }

    try {
        // This is the critical step: replace literal '\\n' from the .env file with actual newline characters.
        const formattedPublicKey = publicKey.replace(/\\n/g, '\n');

        const buffer = Buffer.from(apiKey);
        
        const encrypted = crypto.publicEncrypt(
            {
                key: formattedPublicKey,
                padding: crypto.constants.RSA_PKCS1_PADDING,
            },
            buffer
        );

        return encrypted.toString('base64');
        
    } catch (error) {
        console.error('[MPESA_AUTH] Failed to encrypt API key:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('key format')) {
            throw new Error('Invalid public key format. Ensure MPESA_PUBLIC_KEY is a valid PEM format RSA public key with proper newlines in your .env file.');
        }
        
        throw new Error(`Failed to generate M-Pesa access token: ${errorMessage}`);
    }
}

// ===== MAIN SERVICE CLASS =====
export class MpesaService {
    private serviceProviderCode: string;

    constructor() {
        this.serviceProviderCode = process.env.MPESA_SERVICE_PROVIDER_CODE || '';
        
        if (!this.serviceProviderCode) {
            throw new Error('MPESA_SERVICE_PROVIDER_CODE is not configured');
        }
    }

    /**
     * Create a new MPesa payment with package information
     */
    async createPayment(data: CreateMpesaPaymentData): Promise<MpesaPaymentResult> {
        try {
            console.log(`[MPESA_SERVICE] Creating payment for user ${data.userId}, package: ${data.packageType}`);

            // Get package details from Stripe config (same system)
            const packageDetails = stripeClient.getCreditPackage(data.packageType);
            
            // Use test pricing for MPesa (5 MZN)
            const TEST_MPESA_PRICE = 5;
            
            // Validate and format phone number
            const formattedPhone = validateAndFormatPhoneNumber(data.phoneNumber);
            
            // Generate unique references
            const { transactionReference, thirdPartyReference } = generateTransactionReferences();

            // Store payment record in database with PENDING status
            const payment = await db.mpesaPayment.create({
                data: {
                    userId: data.userId,
                    packageType: data.packageType,
                    credits: packageDetails.credits,
                    amount: TEST_MPESA_PRICE, // Use test price instead of package price
                    customerMsisdn: formattedPhone,
                    transactionReference,
                    thirdPartyReference,
                    status: PaymentStatus.PENDING,
                }
            });

            // Initiate C2B payment with MPesa using test price
            const mpesaResponse = await this.initiateC2BPayment({
                customerNumber: formattedPhone,
                amount: TEST_MPESA_PRICE.toString(),
                transactionReference,
                thirdPartyReference
            });

            // Update payment record with MPesa response
            await db.mpesaPayment.update({
                where: { id: payment.id },
                data: {
                    mpesaConversationId: mpesaResponse.output_ConversationID,
                    mpesaResponseCode: mpesaResponse.output_ResponseCode,
                    mpesaResponseDescription: mpesaResponse.output_ResponseDesc,
                }
            });

            // Enhanced response code handling with immediate feedback
            const responseCode = mpesaResponse.output_ResponseCode;
            
            if (responseCode === 'INS-0') {
                console.log(`[MPESA_SERVICE] Payment initiated successfully: ${payment.id}`);
                
                return {
                    success: true,
                    paymentId: payment.id,
                    conversationId: mpesaResponse.output_ConversationID,
                    message: 'Payment initiated. Please check your phone for MPesa prompt.',
                    requiresUserAction: true,
                    immediateResult: false // Requires polling
                };
            } else {
                // Handle specific error codes immediately
                let status: PaymentStatus = PaymentStatus.FAILED;
                let userMessage = mpesaResponse.output_ResponseDesc;
                let requiresPolling = false;

                switch (responseCode) {
                    case 'INS-5':
                        userMessage = 'Transaction was cancelled by customer';
                        status = PaymentStatus.CANCELLED;
                        break;
                    case 'INS-6':
                        userMessage = 'Transaction failed';
                        break;
                    case 'INS-2006':
                        userMessage = 'Insufficient balance in your M-Pesa account';
                        break;
                    case 'INS-2051':
                        userMessage = 'Invalid phone number provided';
                        break;
                    case 'INS-9':
                        userMessage = 'Request timeout - please try again';
                        break;
                    case 'INS-10':
                        userMessage = 'Duplicate transaction - payment may already be processing';
                        // For duplicates, we might want to check status
                        requiresPolling = true;
                        status = PaymentStatus.PENDING;
                        break;
                    case 'INS-13':
                        userMessage = 'Invalid service provider code';
                        break;
                    case 'INS-15':
                        userMessage = 'Invalid amount specified';
                        break;
                    case 'INS-996':
                        userMessage = 'Your M-Pesa account is not active';
                        break;
                    case 'INS-997':
                        userMessage = 'Account linking issue - please contact support';
                        break;
                    default:
                        userMessage = mpesaResponse.output_ResponseDesc || 'Payment initiation failed';
                }

                // Update payment status
                await db.mpesaPayment.update({
                    where: { id: payment.id },
                    data: {
                        status,
                        mpesaResponseDescription: userMessage,
                    }
                });

                return {
                    success: false,
                    paymentId: payment.id,
                    message: userMessage,
                    requiresUserAction: false,
                    immediateResult: true, // No polling needed
                    shouldRetryPolling: requiresPolling // Only for specific cases like duplicates
                };
            }

        } catch (error) {
            console.error('[MPESA_SERVICE] Payment creation error:', error);
            
            return {
                success: false,
                paymentId: '',
                message: error instanceof Error ? error.message : 'Payment creation failed',
                immediateResult: true // No polling needed for errors
            };
        }
    }

    /**
     * Check payment status and update database with credit awarding
     */
    async checkPaymentStatus(paymentId: string): Promise<{ success: boolean; status: string; message: string }> {
        try {
            console.log(`[MPESA_SERVICE] Checking status for payment: ${paymentId}`);

            const payment = await db.mpesaPayment.findUnique({
                where: { id: paymentId }
            });

            if (!payment) {
                return { success: false, status: 'NOT_FOUND', message: 'Payment not found' };
            }

            if (!payment.mpesaConversationId || !payment.thirdPartyReference) {
                return { success: false, status: 'INVALID', message: 'Payment missing required references' };
            }

            // Query MPesa for status
            const statusResponse = await this.queryTransactionStatus(
                payment.mpesaConversationId,
                payment.thirdPartyReference
            );

            const transactionStatus = statusResponse.output_ResponseTransactionStatus;
            let newStatus: PaymentStatus = payment.status;
            let shouldUpdateCredits = false;

            // Map MPesa status to our status
            switch (transactionStatus) {
                case 'Completed':
                    newStatus = PaymentStatus.COMPLETED;
                    shouldUpdateCredits = true;
                    break;
                case 'Failed':
                    newStatus = PaymentStatus.FAILED;
                    break;
                case 'Cancelled':
                    newStatus = PaymentStatus.CANCELLED;
                    break;
                case 'Pending':
                    // Keep as pending for now
                    newStatus = PaymentStatus.PENDING;
                    break;
                default:
                    console.warn(`[MPESA_SERVICE] Unknown transaction status: ${transactionStatus}`);
            }

            // Update payment record
            const updateData: any = {
                status: newStatus,
                mpesaResponseDescription: statusResponse.output_ResponseDesc,
            };

            if (newStatus === PaymentStatus.COMPLETED) {
                updateData.mpesaTransactionId = statusResponse.output_TransactionID;
            }

            await db.mpesaPayment.update({
                where: { id: paymentId },
                data: updateData
            });

            // Award credits if payment completed and not already credited
            if (shouldUpdateCredits && payment.status !== PaymentStatus.COMPLETED) {
                console.log('[MPESA_SERVICE] Payment completed, starting credit award process...');
                try {
                    await this.awardCredits(payment);
                    console.log('[MPESA_SERVICE] Credit awarding completed successfully');
                } catch (error) {
                    console.error('[MPESA_SERVICE] Credit awarding failed, will retry on next status check:', error);
                    // Don't throw error here - let the status check continue
                }
            }

            return {
                success: true,
                status: newStatus,
                message: statusResponse.output_ResponseDesc || 'Status updated successfully'
            };

        } catch (error) {
            console.error('[MPESA_SERVICE] Status check error:', error);
            return {
                success: false,
                status: 'ERROR',
                message: error instanceof Error ? error.message : 'Status check failed'
            };
        }
    }

    /**
     * Award credits to user when payment completes (same logic as Stripe)
     */
    private async awardCredits(payment: any) {
        try {
            console.log(`[MPESA_SERVICE] Awarding ${payment.credits} credits to user ${payment.userId} for package ${payment.packageType}`);

            // Check if credits have already been awarded for this payment
            const existingTransaction = await db.creditTransaction.findFirst({
                where: {
                    userId: payment.userId,
                    description: {
                        contains: `Payment ID: ${payment.id}`
                    }
                }
            });

            if (existingTransaction) {
                console.log(`[MPESA_SERVICE] Credits already awarded for payment ${payment.id}, skipping...`);
                return;
            }

            // Use transaction to ensure atomicity with increased timeout
            const result = await db.$transaction(async (tx) => {
                // Get current user
                const user = await tx.user.findUnique({
                    where: { id: payment.userId },
                    select: { id: true, credits: true, email: true, clerkId: true },
                });

                if (!user) {
                    throw new Error('User not found during credit award');
                }

                // Add credits to user account
                const updatedUser = await tx.user.update({
                    where: { id: user.id },
                    data: { 
                        credits: { increment: payment.credits },
                    },
                });

                // Create credit transaction record
                const transaction = await tx.creditTransaction.create({
                    data: {
                        userId: user.id,
                        type: CreditTransactionType.PURCHASE,
                        amount: payment.credits,
                        description: `MPesa ${payment.packageType} pack - ${payment.credits} credits (Payment ID: ${payment.id})`,
                    },
                });

                return {
                    user: updatedUser,
                    transaction,
                    creditsAdded: payment.credits,
                    totalCredits: updatedUser.credits,
                    previousCredits: user.credits,
                };
            }, {
                timeout: 10000, // 10 second timeout for critical operations only
            });

            // Log successful purchase event outside of transaction
            try {
                await db.usageEvent.create({
                    data: {
                        userId: result.user.id,
                        eventType: 'CREDIT_PURCHASE',
                        description: `Successfully purchased ${payment.credits} credits via MPesa`,
                        metadata: {
                            paymentId: payment.id,
                            packageType: payment.packageType,
                            credits: payment.credits,
                            amount: payment.amount,
                            provider: 'mpesa',
                            transactionReference: payment.transactionReference,
                            mpesaTransactionId: payment.mpesaTransactionId,
                            previousCredits: result.previousCredits,
                            newCredits: result.totalCredits,
                            creditTransactionId: result.transaction.id,
                        },
                    },
                });
            } catch (logError) {
                console.warn('[MPESA_SERVICE] Failed to log usage event (non-critical):', logError);
            }

            console.log(`[MPESA_SERVICE] Successfully awarded ${result.creditsAdded} credits. User now has ${result.totalCredits} total credits.`);

        } catch (error) {
            console.error('[MPESA_SERVICE] Credit award error:', error);
            
            // Rethrow error so it can be handled by the caller
            throw error;
        }
    }

    /**
     * Initiate C2B payment with MPesa
     */
    private async initiateC2BPayment(data: C2BPaymentData): Promise<C2BPaymentResponse> {
        const accessToken = await getAccessToken();

        const payload = {
            input_TransactionReference: data.transactionReference,
            input_CustomerMSISDN: data.customerNumber,
            input_Amount: data.amount,
            input_ThirdPartyReference: data.thirdPartyReference,
            input_ServiceProviderCode: this.serviceProviderCode,
        };

        console.log(`[MPESA_SERVICE] Initiating C2B payment directly:`, {
            ...payload,
            input_CustomerMSISDN: `${data.customerNumber.substring(0, 6)}***`
        });

        const response = await fetch('https://api.vm.co.mz:18352/ipg/v1x/c2bPayment/singleStage/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Origin': '*'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('[MPESA_SERVICE] API error response:', errorBody);
            throw new Error(`MPesa API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Query transaction status from MPesa
     */
    private async queryTransactionStatus(queryReference: string, thirdPartyReference: string): Promise<QueryStatusResponse> {
    const accessToken = await getAccessToken();

    const queryParams = new URLSearchParams({
        input_QueryReference: queryReference,
        input_ThirdPartyReference: thirdPartyReference,
            input_ServiceProviderCode: this.serviceProviderCode,
    });

    const response = await fetch(`https://api.vm.co.mz:18353/ipg/v1x/queryTransactionStatus/?${queryParams}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Origin': '*'
        },
    });

        if (!response.ok) {
            throw new Error(`MPesa Status API error: ${response.status} ${response.statusText}`);
        }

    return response.json();
}

    /**
     * Save user phone number for future use
     */
    async saveUserPhoneNumber(clerkUserId: string, phoneNumber: string): Promise<void> {
        try {
            const formattedPhone = validateAndFormatPhoneNumber(phoneNumber);
            
            await db.user.update({
                where: { clerkId: clerkUserId },
                data: { phoneNumber: formattedPhone }
            });

            console.log(`[MPESA_SERVICE] Saved phone number for user ${clerkUserId}`);
        } catch (error) {
            console.error('[MPESA_SERVICE] Failed to save phone number:', error);
            // Don't throw - this is not critical for payment processing
        }
    }

    /**
     * Get user's saved phone number
     */
    async getUserPhoneNumber(clerkUserId: string): Promise<string | null> {
        try {
            const user = await db.user.findUnique({
                where: { clerkId: clerkUserId },
                select: { phoneNumber: true }
            });

            return user?.phoneNumber || null;
        } catch (error) {
            console.error('[MPESA_SERVICE] Failed to get user phone number:', error);
            return null;
        }
    }
}

// Export singleton instance
export const mpesaService = new MpesaService();