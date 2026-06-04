import type {
  StudentInsert,
  StudentEnrollmentInsert,
} from '@/server/db/turso/schema/students';

/**
 * PoC 用の初期生徒データ（小さな離島の中学校。各学年4名・計12名）。
 *
 * 氏名は IPAmjexMincho の価値が分かるよう、JIS文字のみの氏名と
 * **MJ特有文字（JIS X 0213 外）を含む氏名を混在**させている:
 *   𠮷田(U+20BB7) / 𡈽屋(U+21235) … CJK拡張B・SIP。システム標準フォントでは表示困難
 *   髙橋(U+9AD9) / 渡邉(U+9089) / 﨑山(U+FA11) … いわゆる戸籍漢字・異体字
 * 表示名(preferred)は JIS文字へ正規化（吉田 / 土屋 / 高橋 / 渡辺 / 崎山）。
 *
 * 文字集合の用語は docs/design/koumu-eportal-student-data-model.md §5.0 を参照。
 */
const SCHOOL_CODE = 'B999999999999'; // PoC 用の架空の学校コード（離島の中学校）

interface SeedEntry {
  officialFamily: string;
  officialGiven: string;
  preferredFamily: string;
  preferredGiven: string;
  kanaFamily: string;
  kanaGiven: string;
  sex: '男' | '女';
  birth: [number, number, number]; // [year, month, day]
  grade: 1 | 2 | 3;
  attendance: number;
}

const SEED_ENTRIES: SeedEntry[] = [
  // --- 1年（各学年4名） ---
  { officialFamily: '𠮷田', officialGiven: '蓮', preferredFamily: '吉田', preferredGiven: '蓮', kanaFamily: 'ヨシダ', kanaGiven: 'レン', sex: '男', birth: [2013, 5, 12], grade: 1, attendance: 1 },
  { officialFamily: '髙橋', officialGiven: 'さくら', preferredFamily: '高橋', preferredGiven: 'さくら', kanaFamily: 'タカハシ', kanaGiven: 'サクラ', sex: '女', birth: [2013, 8, 3], grade: 1, attendance: 2 },
  { officialFamily: '佐藤', officialGiven: '大翔', preferredFamily: '佐藤', preferredGiven: '大翔', kanaFamily: 'サトウ', kanaGiven: 'ヒロト', sex: '男', birth: [2013, 11, 23], grade: 1, attendance: 3 },
  { officialFamily: '鈴木', officialGiven: '陽菜', preferredFamily: '鈴木', preferredGiven: '陽菜', kanaFamily: 'スズキ', kanaGiven: 'ヒナ', sex: '女', birth: [2014, 1, 9], grade: 1, attendance: 4 },

  // --- 2年 ---
  { officialFamily: '𡈽屋', officialGiven: '颯太', preferredFamily: '土屋', preferredGiven: '颯太', kanaFamily: 'ツチヤ', kanaGiven: 'ソウタ', sex: '男', birth: [2012, 6, 18], grade: 2, attendance: 1 },
  { officialFamily: '渡邉', officialGiven: '結衣', preferredFamily: '渡辺', preferredGiven: '結衣', kanaFamily: 'ワタナベ', kanaGiven: 'ユイ', sex: '女', birth: [2012, 9, 27], grade: 2, attendance: 2 },
  { officialFamily: '田中', officialGiven: '莉子', preferredFamily: '田中', preferredGiven: '莉子', kanaFamily: 'タナカ', kanaGiven: 'リコ', sex: '女', birth: [2012, 12, 5], grade: 2, attendance: 3 },
  { officialFamily: '山本', officialGiven: '悠真', preferredFamily: '山本', preferredGiven: '悠真', kanaFamily: 'ヤマモト', kanaGiven: 'ユウマ', sex: '男', birth: [2013, 2, 14], grade: 2, attendance: 4 },

  // --- 3年 ---
  { officialFamily: '﨑山', officialGiven: '凜', preferredFamily: '崎山', preferredGiven: '凜', kanaFamily: 'サキヤマ', kanaGiven: 'リン', sex: '女', birth: [2011, 4, 30], grade: 3, attendance: 1 },
  { officialFamily: '中村', officialGiven: '蒼空', preferredFamily: '中村', preferredGiven: '蒼空', kanaFamily: 'ナカムラ', kanaGiven: 'ソラ', sex: '男', birth: [2011, 7, 21], grade: 3, attendance: 2 },
  { officialFamily: '小林', officialGiven: '楓', preferredFamily: '小林', preferredGiven: '楓', kanaFamily: 'コバヤシ', kanaGiven: 'カエデ', sex: '女', birth: [2011, 10, 11], grade: 3, attendance: 3 },
  { officialFamily: '加藤', officialGiven: '隼人', preferredFamily: '加藤', preferredGiven: '隼人', kanaFamily: 'カトウ', kanaGiven: 'ハヤト', sex: '男', birth: [2012, 3, 2], grade: 3, attendance: 4 },
];

/** 入学年月日（その生徒が中1だった年の4月） */
function admissionDateForGrade(grade: 1 | 2 | 3): Date {
  // 2026 年度時点。中1=2026、中2=2025、中3=2024 入学。
  const year = 2026 - (grade - 1);
  return new Date(Date.UTC(year, 3, 6)); // 4/6
}

/**
 * 指定オーナー（校長 = users.id）向けの初期名簿（生徒＋在籍）を生成する。
 * id は明示生成し、enrollment が student を参照できるようにする。
 */
export function buildSeedRoster(ownerUserId: string): {
  studentRows: StudentInsert[];
  enrollmentRows: StudentEnrollmentInsert[];
} {
  const studentRows: StudentInsert[] = [];
  const enrollmentRows: StudentEnrollmentInsert[] = [];

  for (const e of SEED_ENTRIES) {
    const studentId = crypto.randomUUID();
    studentRows.push({
      id: studentId,
      ownerUserId,
      userMasterIdentifier: crypto.randomUUID(),
      officialFamilyName: e.officialFamily,
      officialGivenName: e.officialGiven,
      preferredFamilyName: e.preferredFamily,
      preferredGivenName: e.preferredGiven,
      kanaFamilyName: e.kanaFamily,
      kanaGivenName: e.kanaGiven,
      birthDate: new Date(Date.UTC(e.birth[0], e.birth[1] - 1, e.birth[2])),
      sex: e.sex,
    });
    enrollmentRows.push({
      studentId,
      schoolCode: SCHOOL_CODE,
      grade: String(e.grade),
      classCode: `0${e.grade}01`,
      className: `${e.grade}年1組`,
      attendanceNumber: e.attendance,
      enrollmentStatus: 'enrolled',
      admissionDate: admissionDateForGrade(e.grade),
    });
  }

  return { studentRows, enrollmentRows };
}
