import { OrderStatus } from "@/generated/prisma/client";

export function getOrderStatusMessage(
  status: OrderStatus,
  orderId: bigint
): string {
  switch (status) {
    case "CONFIRMED":
      return `ধন্যবাদ! আপনার অর্ডারটি সফলভাবে নিশ্চিত হয়েছে। আমরা শীঘ্রই প্রসেসিং শুরু করব। (অর্ডার আইডিঃ #${orderId})`;
    case "PROCESSING":
      return `আপনার অর্ডারটি এখন প্রসেস করা হচ্ছে। খুব দ্রুতই শিপ করা হবে। (অর্ডার আইডিঃ #${orderId})`;
    case "SHIPPED":
      return `আপনার অর্ডারটি এখন শিপ করা হয়েছে! শীঘ্রই আপনার ঠিকানায় পৌঁছাবে। (অর্ডার আইডিঃ #${orderId})`;
    case "DELIVERED":
      return `অভিনন্দন! আপনার অর্ডারটি সফলভাবে ডেলিভারি হয়েছে। আমাদের সাথে থাকার জন্য ধন্যবাদ! (অর্ডার আইডিঃ #${orderId})`;
    case "CANCELLED":
      return `আপনার অর্ডারটি বাতিল করা হয়েছে। যদি এটি ভুলবশত হয়ে থাকে, অনুগ্রহ করে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন। (অর্ডার আইডিঃ #${orderId})`;
    default:
      return `আপনার অর্ডার #${orderId} এর স্ট্যাটাস "${status}" এ আপডেট হয়েছে। আরও তথ্যের জন্য আমাদের সাথে থাকুন।`;
  }
}
