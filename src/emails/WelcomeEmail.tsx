import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

const INK = "#2B221C";

export function WelcomeEmail({ circleUrl }: { circleUrl: string }) {
  return (
    <EmailLayout
      previewText="You found your circle."
      heading="You found your circle."
      ctaLabel="Enter your circle"
      ctaUrl={circleUrl}
    >
      <Text style={{ fontSize: "15px", lineHeight: 1.7, color: INK, margin: 0 }}>
        Welcome to Between Us. Your circle is ready. You do not have to
        share anything right away, just being here is enough.
      </Text>
    </EmailLayout>
  );
}

export default WelcomeEmail;
