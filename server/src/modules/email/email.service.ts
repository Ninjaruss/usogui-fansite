import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly fromEmail = 'Usogui Fan Site <noreply@usoguifansite.com>';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get('RESEND_API_KEY');
    
    if (!apiKey) {
      throw new BadRequestException('Resend API key not configured');
    }

    this.resend = new Resend(apiKey);
  }

  private createEmailTemplate(content: string) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .button {
              display: inline-block;
              background-color: #4CAF50;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  }

  async sendEmailVerification(email: string, token: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    const content = `
      <h1>Welcome to Usogui Fan Site!</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationLink}" class="button">Verify Email</a>
      <p>If you didn't create an account, you can safely ignore this email.</p>
      <p>This link will expire in 24 hours.</p>
    `;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Verify your email address',
        html: this.createEmailTemplate(content),
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new BadRequestException('Failed to send verification email');
    }
  }

  async sendPasswordReset(email: string, token: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const content = `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}" class="button">Reset Password</a>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Reset your password',
        html: this.createEmailTemplate(content),
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new BadRequestException('Failed to send password reset email');
    }
  }

  async sendMediaApprovalNotification(email: string, mediaTitle: string) {
    const content = `
      <h1>Media Submission Approved</h1>
      <p>Your media submission "${mediaTitle}" has been approved and is now live on the site!</p>
      <p>Thank you for contributing to the Usogui Fan Site community.</p>
    `;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Media Submission Approved',
        html: this.createEmailTemplate(content),
      });
    } catch (error) {
      console.error('Failed to send media approval notification:', error);
      throw new BadRequestException('Failed to send media approval notification');
    }
  }
}
