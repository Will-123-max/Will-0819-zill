import type { ComponentType } from 'react'
import {
  BookOpen, BrainCircuit, Building2, CalendarDays, Calculator,
  GraduationCap, HeartHandshake, Home, Landmark, Laptop,
  Library, MapPinned, Newspaper, ShieldPlus, Trophy, Users,
} from 'lucide-react'

export type AppIcon = ComponentType<{ size?: number; className?: string; strokeWidth?: number }>

export interface Settings {
  site_name: string
  site_kicker: string
  hero_title: string
  hero_text: string
  cta_primary: string
  cta_secondary: string
  footer_blurb: string
  profile_url: string
  img_hero: string
  img_campus: string
  img_campus_walk: string
  img_materials: string
  img_exam: string
  img_tips: string
  img_admission: string
  img_housing: string
  img_hostel: string
  img_marketplace: string
  img_library: string
  img_counselling: string
  img_it: string
  img_recreation: string
  img_scholarship: string
  img_laptop: string
  img_graduation: string
  img_map: string
}

export interface Material {
  id: number
  title: string
  course_code: string
  course_name?: string
  university: string
  faculty?: string
  department?: string
  level?: string
  type: string
  is_premium?: boolean
  featured?: boolean
  downloads?: number
  views?: number
  cover_url?: string
  file_url?: string
  content?: string
  topics?: string[]
}

export interface Article {
  id: number
  slug: string
  title: string
  excerpt?: string
  body?: string
  category: string
  school?: string
  author?: string
  image_url?: string
  views?: number
  published_at?: string
}

export interface Question {
  id?: number
  prompt: string
  options: string[]
  correct?: string
  answer?: string
  explanation?: string
}

export interface Quiz {
  id: number
  title: string
  exam_type: string
  course_code: string
  question_count: number
  duration_minutes: number
  attempts: number
  questions?: Question[]
}

export interface PastQuestion {
  id: number
  title: string
  exam_type: string
  school: string
  department?: string
  course_code: string
  course_name?: string
  year: number
  question_count: number
  views?: number
  questions?: Question[]
}

export interface GuideQuestion extends Question {
  id: number
  category: string
  topic?: string
  title: string
  correct: string
}

export interface Scholarship {
  id: number
  title: string
  provider: string
  kind: string
  amount: number | null
  deadline?: string
  eligibility?: string
  description?: string
}

export interface Housing {
  id: number
  title: string
  price: number
  location: string
  city: string
  school: string
  rooms: number
  contact: string
  description: string
  cover_url?: string
}

export interface Outline {
  id: number
  course_code: string
  course_name: string
  university: string
  department: string
  level: string
  units: number
  body: string
  objectives: string[]
}

export const defaultSettings: Settings = {
  site_name: 'Studentsguide',
  site_kicker: 'Ebonyi State University Studentsguide',
  hero_title: 'Welcome to Studentsguide ',
  hero_text: 'Everything a student needs, all in one place — study materials, CBT practice, campus resources, scholarships, academic updates, and student services.',
  cta_primary: 'Browse materials ',
  cta_secondary: 'Start CBT',
  footer_blurb: 'The public campus companion for EBSU students — study materials, CBT, maps, calendar, scholarships and student services. Independent resource. Always verify official school information before you pay.',
  profile_url: '/crest.jpg',
  img_hero: '/images/hero-students.jpg',
  img_campus: '/images/campus.jpg',
  img_campus_walk: '/images/campus-walk.jpg',
  img_materials: '/images/materials.jpg',
  img_exam: '/images/exam.jpg',
  img_tips: '/images/tips.jpg',
  img_admission: '/images/admission.jpg',
  img_housing: '/images/housing.jpg',
  img_hostel: '/images/hostel-2.jpg',
  img_marketplace: '/images/marketplace.jpg',
  img_library: '/images/library.jpg',
  img_counselling: '/images/counselling.jpg',
  img_it: '/images/it-support.jpg',
  img_recreation: '/images/recreation.jpg',
  img_scholarship: '/images/scholarship.jpg',
  img_laptop: '/images/student-laptop.jpg',
  img_graduation: '/images/graduation.jpg',
  img_map: '/images/campus-map.jpg',
}

