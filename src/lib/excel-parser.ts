import * as XLSX from 'xlsx'

export interface ParsedExercise {
  name: string
  sets: number
  reps: string
  initialWeight: number | null
  notes: string | null
  orderIndex: number
}

export interface ParsedDay {
  dayNumber: number
  name: string
  exercises: ParsedExercise[]
}

export interface ParsedRoutine {
  name: string
  totalWeeks: number
  days: ParsedDay[]
}

/**
 * Normalise a header string: lower-case, trim, collapse spaces
 */
function normaliseHeader(h: unknown): string {
  return String(h ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Try to find a column value by multiple possible header aliases
 */
function getCol(row: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    if (alias in row) return row[alias]
  }
  return undefined
}

/**
 * Parse a number that may be stored as a string
 */
function parseNum(val: unknown): number | null {
  const n = Number(val)
  return isNaN(n) || val === '' || val === null || val === undefined ? null : n
}

/**
 * Main parser – accepts an ArrayBuffer from a File read.
 *
 * Expected Excel layout (flexible column names):
 *   Day / Day Name | Exercise | Sets | Reps | Weight / Initial Weight | Notes
 *
 * The sheet can have any name. If multiple sheets exist, each sheet is treated
 * as one day (sheet name = day name). Otherwise the "Day" column is used.
 */
export function parseExcelRoutine(buffer: ArrayBuffer): ParsedRoutine {
  const workbook = XLSX.read(buffer, { type: 'array' })

  // Strategy A: each sheet is a day
  if (workbook.SheetNames.length > 1) {
    return parseMultiSheetWorkbook(workbook)
  }

  // Strategy B: single sheet with a Day column
  return parseSingleSheetWorkbook(workbook)
}

function parseMultiSheetWorkbook(workbook: XLSX.WorkBook): ParsedRoutine {
  const days: ParsedDay[] = []

  workbook.SheetNames.forEach((sheetName, idx) => {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    })

    const normRows = rows.map((r) => {
      const out: Record<string, unknown> = {}
      for (const key of Object.keys(r)) {
        out[normaliseHeader(key)] = r[key]
      }
      return out
    })

    const exercises = normRows
      .filter((r) => getCol(r, ['exercise', 'exercise name', 'name', 'ejercicio']))
      .map((r, orderIndex) => ({
        name: String(getCol(r, ['exercise', 'exercise name', 'name', 'ejercicio']) ?? '').trim(),
        sets: parseNum(getCol(r, ['sets', 'series'])) ?? 3,
        reps: String(getCol(r, ['reps', 'repetitions', 'repeticiones', 'rep']) ?? '10').trim(),
        initialWeight: parseNum(getCol(r, ['weight', 'initial weight', 'peso inicial', 'peso', 'kg'])),
        notes: String(getCol(r, ['notes', 'note', 'notas', 'nota']) ?? '').trim() || null,
        orderIndex,
      }))
      .filter((e) => e.name)

    if (exercises.length > 0) {
      days.push({ dayNumber: idx + 1, name: sheetName, exercises })
    }
  })

  return {
    name: workbook.SheetNames[0] ?? 'My Routine',
    totalWeeks: 8,
    days,
  }
}

function parseSingleSheetWorkbook(workbook: XLSX.WorkBook): ParsedRoutine {
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
  })

  const normRows = rows.map((r) => {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(r)) {
      out[normaliseHeader(key)] = r[key]
    }
    return out
  })

  // Group by day
  const dayMap = new Map<string, ParsedDay>()
  let orderIndex = 0

  for (const r of normRows) {
    const exerciseName = String(
      getCol(r, ['exercise', 'exercise name', 'name', 'ejercicio']) ?? ''
    ).trim()
    if (!exerciseName) continue

    const dayRaw = String(
      getCol(r, ['day', 'day name', 'dia', 'día', 'day number', 'grupo']) ?? 'Day 1'
    ).trim()

    if (!dayMap.has(dayRaw)) {
      dayMap.set(dayRaw, {
        dayNumber: dayMap.size + 1,
        name: dayRaw,
        exercises: [],
      })
    }

    const day = dayMap.get(dayRaw)!
    day.exercises.push({
      name: exerciseName,
      sets: parseNum(getCol(r, ['sets', 'series'])) ?? 3,
      reps: String(getCol(r, ['reps', 'repetitions', 'repeticiones', 'rep']) ?? '10').trim(),
      initialWeight: parseNum(
        getCol(r, ['weight', 'initial weight', 'peso inicial', 'peso', 'kg'])
      ),
      notes: String(getCol(r, ['notes', 'note', 'notas', 'nota']) ?? '').trim() || null,
      orderIndex: orderIndex++,
    })
  }

  const days = Array.from(dayMap.values())

  return {
    name: workbook.SheetNames[0] ?? 'My Routine',
    totalWeeks: 8,
    days,
  }
}
