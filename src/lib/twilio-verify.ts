type TwilioVerification = {
  status?: string;
  message?: string;
};

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) return null;

  return { accountSid, authToken, serviceSid };
}

export function isTwilioVerifyConfigured() {
  return getTwilioConfig() !== null;
}

async function verifyRequest(path: string, body: URLSearchParams): Promise<TwilioVerification> {
  const config = getTwilioConfig();
  if (!config) throw new Error("Twilio Verify is not configured");

  const response = await fetch(`https://verify.twilio.com/v2/Services/${config.serviceSid}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as TwilioVerification;

  if (!response.ok) {
    throw new Error(data.message ?? "Twilio Verify request failed");
  }

  return data;
}

export function sendPhoneVerification(phone: string) {
  return verifyRequest("Verifications", new URLSearchParams({ To: phone, Channel: "sms" }));
}

export function checkPhoneVerification(phone: string, code: string) {
  return verifyRequest("VerificationCheck", new URLSearchParams({ To: phone, Code: code }));
}