export const universities = ['EBSU', 'UNN', 'UNILAG', 'UI', 'OAU', 'ABU', 'UNIBEN', 'FUTO', 'LASU', 'UNICAL']
export const faculties = ['Science', 'Engineering', 'Arts', 'Social Sciences', 'Management Sciences', 'Education', 'Law', 'Medicine', 'Agriculture']
export const levels = ['100', '200', '300', '400', '500']

export interface NavItem { to: string; label: string }
export const primaryNav: NavItem[] = [
  { to: '/', label: 'Home' }, { to: '/materials', label: 'Materials' },
  { to: '/past-questions', label: 'Past Questions' }, { to: '/cbt', label: 'CBT' },
  { to: '/updates', label: 'Updates' },
]
export const resourcesNav: NavItem[] = [
  { to: '/map', label: 'Campus Map' }, { to: '/calendar', label: 'Academic Calendar' },
  { to: '/support', label: 'Support Services' }, { to: '/software', label: 'Campus Software' },
  { to: '/help', label: 'Education Help' }, { to: '/scholarships', label: 'Scholarships' },
]
export const servicesNav: NavItem[] = [
  { to: '/library', label: 'Library Access' }, { to: '/counselling', label: 'Counselling Center' },
  { to: '/it-support', label: 'IT Support' }, { to: '/recreation', label: 'Recreation Center' },
]
export const moreNav: NavItem[] = [
  { to: '/admission', label: 'Admission Guide' }, { to: '/outlines', label: 'Course Outlines' },
  { to: '/housing', label: 'Student Housing' }, { to: '/gpa', label: 'GPA Calculator' },
  { to: '/tips', label: 'Academic Tips' }, { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export interface ResourceCard { to: string; title: string; text: string; icon: AppIcon; tint?: string; slot?: keyof Settings }
export const keyResources: ResourceCard[] = [
  { to: '/map', icon: MapPinned, title: 'Campus Map', text: 'Permanent Site, Ishieke, Presco and hospital landmarks.', tint: 'sky' },
  { to: '/calendar', icon: CalendarDays, title: 'Academic Calendar', text: 'Resumption, registration, tests, exams and breaks.', tint: 'amber' },
  { to: '/support', icon: ShieldPlus, title: 'Support Services', text: 'Medical, security, bursary and student affairs.', tint: 'rose' },
  { to: '/software', icon: Laptop, title: 'Campus Software', text: 'Portals, CBT apps and licensed faculty tools.', tint: 'indigo' },
  { to: '/help', icon: HeartHandshake, title: 'Education Help', text: 'Clearance, results, GST and how to sit papers.', tint: 'emerald' },
  { to: '/scholarships', icon: Trophy, title: 'Scholarships', text: 'NELFUND, state awards and faculty prizes.', tint: 'violet' },
]
export const studentServices: ResourceCard[] = [
  { to: '/library', icon: Library, title: 'Library Access', text: 'Interactive guide questions', slot: 'img_library' },
  { to: '/counselling', icon: HeartHandshake, title: 'Counselling Center', text: 'Interactive guide questions', slot: 'img_counselling' },
  { to: '/it-support', icon: Laptop, title: 'IT Support', text: 'Interactive guide questions', slot: 'img_it' },
  { to: '/recreation', icon: Trophy, title: 'Recreation Center', text: 'Interactive guide questions', slot: 'img_recreation' },
]
export const studyResources: ResourceCard[] = [
  { to: '/materials', icon: BookOpen, title: 'Study Materials', text: 'Notes, PDFs and handouts by school, faculty and course.' },
  { to: '/past-questions', icon: Newspaper, title: 'Past Questions', text: 'JAMB, WAEC, NECO, Post-UTME and departmental exams.' },
  { to: '/cbt', icon: BrainCircuit, title: 'CBT Practice', text: 'Timed quizzes, instant scoring and a public leaderboard.' },
  { to: '/admission', icon: GraduationCap, title: 'Admission Guide', text: 'JAMB, Post-UTME, fees, cut-offs and clearance.' },
  { to: '/updates', icon: Newspaper, title: 'School Updates', text: 'Lists, calendars, NELFUND and campus news.' },
  { to: '/housing', icon: Home, title: 'Student Housing', text: 'Hostels and off-campus lodges near your campus.' },
  { to: '/gpa', icon: Calculator, title: 'GPA Calculator', text: 'Track semester GPA and cumulative CGPA on the 5.0 scale.' },
]

export interface ServiceConfig { category: string; kicker: string; title: string; text: string; slot: keyof Settings; icon: AppIcon }
export const servicePages: Record<string, ServiceConfig> = {
  map: { category: 'map', kicker: 'Find your way', title: 'EBSU Campus Map', text: 'Each landmark is a question. Pick where it sits, when it opens, or who to ask — View Answer anytime.', slot: 'img_map', icon: MapPinned },
  calendar: { category: 'calendar', kicker: 'Plan the session', title: 'Academic Calendar', text: 'Test yourself on resumption, registration, mid-semester, exams and senate. Confirm official dates with Academic Affairs.', slot: 'img_campus', icon: CalendarDays },
  support: { category: 'support', kicker: 'We are here', title: 'Support Services', text: 'Medical centre, security, bursary and Student Affairs — open each item and choose the right office.', slot: 'img_campus_walk', icon: ShieldPlus },
  software: { category: 'software', kicker: 'Tools', title: 'Campus Software', text: 'Portals, CBT, office suites and faculty tools. Pick the right app or access path for each item.', slot: 'img_it', icon: Laptop },
  help: { category: 'help', kicker: 'Ask better questions', title: 'Education Help', text: 'Clearance, results, GST, NELFUND and exam officers — answer first, or tap View Answer.', slot: 'img_tips', icon: HeartHandshake },
  scholarships: { category: 'scholarships', kicker: 'Fund the degree', title: 'Scholarships', text: 'NELFUND, state awards and faculty prizes. Never pay an agent. Check you know who runs each scheme.', slot: 'img_scholarship', icon: Trophy },
  library: { category: 'library', kicker: 'Read. Borrow. Search.', title: 'Library Access', text: 'Borrowing rules, e-resources and reserved texts — open each item as a question.', slot: 'img_library', icon: Library },
  counselling: { category: 'counselling', kicker: 'Talk it through', title: 'Counselling Center', text: 'Who they help, where they sit, and what stays confidential.', slot: 'img_counselling', icon: HeartHandshake },
  'it-support': { category: 'it-support', kicker: 'Portals & labs', title: 'IT Support', text: 'Password resets, email, CBT halls and campus Wi-Fi.', slot: 'img_it', icon: Laptop },
  recreation: { category: 'recreation', kicker: 'Move your body', title: 'Recreation Center', text: 'Pitches, gym token, intramurals and who collects fees.', slot: 'img_recreation', icon: Trophy },
  admission: { category: 'admission', kicker: 'Your next step', title: 'Admission Guide', text: 'JAMB, Post-UTME, clearance and first-year questions — choose an answer, then check the guide.', slot: 'img_admission', icon: GraduationCap },
  tips: { category: 'tips', kicker: 'Study smarter', title: 'Academic Tips', text: 'Practical ways to prepare, revise, manage time and get help before an exam.', slot: 'img_laptop', icon: BookOpen },
}

export const fallbackMaterials: Material[] = [
  { id: 18, title: 'CHM 102 — COURSE OUTLINE', course_code: 'CHM 102', university: 'EBSU', faculty: 'Science', department: 'Chemistry', level: '100', type: 'PDF', featured: true, downloads: 6, views: 6, cover_url: '/images/materials.jpg', content: 'Historical survey of organic chemistry, fullerenes, electronic theory, stereochemistry and reaction mechanisms.' },
  { id: 17, title: 'ECO 101 past questions and answers', course_code: 'ECO 101', university: 'EBSU', faculty: 'Social Sciences', department: 'Economics', level: '100', type: 'Notes', featured: true, downloads: 1, views: 5, cover_url: '/images/materials.jpg', content: 'Practice questions for introductory economics.' },
  { id: 10, title: 'GST 103 Philosophy and Logic Pack', course_code: 'GST 103', university: 'EBSU', faculty: 'Arts', department: 'General Studies', level: '100', type: 'PDF', downloads: 1540, views: 2200, cover_url: '/images/materials.jpg', content: 'Arguments, fallacies, and basic symbolic logic used in EBSU GST 103.' },
]
export const fallbackQuizzes: Quiz[] = [
  { id: 2, title: 'GST 101 Use of English CBT', exam_type: 'University', course_code: 'GST 101', question_count: 10, duration_minutes: 12, attempts: 257 },
  { id: 1, title: 'COS 101 CBT', exam_type: 'University', course_code: 'COS 101', question_count: 10, duration_minutes: 15, attempts: 202 },
  { id: 12, title: 'CHM 102', exam_type: 'University', course_code: 'CHM 102', question_count: 20, duration_minutes: 20, attempts: 27 },
]
export const fallbackArticles: Article[] = [
  { id: 14, slug: 'result-update', title: 'WHY RESULTS MAY NOT APPEAR AT THE SAME TIME', excerpt: 'Results may not necessarily appear for every student at exactly the same time.', body: 'Results are often uploaded gradually and may still be undergoing departmental checks. Stay calm, check the official portal again later, and contact your department when necessary.', category: 'Exams', school: 'EBSU', author: 'Studentguide Admin', image_url: '/images/campus-walk.jpg', published_at: '2026-08-17T00:43:03Z', views: 3 },
  { id: 13, slug: 'course-registration-extension', title: 'Compassionate extension of online course registration', excerpt: 'EBSU Senate approves a short extension for online course registration.', body: 'Students are advised to complete course registration and prepare for the second-semester examinations.', category: 'Campus', school: 'EBSU', author: 'Studentguide Admin', image_url: '/images/campus.jpg', published_at: '2026-08-16T10:00:00Z', views: 12 },
]
export const fallbackPast: PastQuestion[] = [
  { id: 7, title: 'CHM 102 Past Questions and Answers', exam_type: 'University', school: 'EBSU', department: 'Chemistry', course_code: 'CHM 102', course_name: 'Physical Chemistry', year: 2026, question_count: 20, views: 38, questions: [
    { prompt: 'Which particle has the smallest mass?', options: ['Proton', 'Neutron', 'Electron', 'Nucleus'], answer: 'Electron', explanation: 'The electron is much lighter than a proton or neutron.' },
    { prompt: 'The maximum number of electrons in the second shell is:', options: ['2', '4', '8', '18'], answer: '8', explanation: 'The second shell holds a maximum of 8 electrons.' },
  ] },
]
export const fallbackGuide: GuideQuestion[] = [
  { id: 1, category: 'map', topic: 'Permanent Site', title: 'Senate Building', prompt: 'Where do you go first for many central clearance stamps and senate business?', options: ['Sports Complex pavilion', 'Senate Building, Permanent Site', 'Ishieke Campus Gate', 'Presco lodge junction'], correct: 'Senate Building, Permanent Site', explanation: 'The Senate Building holds central administration, the VC’s office and the senate chamber.' },
  { id: 2, category: 'map', topic: 'Permanent Site', title: 'University Library', prompt: 'Which landmark is the main collection, e-resources lab and reserved textbooks?', options: ['ICT / CBT Centre only', 'Faculty of Science notice board', 'University Library, Permanent Site', 'Teaching Hospital library'], correct: 'University Library, Permanent Site', explanation: 'Bring your student ID. Reserved texts stay in the reading room.' },
]

export const whatsAppNumber = '07083587535'
export const whatsAppLink = 'https://wa.me/2347083587535'
export const whatsAppChannel = 'https://whatsapp.com/channel/0029VbCUUSJ4yltOG1ipJU0s'
export const whatsAppGroup = 'https://chat.whatsapp.com/KVYoBn1dqIW5p7TU1BmcVI?s=cl&p=a&ilr=0'

export const miscIcons = { Building2, Landmark, Users }
