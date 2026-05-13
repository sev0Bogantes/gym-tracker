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
  debug?: object // returned in dev for troubleshooting
}

/** Lower-case, trimmed, collapsed header */
function normaliseHeader(h: unknown): string {
  return String(h ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/** Look for a value by any of the given aliases */
function getCol(row: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    if (alias in row && row[alias] !== '' && row[alias] !== null && row[alias] !== undefined)
      return row[alias]
  }
  return undefined
}

/** Parse a numeric value, return null if invalid */
function parseNum(val: unknown): number | null {
  if (val === '' || val === null || val === undefined) return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

/**
 * Attempt to detect which column contains exercise names.
 * Returns the normalised column key, or undefined if not found.
 */
function detectExerciseCol(headers: string[]): string | undefined {
  const exercisePriority = [
    'exercise', 'exercise name', 'exercises', 'name', 'ejercicio',
    'ejercicios', 'nombre', 'movement', 'movimiento', 'ex',
  ]
  for (const alias of exercisePriority) {
    if (headers.includes(alias)) return alias
  }
  // fallback: first text-looking column
  return headers.find((h) => !['sets', 'reps', 'series', 'repeticiones', 'weight', 'peso', 'kg', 'lbs', 'notes', 'notas'].includes(h))
}

/**
 * Attempt to detect the Day-grouping column.
 */
function detectDayCol(headers: string[]): string | undefined {
  const dayAliases = ['day', 'day name', 'dia', 'día', 'day number', 'grupo', 'group', 'session', 'sesion', 'sesión', 'muscle group', 'grupo muscular']
  return dayAliases.find((a) => headers.includes(a))
}

/**
 * Parse a single sheet's rows into exercises.
 * Returns exercises only; caller decides which day they belong to.
 */
function parseRows(rows: Record<string, unknown>[]): { exercises: ParsedExercise[]; dayGroups: Map<string, ParsedExercise[]> } {
  if (rows.length === 0) return { exercises: [], dayGroups: new Map() }

  // Normalise all headers
  const normRows = rows.map((r) => {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(r)) {
      out[normaliseHeader(key)] = r[key]
    }
    return out
  })

  const headers = Object.keys(normRows[0] ?? {})
  const exCol = detectExerciseCol(headers)
  const dayCol = detectDayCol(headers)

  const allExercises: ParsedExercise[] = []
  const dayGroups = new Map<string, ParsedExercise[]>()
  let orderIndex = 0

  for (const r of normRows) {
    // Skip rows without an exercise name
    if (!exCol) continue
    const rawName = String(r[exCol] ?? '').trim()
    if (!rawName || rawName.toLowerCase() === exCol) continue // skip header repeat rows

    const ex: ParsedExercise = {
      name: rawName,
      sets: parseNum(getCol(r, ['sets', 'series', 'set'])) ?? 3,
      reps: String(getCol(r, ['reps', 'repetitions', 'repeticiones', 'rep', 'reps/set']) ?? '10').trim() || '10',
      initialWeight: parseNum(getCol(r, ['weight', 'initial weight', 'peso inicial', 'peso', 'kg', 'lbs', 'load', 'carga'])),
      notes: String(getCol(r, ['notes', 'note', 'notas', 'nota', 'comments', 'comentarios']) ?? '').trim() || null,
      orderIndex: orderIndex++,
    }

    allExercises.push(ex)

    // Group by day column if present
    if (dayCol) {
      const dayKey = String(r[dayCol] ?? 'Day 1').trim() || 'Day 1'
      if (!dayGroups.has(dayKey)) dayGroups.set(dayKey, [])
      dayGroups.get(dayKey)!.push(ex)
    }
  }

  return { exercises: allExercises, dayGroups }
}

/**
 * Main parser – accepts an ArrayBuffer from a File read.
 *
 * Supported layouts:
 *  A) Multi-sheet: each sheet = one training day
 *  B) Single sheet with a "Day" (or similar) column
 *  C) Single sheet with NO day column → treated as one day named after the sheet
 */
export function parseExcelRoutine(buffer: ArrayBuffer): ParsedRoutine {
  const workbook = XLSX.read(buffer, { type: 'array', cellText: false, cellDates: true })

  const debugInfo: Record<string, unknown> = {
    sheetNames: workbook.SheetNames,
  }

  // ── Strategy A: multiple sheets → each is a day ─────────────────────────
  if (workbook.SheetNames.length > 1) {
    const days: ParsedDay[] = []

    for (const [idx, sheetName] of workbook.SheetNames.entries()) {
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false })

      debugInfo[`sheet_${sheetName}_rowCount`] = rows.length
      debugInfo[`sheet_${sheetName}_firstRow`] = rows[0]

      const { exercises } = parseRows(rows)
      if (exercises.length > 0) {
        days.push({ dayNumber: idx + 1, name: sheetName, exercises })
      }
    }

    return {
      name: workbook.SheetNames[0] ?? 'My Routine',
      totalWeeks: 8,
      days,
      debug: debugInfo,
    }
  }

  // ── Single sheet ──────────────────────────────────────────────────────────
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false })

  debugInfo['singleSheet_rowCount'] = rows.length
  debugInfo['singleSheet_headers'] = rows[0] ? Object.keys(rows[0]).map(normaliseHeader) : []
  debugInfo['singleSheet_firstRow'] = rows[0]
  debugInfo['singleSheet_secondRow'] = rows[1]

  const { exercises: allExercises, dayGroups } = parseRows(rows)

  debugInfo['detectedExercises'] = allExercises.length
  debugInfo['detectedDayGroups'] = dayGroups.size

  // ── Strategy B: Day column found → group by it ───────────────────────────
  if (dayGroups.size > 0) {
    const days: ParsedDay[] = []
    let dayNum = 1
    for (const [dayName, exercises] of dayGroups.entries()) {
      days.push({ dayNumber: dayNum++, name: dayName, exercises })
    }
    return { name: sheetName, totalWeeks: 8, days, debug: debugInfo }
  }

  // ── Strategy C: No day column → one day = entire sheet ───────────────────
  if (allExercises.length > 0) {
    return {
      name: sheetName,
      totalWeeks: 8,
      days: [{ dayNumber: 1, name: sheetName, exercises: allExercises }],
      debug: debugInfo,
    }
  }

  // ── Strategy D: Nothing detected → try treating every row as an exercise ──
  // (handles files where row 1 is data, no headers at all)
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })
  const fallbackExercises: ParsedExercise[] = []
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i] as unknown[]
    const name = String(row[0] ?? '').trim()
    if (!name) continue
    fallbackExercises.push({
      name,
      sets: parseNum(row[1]) ?? 3,
      reps: String(row[2] ?? '10').trim() || '10',
      initialWeight: parseNum(row[3]),
      notes: String(row[4] ?? '').trim() || null,
      orderIndex: i,
    })
  }

  return {
    name: sheetName,
    totalWeeks: 8,
    days: fallbackExercises.length > 0
      ? [{ dayNumber: 1, name: sheetName, exercises: fallbackExercises }]
      : [],
    debug: debugInfo,
  }
}
