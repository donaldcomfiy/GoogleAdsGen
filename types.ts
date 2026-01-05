export interface AdAsset {
  id: string;
  text: string;
  type: 'headline' | 'description';
  pinnedPosition?: 1 | 2 | 3; // 1, 2, or 3 for Headlines
}

export interface AdData {
  headlines: AdAsset[];
  descriptions: AdAsset[];
  finalUrl: string;
  displayPath1: string;
  displayPath2: string;
}

export type TextStyle = 'BRAND' | 'GENERIC' | 'PROBLEM' | 'SOLUTION' | 'QUESTION' | 'CTA' | 'PRODUCT' | 'SERVICE';

export interface StylePreference {
  activeTags: string[];
  userTags: string[]; // custom added by user
}

export interface InputState {
  url: string;
  keywords: string;
  extractedKeywords: string[]; // Keywords found during website analysis
  selectedStyles: TextStyle[];
  stylePreferences: Record<TextStyle, StylePreference>;
  htmlContent?: string; // Extracted text from uploaded HTML
  fileName?: string;   // Name of the uploaded HTML file
  pdfContent?: string; // Base64 string of uploaded PDF
  pdfFileName?: string; // Name of the uploaded PDF file
}

export enum DeviceView {
  MOBILE = 'MOBILE',
  DESKTOP = 'DESKTOP'
}