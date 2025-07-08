import bcrypt from "bcrypt";
import prisma from "@/prisma-client/prismaClient";
import axios from "axios";
import logger from "@/utils/logger";

const OTP_EXPIRY_MINUTES = 5;
const SALT_ROUNDS = 10;

/**
 * Send SMS
 */
async function sendSms(phone: string, message: string): Promise<void> {
  // Validate required environment variables
  if (!process.env.SMS_API_KEY || !process.env.SMS_API_URL) {
    throw new Error("SMS API configuration is missing");
  }

  // Prepare SMS payload
  const smsPayload = new URLSearchParams();
  smsPayload.append("api_key", process.env.SMS_API_KEY);
  smsPayload.append("to", phone);
  smsPayload.append("msg", message);

  // Add sender ID if configured
  if (process.env.SMS_SENDER_ID) {
    smsPayload.append("sender_id", process.env.SMS_SENDER_ID);
  }

  // Send SMS
  const response = await axios.post(
    process.env.SMS_API_URL,
    smsPayload.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  // Check SMS API response
  if (response.data?.error !== 0) {
    console.error("SMS API Error:", response.data);
    throw new Error(
      `Failed to send SMS: ${response.data?.msg || "Unknown error"}`
    );
  }
  logger.info("SMS sent successfully:", response.data);
}

/**
 * Send OTP
 */
export async function sendOtp(phone: string) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otp.create({
    data: { phone, otpHash, expiresAt },
  });
  logger.info(`OTP for ${phone}: ${otp}`);

  // Send SMS with OTP
  const message = `Your OTP is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;
  return { otp }; // TODO: remove this line when in production
  // TODO: Enable the sendSMS function at production
  // await sendSms(phone, message);
}

/**
 * Verify OTP
 */
export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  const otpRecord = await prisma.otp.findFirst({
    where: { phone, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) return false;
  return bcrypt.compare(otp, otpRecord.otpHash);
}
