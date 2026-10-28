import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  orgName: string;
  headline: string;
  body: string;
  actionLabel?: string;
  actionUrl?: string;
};

export function EventEmail({
  orgName,
  headline,
  body,
  actionLabel,
  actionUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{headline}</Preview>
      <Body style={main}>
        <Container style={wrapper}>
          <Text style={brand}>{orgName}</Text>
          <Heading style={h1}>{headline}</Heading>
          <Text style={paragraph}>{body}</Text>
          {actionLabel && actionUrl ? (
            <Section style={btnWrap}>
              <Button style={button} href={actionUrl}>
                {actionLabel}
              </Button>
            </Section>
          ) : null}
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    'Helvetica, Arial, sans-serif',
};

const wrapper = {
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "480px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
};

const brand = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#1e3a5f",
  margin: "0 0 16px",
};

const h1 = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#18181b",
  margin: "0 0 12px",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "1.5",
  color: "#52525b",
  margin: "0 0 16px",
  whiteSpace: "pre-wrap" as const,
};

const btnWrap = { margin: "8px 0 0" };

const button = {
  backgroundColor: "#1e3a5f",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "10px 16px",
};

export default EventEmail;
