import React from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Link as MuiLink
} from '@mui/material'
import { Heart, Mail, Coffee, Github, Twitter } from 'lucide-react'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'About L-File - The Ultimate Usogui Database',
    description: 'Learn about L-File, the comprehensive fan-made database dedicated to the manga series Usogui (The Lie Eater). Created by fans, for fans.',
    keywords: ['Usogui', 'Lie Eater', 'manga', 'database', 'characters', 'gambles', 'about'],
    openGraph: {
      title: 'About L-File - The Ultimate Usogui Database',
      description: 'Learn about L-File, the comprehensive fan-made database dedicated to the manga series Usogui (The Lie Eater).',
      type: 'website'
    },
    twitter: {
      card: 'summary',
      title: 'About L-File - The Ultimate Usogui Database',
      description: 'Learn about L-File, the comprehensive fan-made database dedicated to the manga series Usogui (The Lie Eater).'
    }
  }
}

const AboutPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        About L-File
      </Typography>

      <Grid container spacing={4}>
        {/* About Section */}
        <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h4" component="h2" gutterBottom color="primary">
                  About
                </Typography>
                <Typography variant="body1" paragraph>
                  L-File is a comprehensive fan-made database and community hub dedicated to the manga series Usogui (The Lie Eater).
                  This project aims to provide fans with detailed information about characters, story arcs, gambles, events, and guides
                  to help navigate the complex world of Usogui.
                </Typography>
                <Typography variant="body1" paragraph>
                  Our mission is to create the most complete and accurate resource for Usogui fans worldwide, featuring character profiles,
                  detailed gamble explanations, chapter guides, and community-contributed content. Whether you're a new reader trying to
                  understand the intricate gambling strategies or a long-time fan looking to dive deeper into character relationships,
                  L-File is here to enhance your Usogui experience.
                </Typography>
                <Typography variant="body1">
                  This is a non-profit, fan-created project built with love for the Usogui community. All content is created by fans,
                  for fans, and we encourage community participation through guide submissions and media contributions.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Support Me Section */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Heart size={24} color="#e91e63" />
                  <Typography variant="h4" component="h2" sx={{ ml: 1 }} color="primary">
                    Support Me
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph>
                  L-File is a passion project that takes considerable time and effort to maintain. If you find this resource
                  helpful and would like to support its continued development, here are some ways you can help:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Buy me a coffee"
                      secondary="Help cover hosting costs and development time"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Contribute content"
                      secondary="Submit guides, character analyses, or media"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Spread the word"
                      secondary="Share L-File with other Usogui fans"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Report issues"
                      secondary="Help us improve by reporting bugs or suggesting features"
                    />
                  </ListItem>
                </List>
                <Box mt={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Coffee size={16} />}
                    href="#"
                    sx={{ mr: 1, mb: 1 }}
                    disabled
                  >
                    Ko-fi (Coming Soon)
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Github size={16} />}
                    href="#"
                    sx={{ mb: 1 }}
                    disabled
                  >
                    GitHub (Coming Soon)
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Supporters Section */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h4" component="h2" gutterBottom color="primary">
                  Supporters
                </Typography>
                <Typography variant="body1" paragraph>
                  A huge thank you to everyone who has supported L-File through contributions, feedback, and by spreading the word!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Supporter list coming soon...
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Want to be featured here? Support the project and help us grow the Usogui community!
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact Section */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h4" component="h2" gutterBottom color="primary">
                  Contact
                </Typography>
                <Typography variant="body1" paragraph>
                  Have questions, suggestions, or want to get involved? Here's how you can reach out:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Mail size={20} />
                      <Typography variant="body1" sx={{ ml: 1 }}>
                        Email: <MuiLink href="mailto:contact@l-file.com" underline="hover">contact@l-file.com</MuiLink>
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Github size={20} />
                      <Typography variant="body1" sx={{ ml: 1 }}>
                        GitHub: <MuiLink href="#" underline="hover">Coming Soon</MuiLink>
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Twitter size={20} />
                      <Typography variant="body1" sx={{ ml: 1 }}>
                        Twitter: <MuiLink href="#" underline="hover">Coming Soon</MuiLink>
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  For content submissions, please use the dedicated "Submit Guide" and "Submit Media" options in the navigation menu.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
    </Container>
  )
}

export default AboutPage