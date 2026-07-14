import { CAREON_COLORS } from './careon-theme';

export type SavedProgram = {
  id: string;
  title: string;
  agency: string;
  deadline: string;
  dday: string;
  accentColor: string;
  documents: Array<{
    title: string;
    guide: string;
  }>;
  schedule: {
    date: string;
    detail: string;
  };
  url: string;
};

export type CalendarEvent = {
  id: string;
  programId: string;
  year: number;
  monthIndex: number;
  day: number;
  type: 'deadline' | 'result';
  color: string;
  label: string;
};

export type NotificationItem = {
  id: string;
  message: string;
  timestamp: string;
  daysLeft?: number;
  kind: 'deadline' | 'result';
};

export const MOCK_USER = {
  name: '민지',
  email: 'minji@gmail.com',
  district: '동작구',
};

export const SEOUL_DISTRICTS = [
  '강남구',
  '강동구',
  '강북구',
  '강서구',
  '관악구',
  '광진구',
  '구로구',
  '금천구',
  '노원구',
  '도봉구',
  '동대문구',
  '동작구',
  '마포구',
  '서대문구',
  '서초구',
  '성동구',
  '성북구',
  '송파구',
  '양천구',
  '영등포구',
  '용산구',
  '은평구',
  '종로구',
  '중구',
  '중랑구',
];

export const SAVED_PROGRAMS: SavedProgram[] = [
  {
    id: 'seoul-young-carer',
    title: '가족돌봄청년 일상돌봄',
    agency: '서울특별시복지재단',
    deadline: '7월 13일 (월)',
    dday: 'D-7',
    accentColor: CAREON_COLORS.danger,
    documents: [
      { title: '가족관계증명서', guide: '정부 24에서 발급 가능' },
      { title: '진단서', guide: '담당 병원에서 발급' },
    ],
    schedule: {
      date: '7월 15일',
      detail: '필요 서류 | 가족관계증명서, 진단서',
    },
    url: 'https://wis.seoul.go.kr',
  },
  {
    id: 'mental-counseling',
    title: '청년 마음건강 바우처',
    agency: '보건복지부 · 지자체',
    deadline: '7월 16일 (목)',
    dday: 'D-10',
    accentColor: CAREON_COLORS.blue,
    documents: [{ title: '소득증명서', guide: '정부 24에서 또는 주민센터에서 발급' }],
    schedule: {
      date: '7월 28일',
      detail: '소득증명서 제출 마감일',
    },
    url: 'https://www.bokjiro.go.kr',
  },
  {
    id: 'young-carer-independence',
    title: '가족돌봄청년 자립지원',
    agency: '서울청년센터',
    deadline: '7월 22일 (수)',
    dday: 'D-14',
    accentColor: CAREON_COLORS.primary,
    documents: [{ title: '참여 신청서', guide: '앱 내 작성 또는 방문 제출' }],
    schedule: {
      date: '7월 22일',
      detail: '참여 신청서 제출 마감일',
    },
    url: 'https://youth.seoul.go.kr',
  },
];

export const CALENDAR_EVENTS = [
  {
    id: 'doc-deadline',
    programId: 'seoul-young-carer',
    year: 2026,
    monthIndex: 6,
    day: 15,
    type: 'deadline',
    color: CAREON_COLORS.danger,
    label: '서류 마감',
  },
  {
    id: 'result-day',
    programId: 'mental-counseling',
    year: 2026,
    monthIndex: 6,
    day: 22,
    type: 'result',
    color: CAREON_COLORS.blue,
    label: '결과 발표',
  },
  {
    id: 'independence-deadline',
    programId: 'young-carer-independence',
    year: 2026,
    monthIndex: 6,
    day: 22,
    type: 'deadline',
    color: CAREON_COLORS.danger,
    label: '신청 마감',
  },
] satisfies CalendarEvent[];

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'week-left',
    kind: 'deadline',
    daysLeft: 7,
    message: '[가족돌봄청년 일상 돌봄] 마감까지 일주일 남았어요!',
    timestamp: '방금 전',
  },
  {
    id: 'three-days-left',
    kind: 'deadline',
    daysLeft: 3,
    message: '[청년 마음건강 바우처] 마감 3일 전이에요! 놓치지 않게 확인해주세요',
    timestamp: '1일 전',
  },
  {
    id: 'one-day-left',
    kind: 'deadline',
    daysLeft: 1,
    message: '[가족돌봄청년 자립지원] 내일이 마감이에요! 신청을 서둘러 주세요!',
    timestamp: '5일 전',
  },
  {
    id: 'result-announced',
    kind: 'result',
    message: '[청년 마음건강 바우처] 오늘 결과가 발표돼요. 확인해보세요!',
    timestamp: '2주 전',
  },
];
