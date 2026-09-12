import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

const INK = "#2B221C";

export function MentionEmail({
  mentionerUsername,
  circleUrl,
  unsubscribeUrl,
}: {
  mentionerUsername: string;
  circleUrl: string;
  unsubscribeUrl?: string;
}) {
  return (
    <EmailLayout
      previewText="Someone mentioned you in your circle."
      heading="You were mentioned."
      ctaLabel="Go to my circle"
      ctaUrl={circleUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={{ fontSize: "15px", lineHeight: 1.7, color: INK, margin: 0 }}>
        {mentionerUsername} mentioned you in your circle. Come see what they said.
      </Text>
    </EmailLayout>
  );
}

export default MentionEmail;
