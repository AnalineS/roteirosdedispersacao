/**
 * Emoji to Icon Converter Utility
 * Converts emojis to professional icons throughout the application
 * For use during the migration from emojis to professional flat outline icons
 */

import {
  ChecklistIcon,
  GraduationIcon,
  TrophyIcon,
  SearchIcon,
  BookIcon,
  MailIcon,
  MicroscopeIcon,
  TargetIcon,
  PillIcon,
  HomeIcon,
  LightbulbIcon,
  FileDownloadIcon,
  ClockIcon,
  ChartIcon,
  CalendarIcon,
  LockIcon,
  CheckCircleIcon,
  RefreshIcon,
  EyeIcon,
  AlertTriangleIcon,
  ZapIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  DoctorIcon,
  CalculatorIcon,
  StarIcon,
  RocketIcon
} from '@/components/icons/EducationalIcons';

// Extended emoji to icon mapping (cleaned up and without duplicates)
export const COMPREHENSIVE_EMOJI_TO_ICON_MAP = {
  // Educational & Academic
  '🎓': GraduationIcon,
  '📚': BookIcon,
  '📋': ChecklistIcon,
  '📄': FileDownloadIcon,
  '📑': FileDownloadIcon,
  '📊': ChartIcon,
  '📈': ChartIcon,
  '📉': ChartIcon,
  '🔍': SearchIcon,
  '🔎': SearchIcon,
  '🎯': TargetIcon,
  '💡': LightbulbIcon,
  '🧠': LightbulbIcon,
  
  // Medical & Healthcare
  '👨‍⚕️': DoctorIcon,
  '👩‍⚕️': DoctorIcon,
  '💊': PillIcon,
  '💉': PillIcon,
  '🔬': MicroscopeIcon,
  '⚕️': DoctorIcon,
  '🏥': HomeIcon,
  '🩺': DoctorIcon,
  '🩸': PillIcon,
  '🧬': MicroscopeIcon,
  
  // Technology & Interface
  '💻': ChartIcon,
  '📱': BookIcon,
  '🖥️': ChartIcon,
  '⌨️': ChecklistIcon,
  '🖱️': TargetIcon,
  '💿': FileDownloadIcon,
  '📀': FileDownloadIcon,
  '🔗': FileDownloadIcon,
  '🌐': SearchIcon,
  
  // Time & Calendar
  '📅': CalendarIcon,
  '📆': CalendarIcon,
  '⏰': ClockIcon,
  '⏱️': ClockIcon,
  '⏲️': ClockIcon,
  '🕐': ClockIcon,
  
  // Status & States
  '✅': CheckCircleIcon,
  '❌': AlertTriangleIcon,
  '⚠️': AlertTriangleIcon,
  '🚨': AlertTriangleIcon,
  '🔴': AlertTriangleIcon,
  '🟢': CheckCircleIcon,
  '🟡': AlertTriangleIcon,
  '🔵': LightbulbIcon,
  '⭐': StarIcon,
  '🌟': StarIcon,
  '✨': StarIcon,
  
  // Navigation & Actions
  '🏠': HomeIcon,
  '🏡': HomeIcon,
  '🔼': ChevronUpIcon,
  '🔽': ChevronDownIcon,
  '⬆️': ChevronUpIcon,
  '⬇️': ChevronDownIcon,
  '🔄': RefreshIcon,
  '🔃': RefreshIcon,
  '🔁': RefreshIcon,
  '👁️': EyeIcon,
  '👀': EyeIcon,
  
  // Communication
  '📧': MailIcon,
  '📨': MailIcon,
  '📩': MailIcon,
  '📮': MailIcon,
  '💬': MailIcon,
  '💭': LightbulbIcon,
  '📞': MailIcon,
  '☎️': MailIcon,
  
  // Security & Privacy
  '🔒': LockIcon,
  '🔓': LockIcon,
  '🔐': LockIcon,
  '🛡️': LockIcon,
  '🔑': LockIcon,
  
  // Achievement & Progress
  '🏆': TrophyIcon,
  '🥇': TrophyIcon,
  '🥈': TrophyIcon,
  '🥉': TrophyIcon,
  '🎖️': TrophyIcon,
  '🏅': TrophyIcon,
  
  // Utilities & Tools
  '🧮': CalculatorIcon,
  '📐': CalculatorIcon,
  '📏': CalculatorIcon,
  '🔧': CalculatorIcon,
  '🔨': CalculatorIcon,
  '⚙️': CalculatorIcon,
  '🛠️': CalculatorIcon,
  
  // Gamification
  '🎮': StarIcon,
  '🎲': CalculatorIcon,
  '🃏': BookIcon,
  '🎪': TrophyIcon,
  
  // Energy & Power
  '⚡': ZapIcon,
  '🔋': ZapIcon,
  '💫': StarIcon,
  '🌪️': RefreshIcon,
  '🔥': ZapIcon,
  
  // Launch & Growth
  '🚀': RocketIcon,
  '🛸': RocketIcon,
  '📦': BookIcon,
  '📤': FileDownloadIcon,
  '📥': FileDownloadIcon,
  
  // Research & Science
  '🧪': MicroscopeIcon,
  '⚗️': MicroscopeIcon,
  '🦠': MicroscopeIcon,
  '🧫': MicroscopeIcon,
  
  // People & Users
  '👤': DoctorIcon,
  '👥': DoctorIcon,
  '👨': DoctorIcon,
  '👩': DoctorIcon,
  '🧑': DoctorIcon,
  
  // Location & Places
  '📍': TargetIcon,
  '📌': TargetIcon,
  '🗺️': SearchIcon,
  '🌍': SearchIcon,
  '🌎': SearchIcon,
  '🌏': SearchIcon
} as const;

