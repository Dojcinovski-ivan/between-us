import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

const INK = "#2B221C";

export function CircleFormedEmail({ circleUrl }: { circleUrl: string }) {
  return (
    <EmailLayout
      previewText="Your circle just formed."
      heading="Someone just joined your circle."
      ctaLabel="Enter your circle"
      ctaUrl={circleUrl}
    >
      <Text style={{ fontSize: "15px", lineHeight: 1.7, color: INK, margin: 0 }}>
        You are not waiting alone anymore. Someone who understands is
        here.
      </Text>
    </EmailLayout>
  );
}

export default CircleFormedEmail;
