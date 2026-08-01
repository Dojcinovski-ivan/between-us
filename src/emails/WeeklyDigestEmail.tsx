import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

const INK = "#2B221C";
const MUTED = "#7A6D62";

export function WeeklyDigestEmail({
  circleUrl,
  unsubscribeUrl,
  promptContent,
  posterCount,
}: {
  circleUrl: string;
  unsubscribeUrl: string;
  promptContent: string | null;
  posterCount: number;
}) {
  return (
    <EmailLayout
      previewText="This week in your circle"
      heading="Your circle this week"
      ctaLabel="Join the conversation"
      ctaUrl={circleUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      {promptContent && (
        <Text
          style={{
            fontSize: "15px",
            lineHeight: 1.7,
            color: INK,
            fontStyle: "italic",
            margin: "0 0 16px",
          }}
        >
          {"“"}
          {promptContent}
          {"”"}
        </Text>
      )}

      <Text style={{ fontSize: "15px", lineHeight: 1.7, color: MUTED, margin: 0 }}>
        {posterCount > 0
          ? `${posterCount} ${posterCount === 1 ? "person" : "people"} shared something this week.`
          : "Your circle is quiet this week. Sometimes just showing up is enough."}
      </Text>
    </EmailLayout>
  );
}

export default WeeklyDigestEmail;
