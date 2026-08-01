import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

const INK = "#2B221C";

export function ReengagementEmail({
  circleUrl,
  unsubscribeUrl,
}: {
  circleUrl: string;
  unsubscribeUrl: string;
}) {
  return (
    <EmailLayout
      previewText="Your circle is thinking of you"
      heading="You have been missed."
      ctaLabel="Return to your circle"
      ctaUrl={circleUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={{ fontSize: "15px", lineHeight: 1.7, color: INK, margin: 0 }}>
        Your circle is still here. There is no pressure, just knowing
        you can come back is sometimes enough.
      </Text>
    </EmailLayout>
  );
}

export default ReengagementEmail;
