import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const accent = "#0B5CAB";

type Props = {
  name: string;
  email: string;
  company: string;
  message: string;
};

export function LogipartyLeadEmail({ name, email, company, message }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Access request from {name}</Preview>
      <Body style={main}>
        <Container style={wrapper}>
          <Text style={brand}>Logiparty</Text>
          <Heading style={h1}>New access request</Heading>
          <Text style={paragraph}>
            <strong>{name}</strong> requested early access.
          </Text>
          <Section style={meta}>
            <Text style={metaLine}>
              <strong>Email:</strong> {email}
            </Text>
            <Text style={metaLine}>
              <strong>Company:</strong> {company}
            </Text>
          </Section>
          <Text style={label}>Message</Text>
          <Text style={messageBox}>{message}</Text>
          <Text style={footer}>
            Reply directly to this thread to reach the contact.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f4f5f7",
  fontFamily: '"IBM Plex Sans", Helvetica, Arial, sans-serif',
};

const wrapper = {
  margin: "24px auto",
  padding: "28px 24px",
  maxWidth: "480px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  border: "1px solid #aeb6bf",
};

const brand = {
  fontSize: "13px",
  fontWeight: "700",
  color: accent,
  margin: "0 0 12px",
};

const h1 = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0 0 12px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#3f4650",
  margin: "0 0 16px",
};

const meta = { margin: "0 0 16px" };

const metaLine = {
  fontSize: "14px",
  lineHeight: "1.45",
  color: "#3f4650",
  margin: "0 0 6px",
};

const label = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#556274",
  margin: "0 0 6px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
};

const messageBox = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#1a1a1a",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
  padding: "12px",
  backgroundColor: "#f4f5f7",
  borderRadius: "6px",
  border: "1px solid #aeb6bf",
};

const footer = {
  fontSize: "12px",
  color: "#556274",
  margin: "20px 0 0",
};
