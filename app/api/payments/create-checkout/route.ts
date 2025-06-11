// app/api/payments/create-checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromDB } from "@/lib/auth/user-sync";
import { paymentService, PaymentMethod } from "@/lib/services/payment-service";

interface CreateCheckoutRequest {
  packageType: string;
  paymentMethod?: PaymentMethod; // 'credit_card' | 'mobile_money'
  returnUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromDB();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const body: CreateCheckoutRequest = await request.json();
    const { packageType, paymentMethod = 'credit_card', returnUrl } = body;

    if (!packageType || !returnUrl) {
      return NextResponse.json(
        { error: "Package type and return URL are required" },
        { status: 400 }
      );
    }

    // Validate payment method
    const validPaymentMethods: PaymentMethod[] = ['credit_card', 'mobile_money'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if payment method is supported
    const availableMethods = paymentService.getAvailablePaymentMethods(packageType as any);
    if (!availableMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { 
          error: `Payment method ${paymentMethod} is not supported for package ${packageType}`,
          supportedMethods: availableMethods
        },
        { status: 400 }
      );
    }

    console.log(`[CHECKOUT] Creating ${paymentMethod} checkout for user ${user.id}, package: ${packageType}`);

    // Create checkout session with the specified payment method
    const result = await paymentService.createCheckout({
      userId: user.clerkId,
      packageType: packageType as any,
      userEmail: user.email,
      paymentMethod,
      returnUrl,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      checkoutId: result.checkoutId,
      provider: result.provider,
      paymentMethod: result.paymentMethod,
      package: {
        id: packageType,
        name: result.packageDetails.name,
        credits: result.packageDetails.credits,
        price: result.packageDetails.price,
      }
    });

  } catch (error) {
    console.error("[CREATE_CHECKOUT] Error creating checkout session:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}

// Add GET method to retrieve available packages and payment methods
export async function GET() {
  try {
    const packages = paymentService.getCreditPackages();
    
    // Add payment method availability info
    const packagesWithPaymentInfo = Object.entries(packages).map(([key, pkg]: [string, { name: string; credits: number; price: number; description?: string }]) => ({
      id: key,
      name: pkg.name,
      credits: pkg.credits,
      price: pkg.price,
      description: pkg.description || `${pkg.credits} AI credits for your resume needs`,
      pricePerCredit: `$${(pkg.price / pkg.credits).toFixed(2)}`,
      supportedMethods: paymentService.getAvailablePaymentMethods(key as any),
      paymentOptions: {
        creditCard: true,
        mobileMoney: true,
      }
    }));

    return NextResponse.json({
      success: true,
      packages: packagesWithPaymentInfo,
      availablePaymentMethods: ['credit_card', 'mobile_money'],
      defaultPaymentMethod: 'credit_card'
    });

  } catch (error) {
    console.error("[GET_PACKAGES] Error retrieving packages:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to retrieve packages" 
      },
      { status: 500 }
    );
  }
}