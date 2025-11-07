// Post types and enums

export type Position = 
  | 'FRONT' 
  | 'APP' 
  | 'BACKEND' 
  | 'DATA' 
  | 'OTHERS' 
  | 'DESIGN' 
  | 'PLANNER' 
  | 'MARKETING';

export type Domain = 
  | 'FINTECH' 
  | 'HEALTHTECH' 
  | 'EDUCATION' 
  | 'ECOMMERCE' 
  | 'FOODTECH' 
  | 'MOBILITY' 
  | 'CONTENTS' 
  | 'B2B' 
  | 'OTHERS';

export interface Post {
  id: string;
  companyName: string;
  employmentEndDate: string;
  positionTitle: string;
  domain: Domain;
  slogan: string;
  headCount: number;
  isBookmarked: boolean;
  positions?: Position[];
}

export interface PostListResponse {
  posts: Post[];
  paginator: {
    lastPage: number;
  };
}

export interface FilterParams {
  positions?: Position[];
  domains?: Domain[];
  isActive?: boolean;
  order?: number; // 0: 최신순, 1: 마감순
  page?: number;
  size?: number;
}

// Position display names
export const POSITION_NAMES: Record<Position, string> = {
  FRONT: '프론트엔드',
  APP: '앱',
  BACKEND: '백엔드',
  DATA: '데이터',
  OTHERS: '기타 개발',
  DESIGN: '디자인',
  PLANNER: '기획',
  MARKETING: '마케팅',
};

// Domain display names
export const DOMAIN_NAMES: Record<Domain, string> = {
  FINTECH: '핀테크',
  HEALTHTECH: '헬스케어',
  EDUCATION: '교육',
  ECOMMERCE: '이커머스',
  FOODTECH: '푸드테크',
  MOBILITY: '모빌리티',
  CONTENTS: '콘텐츠',
  B2B: 'B2B',
  OTHERS: '기타',
};

// Position groups
export const POSITION_GROUPS = {
  개발: ['FRONT', 'APP', 'BACKEND', 'DATA', 'OTHERS'] as Position[],
  디자인: ['DESIGN'] as Position[],
  기획: ['PLANNER'] as Position[],
  마케팅: ['MARKETING'] as Position[],
};
