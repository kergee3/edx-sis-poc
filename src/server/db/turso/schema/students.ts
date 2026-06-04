import { sqliteTable, text, integer, index, unique } from 'drizzle-orm/sqlite-core';
import { users } from './auth';

/**
 * 生徒（児童生徒）マスタ。設計の土台は docs/design/student-schema-design.md §3.1。
 *
 * - per-user スコープ: `ownerUserId` でログインした校長 (users.id) ごとに名簿を分離する。
 *   users への FK は onDelete: cascade なので user 削除時に自動削除される（user-deletion.ts 改修不要）。
 * - 氏名は 3 系統に分離する（文字集合の用語は docs/design/koumu-eportal-student-data-model.md §5.0）:
 *     official_* = 正式氏名（漢字。MJ特有文字可。IPAmjexMincho で表示）
 *     preferred_* = 表示名（JIS文字。連携・一般表示用）
 *     kana_*      = カナ（全角）
 * - 増分1では住所・外国人氏名・郵便番号など設計書 §3.1 の一部列は未実装（読取一覧に不要なため後続）。
 */
export const students = sqliteTable(
  'students',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // per-user スコープ（校長 = users.id）
    ownerUserId: text('owner_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // OneRoster 連携用の利用者識別子（UUID v4）
    userMasterIdentifier: text('user_master_identifier')
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),

    // 正式氏名（MJ特有文字可）
    officialFamilyName: text('official_family_name').notNull(),
    officialGivenName: text('official_given_name').notNull(),
    // 表示名（JIS文字）
    preferredFamilyName: text('preferred_family_name').notNull(),
    preferredGivenName: text('preferred_given_name').notNull(),
    preferredMiddleName: text('preferred_middle_name'),
    // カナ（全角）
    kanaFamilyName: text('kana_family_name').notNull(),
    kanaGivenName: text('kana_given_name').notNull(),
    kanaMiddleName: text('kana_middle_name'),

    birthDate: integer('birth_date', { mode: 'timestamp_ms' }).notNull(),
    sex: text('sex'),
    nationality: text('nationality'),

    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index('students_owner_idx').on(t.ownerUserId),
    unique('students_user_master_identifier_uq').on(t.userMasterIdentifier),
  ],
);

/**
 * 在籍（学籍）。設計の土台は docs/design/student-schema-design.md §3.2。
 * 増分1では「1 生徒 = 1 在籍（現在の在籍）」で運用する。
 */
export const studentEnrollments = sqliteTable(
  'student_enrollments',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    studentId: text('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    schoolCode: text('school_code').notNull(),
    grade: text('grade').notNull(),
    classCode: text('class_code'),
    className: text('class_name'),
    attendanceNumber: integer('attendance_number'),
    enrollmentStatus: text('enrollment_status').notNull(),
    admissionDate: integer('admission_date', { mode: 'timestamp_ms' }),
    transferInDate: integer('transfer_in_date', { mode: 'timestamp_ms' }),
    transferOutDate: integer('transfer_out_date', { mode: 'timestamp_ms' }),
    graduationDate: integer('graduation_date', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('student_enrollments_student_idx').on(t.studentId)],
);

export type StudentRow = typeof students.$inferSelect;
export type StudentInsert = typeof students.$inferInsert;
export type StudentEnrollmentRow = typeof studentEnrollments.$inferSelect;
export type StudentEnrollmentInsert = typeof studentEnrollments.$inferInsert;
