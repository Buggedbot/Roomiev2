"use client";

import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { Button, ErrorText, Input, Label } from "@/components/ui";

type PhoneOtpFormProps = {
  onVerified: (redirectTo: string) => void;
};

async function responseData(response: Response) {
  return (await response.json().catch(() => ({}))) as { error?: string; redirectTo?: string };
}

export function PhoneOtpForm({ onVerified }: PhoneOtpFormProps) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await responseData(response);
      if (!response.ok) {
        setError(data.error ?? "Unable to send a code");
        return;
      }
      setSent(true);
    } catch {
      setError("Unable to send a code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await responseData(response);
      if (!response.ok) {
        setError(data.error ?? "Unable to verify the code");
        return;
      }
      onVerified(data.redirectTo ?? "/profile/setup");
    } catch {
      setError("Unable to verify the code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-foreground/[0.025] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquareText className="h-4 w-4 text-primary" /> Continue with phone
      </div>
      <div>
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+91 9876543210"
          autoComplete="tel"
          disabled={sent || loading}
        />
        <p className="mt-1.5 text-xs text-muted">Include your country code, for example +91.</p>
      </div>

      {sent && (
        <div>
          <Label htmlFor="phone-code">Verification code</Label>
          <Input
            id="phone-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            placeholder="Enter the code"
            maxLength={10}
            disabled={loading}
          />
        </div>
      )}

      <ErrorText>{error}</ErrorText>

      {sent ? (
        <div className="flex gap-3">
          <Button type="button" variant="outline" disabled={loading} onClick={() => setSent(false)}>
            Change number
          </Button>
          <Button type="button" className="flex-1" disabled={loading || !code} onClick={verifyCode}>
            {loading ? "Verifying…" : "Verify code"}
          </Button>
        </div>
      ) : (
        <Button type="button" className="w-full" disabled={loading || !phone} onClick={sendCode}>
          {loading ? "Sending code…" : "Send verification code"}
        </Button>
      )}
    </div>
  );
}
