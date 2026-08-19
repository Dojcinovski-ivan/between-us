import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

const INK = "#2B221C";
const MUTED = "#7A6D62";

export function ResetPasswordEmail({ resetUrl }: { resetUrl: string }) {
  return (
    <EmailLayout
      previewText="Set a new password for your Between Us account."
      heading="Set a new password."
      ctaLabel="Choose a new password"
      ctaUrl={resetUrl}
    >
      <Text style={{ fontSize: "15px", lineHeight: 1.7, color: INK, margin: 0 }}>
        Someone asked to reset the password on your Between Us account. Use the
        button below to choose a new one. The link works once and expires in
        about an hour.
      </Text>
      <Text style={{ fontSize: "15px", lineHeight: 1.7, color: MUTED, margin: "16px 0 0" }}>
        If this wasn&apos;t you, you can ignore this email — your password stays
        exactly as it is.
      </Text>
    </EmailLayout>
  );
}

export default ResetPasswordEmail;
