import { instagramPosts, packages, partners, projects, siteContent, timeSlots } from '../data/site';

export function getFallbackContent(language) {
  const content = siteContent[language] || siteContent.az;

  return {
    content,
    services: content.services,
    packages,
    projects: projects.filter((project) => project.projectType !== 'media'),
    mediaProjects: content.mediaProjects.items.map((title, index) => ({
      id: `media-${index + 1}`,
      title,
      category: 'Media',
      tone: projects[index]?.tone || 'orange',
      status: 'placeholder'
    })),
    artists: content.artists,
    partners: partners.map((name) => ({ id: name, name })),
    processSteps: content.process.map((title, index) => ({ id: title, title, stepNumber: index + 1 })),
    instagramPosts,
    contactInformation: content.contacts,
    socialLinks: {
      instagram: 'https://instagram.com/duomorecords'
    },
    timeSlots,
    source: 'fallback'
  };
}

export function getFallbackBlogPosts(language) {
  const content = siteContent[language] || siteContent.az;
  return content.blogPosts;
}
