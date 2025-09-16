import { Container, Typography, Box, Paper, Divider } from '@mui/material'
import { Shield, AlertTriangle, Copyright, ExternalLink } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Legal Disclaimer - L-File Usogui Database',
  description: 'Legal disclaimer and terms of use for L-File, the Usogui manga fan database. Copyright information and fair use policy.',
  keywords: ['disclaimer', 'legal', 'copyright', 'fair use', 'terms', 'Usogui'],
  openGraph: {
    title: 'Legal Disclaimer - L-File Usogui Database',
    description: 'Legal disclaimer and terms of use for L-File, the Usogui manga fan database.',
    type: 'website'
  },
  robots: {
    index: false,
    follow: true
  }
}

export default function DisclaimerPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={2}>
          <Shield className="w-8 h-8" color="#1976d2" />
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
            Disclaimer
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Important legal information and terms of use
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box mb={4}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Copyright className="w-6 h-6" color="#ed6c02" />
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
              Copyright & Fair Use
            </Typography>
          </Box>
          <Typography variant="body1" paragraph>
            This website (&quot;L-file&quot;) is an unofficial fan resource dedicated to the manga series 
            &quot;Usogui&quot; (also known as &quot;Lie Eater&quot;) created by Sako Toshio 迫 稔雄 and published by Shueisha 集英社. 
            All original manga content, including but not limited to characters, storylines, artwork, 
            and related intellectual property, remains the exclusive property of their respective copyright holders.
          </Typography>
          <Typography variant="body1" paragraph>
            The use of copyrighted material on this website falls under fair use provisions for 
            educational, commentary, and non-commercial purposes. We do not claim ownership of any 
            copyrighted material and all content is used with respect to the original creators and publishers.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box mb={4}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <AlertTriangle className="w-6 h-6" color="#d32f2f" />
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
              Content Disclaimer
            </Typography>
          </Box>
          <Typography variant="body1" paragraph>
            <strong>Age Rating:</strong> Usogui contains mature content including violence, gambling, 
            psychological themes, and adult situations. This website may discuss or reference such 
            content and is intended for mature audiences.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Spoilers:</strong> This website contains detailed information about plot points, 
            character developments, and story outcomes throughout the entire Usogui series. Although there is chapter tracking
            to prevent spoilers, we advise you to browse at your own discretion if you have not completed the manga.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>User-Generated Content:</strong> Some content on this site is contributed by users. 
            While we moderate submissions, we cannot guarantee the accuracy of all information. User 
            opinions and interpretations do not necessarily reflect our views.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box mb={4}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <ExternalLink className="w-6 h-6" color="#2e7d32" />
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
              External Links & Third Parties
            </Typography>
          </Box>
          <Typography variant="body1" paragraph>
            This website may contain links to external websites, social media platforms, or other 
            third-party services. We are not responsible for the content, privacy practices, or 
            policies of these external sites. Users access external links at their own risk.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box mb={4}>
          <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }} mb={2}>
            Limitation of Liability
          </Typography>
          <Typography variant="body1" paragraph>
            This website and its content are provided &quot;as is&quot; without warranty of any kind. We make 
            no representations or warranties regarding the accuracy, completeness, or reliability of 
            any information on this site. Use of this website is at your own risk.
          </Typography>
          <Typography variant="body1" paragraph>
            We shall not be liable for any direct, indirect, incidental, consequential, or punitive 
            damages arising from your use of this website or any content therein.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }} mb={2}>
            Contact & Takedown Requests
          </Typography>
          <Typography variant="body1" paragraph>
            If you are a copyright holder and believe that content on this website infringes upon 
            your rights, please contact us immediately at{' '}
            <Typography component="span" color="primary" sx={{ fontWeight: 'bold' }}>
              ninjarussyt@gmail.com
            </Typography>{' '}
            with a detailed description of the alleged infringement. We will investigate all legitimate 
            claims promptly and remove infringing content when appropriate.
          </Typography>
          <Typography variant="body1" paragraph>
            For general inquiries, feedback, or concerns about this disclaimer, please use the same 
            contact information.
          </Typography>
        </Box>
      </Paper>

      <Box textAlign="center" sx={{ color: 'text.secondary' }}>
        <Typography variant="body2">
          Last updated: {new Date().toLocaleDateString()}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          This disclaimer may be updated periodically. Continued use of this website constitutes 
          acceptance of any changes.
        </Typography>
      </Box>
    </Container>
  )
}