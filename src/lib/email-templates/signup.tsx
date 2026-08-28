import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'

import {
  main,
  container,
  brandName,
  brandAccent,
  h1,
  text,
  link,
  codeWrap,
  codeText,
  footer,
} from './brand'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  token?: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  token,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {siteName} verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandName}>
          MedEu<span style={brandAccent}>.Ai</span>
        </Text>
        <Heading style={h1}>Verify your email</Heading>
        <Text style={text}>
          Thanks for signing up for{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          ! Enter this 6-digit code to activate your account (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ):
        </Text>
        {token ? (
          <Container style={codeWrap}>
            <Text style={codeText}>{token}</Text>
          </Container>
        ) : null}
        <Text style={footer}>
          This code expires shortly. If you didn't create an account, you can
          safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
