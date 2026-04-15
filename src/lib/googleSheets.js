import duomoPreview from '../assets/icons/logo_duomo_white.svg';
import partnerPreview from '../assets/icons/logo_duomo_white.svg';

export const fallbackPortfolio = [
  {
    id: '01',
    title: 'Qorxuram',
    description: 'Pop single production, recording, and vocal mix.',
    imageUrl: duomoPreview,
    youtubeUrl: 'https://youtube.com'
  },
  {
    id: '02',
    title: 'Susdum',
    description: 'R&B project with full vocal production.',
    imageUrl: duomoPreview,
    youtubeUrl: 'https://youtube.com'
  },
  {
    id: '03',
    title: 'Kaman Ağla',
    description: 'EDM crossover with modern arrangement.',
    imageUrl: duomoPreview,
    youtubeUrl: 'https://youtube.com'
  }
];

export const fallbackMediaProjects = [
  {
    id: 'm01',
    title: 'Behind The Scenes: Studio Session',
    imageUrl: duomoPreview,
    projectUrl: 'https://youtube.com'
  },
  {
    id: 'm02',
    title: 'Live Vocal Direction',
    imageUrl: duomoPreview,
    projectUrl: 'https://youtube.com'
  }
];

export const fallbackCollaborations = [
  {
    id: 'c01',
    name: 'Partner Studio',
    description: 'Joint recording and release support.',
    logoUrl: partnerPreview,
    linkUrl: 'https://instagram.com/duomorecords'
  }
];

function parseGoogleVisualizationResponse(raw) {
  const clean = raw
    .replace(/^\/\*O_o\*\//, '')
    .replace(/^google\.visualization\.Query\.setResponse\(/, '')
    .replace(/\);?$/, '');

  const parsed = JSON.parse(clean);
  const cols = parsed.table.cols.map((col) => col.label || col.id || '');
  const rows = parsed.table.rows.map((row) =>
    row.c.map((cell) => {
      if (!cell) {
        return '';
      }

      if (typeof cell.v === 'string') {
        return cell.v.trim();
      }

      return cell.v ?? '';
    })
  );

  return { cols, rows };
}

async function fetchSheetRows(sheetId, gid) {
  const query = new URLSearchParams({ gid, headers: '1', tqx: 'out:json' });
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?${query}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch Google Sheet');
  }

  const raw = await response.text();
  return parseGoogleVisualizationResponse(raw);
}

function toObjects({ cols, rows }) {
  const normalizedCols = cols.map((col) => String(col).trim().toLowerCase());

  return rows
    .map((row) => {
      const obj = {};
      normalizedCols.forEach((col, index) => {
        obj[col] = row[index] ?? '';
      });
      return obj;
    })
    .filter((row) => Object.values(row).some((value) => String(value).trim() !== ''));
}

export async function fetchSheetsData({ sheetId, portfolioGid, mediaGid, collaborationsGid }) {
  if (!sheetId || !portfolioGid || !mediaGid || !collaborationsGid) {
    return {
      portfolio: fallbackPortfolio,
      mediaProjects: fallbackMediaProjects,
      collaborations: fallbackCollaborations
    };
  }

  const [portfolioRaw, mediaRaw, collaborationsRaw] = await Promise.all([
    fetchSheetRows(sheetId, portfolioGid),
    fetchSheetRows(sheetId, mediaGid),
    fetchSheetRows(sheetId, collaborationsGid)
  ]);

  const portfolio = toObjects(portfolioRaw).map((item, index) => ({
    id: item.id || `${index + 1}`,
    title: item.title || item.project_name || `Project ${index + 1}`,
    description: item.description || '',
    imageUrl: item.image_url || item.image || duomoPreview,
    youtubeUrl: item.youtube_url || item.video_url || ''
  }));

  const mediaProjects = toObjects(mediaRaw).map((item, index) => ({
    id: item.id || `m${index + 1}`,
    title: item.title || item.project_name || `Media ${index + 1}`,
    imageUrl: item.image_url || item.image || duomoPreview,
    projectUrl: item.project_url || item.youtube_url || ''
  }));

  const collaborations = toObjects(collaborationsRaw).map((item, index) => ({
    id: item.id || `c${index + 1}`,
    name: item.name || item.partner_name || `Partner ${index + 1}`,
    description: item.description || '',
    logoUrl: item.logo_url || item.image_url || partnerPreview,
    linkUrl: item.link_url || item.website || ''
  }));

  return {
    portfolio: portfolio.length ? portfolio : fallbackPortfolio,
    mediaProjects: mediaProjects.length ? mediaProjects : fallbackMediaProjects,
    collaborations: collaborations.length ? collaborations : fallbackCollaborations
  };
}
