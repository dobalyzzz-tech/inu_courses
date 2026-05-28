export interface MenuCategory {
  category: string;
  subCategories: string[];
}

export const COURSE_MENU_DATA: MenuCategory[] = [
  {
    "category": "기초교양",
    "subCategories": [
      "학문의기초"
    ]
  },
  {
    "category": "핵심교양",
    "subCategories": [
      "(핵심)INU세미나",
      "(핵심)과학기술",
      "(핵심)사회",
      "(핵심)예술체육",
      "(핵심)외국어",
      "(핵심)인문"
    ]
  },
  {
    "category": "심화교양",
    "subCategories": [
      "과학기술",
      "사회",
      "예술체육",
      "외국어",
      "인문"
    ]
  }
];