/**
 * Get icon component for emoji
 */
export const getIconForEmoji = (emoji: string) => {
  return COMPREHENSIVE_EMOJI_TO_ICON_MAP[emoji as keyof typeof COMPREHENSIVE_EMOJI_TO_ICON_MAP] || null;
};

/**
 * Replace emoji in text with icon component reference
 */
export const replaceEmojiWithIcon = (text: string): { text: string; hasEmoji: boolean } => {
  let hasEmoji = false;
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{E000}-\u{F8FF}]/gu;
  
  const replacedText = text.replace(emojiRegex, (match) => {
    const icon = getIconForEmoji(match);
    if (icon !== null) {
      hasEmoji = true;
      return `<Icon:${match}>`;
    }
    return match;
  });
  
  return { text: replacedText, hasEmoji };
};

/**
 * Extract all emojis from a string
 */
export const extractEmojis = (text: string): string[] => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{E000}-\u{F8FF}]/gu;
  return text.match(emojiRegex) || [];
};

/**
 * Check if text contains emojis
 */
export const hasEmojis = (text: string): boolean => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{E000}-\u{F8FF}]/gu;
  return emojiRegex.test(text);
};

/**
 * Get replacement suggestion for emoji
 */
export const getReplacementSuggestion = (emoji: string): string | null => {
  const IconComponent = getIconForEmoji(emoji);
  if (IconComponent) {
    const componentName = IconComponent.name;
    return `<${componentName} size={16} className="inline mr-1" />`;
  }
  return null;
};

/**
 * Batch process emojis in multiple texts
 */
export const batchProcessEmojis = (texts: string[]): { 
  originalText: string; 
  suggestedReplacement: string | null; 
  emojis: string[] 
}[] => {
  return texts.map(text => ({
    originalText: text,
    suggestedReplacement: getReplacementSuggestion(text),
    emojis: extractEmojis(text)
  }));
};

const emojiToIconConverter = {
  getIconForEmoji,
  replaceEmojiWithIcon,
  extractEmojis,
  hasEmojis,
  getReplacementSuggestion,
  batchProcessEmojis,
  COMPREHENSIVE_EMOJI_TO_ICON_MAP
};

export default emojiToIconConverter;