import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
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
  codeWrap,
  codeText,
  footer,
} from './brand'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
  token?: string
}

export const RecoveryEmail = ({ siteName, token }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {siteName} password reset code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandName}>
          MedEu<span style={brandAccent}>.Ai</span>
        </Text>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset your {siteName} password. Enter this
          6-digit code in the app to choose a new password:
        </Text>
        {token ? (
          <Container style={codeWrap}>
            <Text style={codeText}>{token}</Text>
          </Container>
        ) : null}
        <Text style={footer}>
          This code expires shortly. If you didn't request a password reset,
          you can safely ignore this email, your password will not be changed.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
