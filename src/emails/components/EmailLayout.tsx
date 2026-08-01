import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const CREAM = "#F7F3EE";
const TERRACOTTA = "#C4846A";
const INK = "#2B221C";
const MUTED = "#7A6D62";

const headingFont =
  "'Fraunces', Georgia, 'Times New Roman', serif";
const bodyFont =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export function EmailLayout({
  previewText,
  heading,
  children,
  ctaLabel,
  ctaUrl,
  unsubscribeUrl,
}: {
  previewText: string;
  heading: string;
  children: React.ReactNode;
  ctaLabel: string;
  ctaUrl: string;
  unsubscribeUrl?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: CREAM, fontFamily: bodyFont, margin: 0, padding: 0 }}>
        <Container
          style={{
            maxWidth: "480px",
            margin: "0 auto",
            padding: "48px 24px",
          }}
        >
          <Text
            style={{
              fontFamily: headingFont,
              fontSize: "20px",
              color: INK,
              marginBottom: "32px",
            }}
          >
            Between Us
          </Text>

          <Heading
            as="h1"
            style={{
              fontFamily: headingFont,
              fontSize: "28px",
              fontWeight: 500,
              color: INK,
              lineHeight: 1.2,
              margin: "0 0 16px",
            }}
          >
            {heading}
          </Heading>

          <Section>{children}</Section>

          <Section style={{ marginTop: "32px" }}>
            <Link
              href={ctaUrl}
              style={{
                backgroundColor: TERRACOTTA,
                color: "#ffffff",
                padding: "14px 28px",
                borderRadius: "999px",
                fontSize: "15px",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              {ctaLabel}
            </Link>
          </Section>

          <Hr style={{ borderColor: "#E8DDD4", margin: "40px 0 24px" }} />

          <Text style={{ fontSize: "12px", lineHeight: 1.6, color: MUTED, margin: 0 }}>
            In crisis right now? Visit{" "}
            <Link href="https://findahelpline.com" style={{ color: MUTED, textDecoration: "underline" }}>
              findahelpline.com
            </Link>{" "}
            to find help in your country.
          </Text>

          {unsubscribeUrl && (
            <Text style={{ fontSize: "12px", lineHeight: 1.6, color: MUTED, margin: "8px 0 0" }}>
              <Link href={unsubscribeUrl} style={{ color: MUTED, textDecoration: "underline" }}>
                Unsubscribe
              </Link>{" "}
              from these emails at any time.
            </Text>
          )}
        </Container>
      </Body>
    </Html>
  );
}
