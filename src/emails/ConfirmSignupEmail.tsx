import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

const INK = "#2B221C";
const MUTED = "#7A6D62";

export function ConfirmSignupEmail({ confirmUrl }: { confirmUrl: string }) {
  return (
    <EmailLayout
      previewText="Confirm your email to finish joining Between Us."
      heading="One last step."
      ctaLabel="Confirm my email"
      ctaUrl={confirmUrl}
    >
      <Text style={{ fontSize: "15px", lineHeight: 1.7, color: INK, margin: 0 }}>
        Welcome to Between Us. Confirm this is your email address and your
        account is ready — you&apos;ll pick an anonymous username next, and
        nobody in your circle ever sees this address.
      </Text>
      <Text style={{ fontSize: "15px", lineHeight: 1.7, color: MUTED, margin: "16px 0 0" }}>
        If you didn&apos;t sign up for Between Us, you can ignore this email and
        no account will be created.
      </Text>
    </EmailLayout>
  );
}

export default ConfirmSignupEmail;
