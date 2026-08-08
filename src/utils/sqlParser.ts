// Interactive SQL & BigQuery Engine for Sanctuary Admin Console
// Parses basic SQL syntax to filter, aggregate, group, sort and limit in-memory datasets.

export interface UserRow {
  id: string;
  email: string;
  created_at: string;
  status_stars: number;
  preferred_guide: string;
  subscription: 'Free' | 'Premium' | 'Enterprise';
}

export interface ConversationRow {
  id: string;
  user_id: string;
  deity: string;
  message_count: number;
  sentiment_score: number;
  duration_sec: number;
  completed: boolean;
  date_logged: string;
}

export interface MusicPromptRow {
  id: string;
  user_id: string;
  prompt: string;
  length: 'short' | 'long';
  model: string;
  status: 'success' | 'error';
  timestamp: string;
}

// -------------------------------------------------------------------------
// SIMULATED DATASETS (Used as the backend SQL & BigQuery Tables)
// -------------------------------------------------------------------------

export const USERS_TABLE: UserRow[] = [
  { id: 'USR_001', email: 'ananya.sen@gmail.com', created_at: '2026-07-10', status_stars: 4, preferred_guide: 'athena', subscription: 'Premium' },
  { id: 'USR_002', email: 'pahilajani.manjishtha@gmail.com', created_at: '2026-07-12', status_stars: 1, preferred_guide: 'persephone-soul', subscription: 'Enterprise' },
  { id: 'USR_003', email: 'rohan.das@tech.co', created_at: '2026-07-05', status_stars: 3, preferred_guide: 'sisyphus', subscription: 'Free' },
  { id: 'USR_004', email: 'kabir.mehta@dbt.org', created_at: '2026-07-01', status_stars: 5, preferred_guide: 'hades', subscription: 'Premium' },
  { id: 'USR_005', email: 'buddhadev@mindful.in', created_at: '2026-07-14', status_stars: 2, preferred_guide: 'athena', subscription: 'Free' },
  { id: 'USR_006', email: 'clara.bow@classic.org', created_at: '2026-07-15', status_stars: 4, preferred_guide: 'sappho', subscription: 'Premium' },
  { id: 'USR_007', email: 'socrates@dialogue.gr', created_at: '2026-07-08', status_stars: 1, preferred_guide: 'zeus', subscription: 'Enterprise' },
  { id: 'USR_008', email: 'dionysus_fan@festive.net', created_at: '2026-07-16', status_stars: 5, preferred_guide: 'dionysus', subscription: 'Free' },
  { id: 'USR_009', email: 'selene.stars@sky.org', created_at: '2026-07-17', status_stars: 3, preferred_guide: 'astra', subscription: 'Premium' },
  { id: 'USR_010', email: 'trident_lord@ocean.io', created_at: '2026-07-11', status_stars: 4, preferred_guide: 'poseidon', subscription: 'Free' },
  { id: 'USR_011', email: 'ares_unleashed@combat.com', created_at: '2026-07-03', status_stars: 5, preferred_guide: 'ares', subscription: 'Free' },
  { id: 'USR_012', email: 'marathon_runner@strava.com', created_at: '2026-07-09', status_stars: 2, preferred_guide: 'sisyphus', subscription: 'Premium' }
];

export const CONVERSATIONS_TABLE: ConversationRow[] = [
  { id: 'CON_101', user_id: 'USR_001', deity: 'athena', message_count: 8, sentiment_score: 0.88, duration_sec: 420, completed: true, date_logged: '2026-07-15' },
  { id: 'CON_102', user_id: 'USR_002', deity: 'persephone-soul', message_count: 14, sentiment_score: 0.94, duration_sec: 910, completed: true, date_logged: '2026-07-16' },
  { id: 'CON_103', user_id: 'USR_003', deity: 'sisyphus', message_count: 5, sentiment_score: 0.61, duration_sec: 180, completed: false, date_logged: '2026-07-15' },
  { id: 'CON_104', user_id: 'USR_004', deity: 'hades', message_count: 12, sentiment_score: 0.72, duration_sec: 650, completed: true, date_logged: '2026-07-14' },
  { id: 'CON_105', user_id: 'USR_005', deity: 'athena', message_count: 4, sentiment_score: 0.45, duration_sec: 210, completed: true, date_logged: '2026-07-15' },
  { id: 'CON_106', user_id: 'USR_006', deity: 'sappho', message_count: 19, sentiment_score: 0.91, duration_sec: 1100, completed: true, date_logged: '2026-07-17' },
  { id: 'CON_107', user_id: 'USR_007', deity: 'zeus', message_count: 7, sentiment_score: 0.55, duration_sec: 320, completed: false, date_logged: '2026-07-16' },
  { id: 'CON_108', user_id: 'USR_008', deity: 'dionysus', message_count: 11, sentiment_score: 0.82, duration_sec: 500, completed: true, date_logged: '2026-07-17' },
  { id: 'CON_109', user_id: 'USR_009', deity: 'astra', message_count: 9, sentiment_score: 0.79, duration_sec: 480, completed: true, date_logged: '2026-07-18' },
  { id: 'CON_110', user_id: 'USR_010', deity: 'poseidon', message_count: 6, sentiment_score: 0.67, duration_sec: 300, completed: true, date_logged: '2026-07-16' },
  { id: 'CON_111', user_id: 'USR_011', deity: 'ares', message_count: 15, sentiment_score: 0.35, duration_sec: 800, completed: false, date_logged: '2026-07-15' },
  { id: 'CON_112', user_id: 'USR_012', deity: 'sisyphus', message_count: 8, sentiment_score: 0.76, duration_sec: 390, completed: true, date_logged: '2026-07-16' },
  { id: 'CON_113', user_id: 'USR_002', deity: 'athena', message_count: 10, sentiment_score: 0.89, duration_sec: 520, completed: true, date_logged: '2026-07-17' },
  { id: 'CON_114', user_id: 'USR_001', deity: 'astra', message_count: 3, sentiment_score: 0.82, duration_sec: 150, completed: true, date_logged: '2026-07-18' }
];

export const MUSIC_PROMPTS_TABLE: MusicPromptRow[] = [
  { id: 'MUS_201', user_id: 'USR_001', prompt: 'Calm water flutes with soft Pichwai bells', length: 'short', model: 'lyria-3-clip-preview', status: 'success', timestamp: '2026-07-15T10:14:00Z' },
  { id: 'MUS_202', user_id: 'USR_002', prompt: 'Deep underworld underground bass drone', length: 'long', model: 'lyria-3-pro-preview', status: 'success', timestamp: '2026-07-16T12:05:00Z' },
  { id: 'MUS_203', user_id: 'USR_004', prompt: 'Celestial starry sky wind dynamic chords', length: 'long', model: 'lyria-3-pro-preview', status: 'success', timestamp: '2026-07-14T08:30:00Z' },
  { id: 'MUS_204', user_id: 'USR_005', prompt: 'Angry fire rhythm boundary release', length: 'short', model: 'lyria-3-clip-preview', status: 'error', timestamp: '2026-07-15T09:44:00Z' },
  { id: 'MUS_205', user_id: 'USR_008', prompt: 'Festive grape vineyard acoustic sitar', length: 'short', model: 'lyria-3-clip-preview', status: 'success', timestamp: '2026-07-17T15:22:00Z' },
  { id: 'MUS_206', user_id: 'USR_009', prompt: 'Cosmic constellation synthesis loops', length: 'long', model: 'lyria-3-pro-preview', status: 'success', timestamp: '2026-07-18T11:10:00Z' }
];

// -------------------------------------------------------------------------
// LIGHTWEIGHT SQL PARSER ENGINE
// -------------------------------------------------------------------------

export function executeSQL(queryStr: string): {
  columns: string[];
  rows: any[];
  error?: string;
  executionTimeMs: number;
  bytesScanned?: string;
} {
  const startTime = performance.now();
  const normalizedQuery = queryStr.trim().replace(/\s+/g, ' ');

  // Simulated scan size
  const randScanner = (Math.random() * 5 + 1).toFixed(1);
  const bytesScanned = `${randScanner} MB`;

  try {
    // 1. Identify table and load data
    let tableData: any[] = [];
    let tableName = '';

    if (/from\s+users/i.test(normalizedQuery)) {
      tableData = JSON.parse(JSON.stringify(USERS_TABLE));
      tableName = 'users';
    } else if (/from\s+conversations/i.test(normalizedQuery)) {
      tableData = JSON.parse(JSON.stringify(CONVERSATIONS_TABLE));
      tableName = 'conversations';
    } else if (/from\s+music_prompts/i.test(normalizedQuery)) {
      tableData = JSON.parse(JSON.stringify(MUSIC_PROMPTS_TABLE));
      tableName = 'music_prompts';
    } else {
      throw new Error("Syntax Error: Table name not found or not supported. Use 'users', 'conversations', or 'music_prompts'.");
    }

    // 2. Filter data (WHERE clause)
    const whereMatch = normalizedQuery.match(/where\s+(.*?)(?=\s+group\s+by|\s+order\s+by|\s+limit|$)/i);
    if (whereMatch) {
      const conditionStr = whereMatch[1].trim();
      tableData = filterData(tableData, conditionStr);
    }

    // 3. Columns selection and aggregation (SELECT & GROUP BY)
    const selectMatch = normalizedQuery.match(/select\s+(.*?)\s+from/i);
    if (!selectMatch) {
      throw new Error("Syntax Error: Missing SELECT keyword.");
    }
    const columnsStr = selectMatch[1].trim();

    const groupByMatch = normalizedQuery.match(/group\s+by\s+(.*?)(?=\s+order\s+by|\s+limit|$)/i);
    let finalRows: any[] = [];
    let columns: string[] = [];

    if (groupByMatch) {
      const groupByCol = groupByMatch[1].trim().toLowerCase();
      const aggregates = parseSelectAggregates(columnsStr);
      finalRows = executeGroupBy(tableData, groupByCol, aggregates);
      columns = [groupByCol, ...aggregates.map(a => a.alias)];
    } else {
      // Direct column select or '*'
      if (columnsStr === '*') {
        if (tableData.length > 0) {
          columns = Object.keys(tableData[0]);
        } else {
          columns = tableName === 'users' 
            ? ['id', 'email', 'created_at', 'status_stars', 'preferred_guide', 'subscription']
            : tableName === 'conversations'
            ? ['id', 'user_id', 'deity', 'message_count', 'sentiment_score', 'duration_sec', 'completed', 'date_logged']
            : ['id', 'user_id', 'prompt', 'length', 'model', 'status', 'timestamp'];
        }
        finalRows = tableData;
      } else {
        const selectedCols = columnsStr.split(',').map(s => s.trim());
        columns = selectedCols;
        finalRows = tableData.map(row => {
          const selectedRow: any = {};
          selectedCols.forEach(col => {
            const lowCol = col.toLowerCase();
            // Handle lowercase mapping
            const actualKey = Object.keys(row).find(k => k.toLowerCase() === lowCol);
            selectedRow[col] = actualKey ? (row as any)[actualKey] : null;
          });
          return selectedRow;
        });
      }
    }

    // 4. Order results (ORDER BY clause)
    const orderByMatch = normalizedQuery.match(/order\s+by\s+(.*?)(?=\s+limit|$)/i);
    if (orderByMatch) {
      const orderByParts = orderByMatch[1].trim().split(' ');
      const orderCol = orderByParts[0].trim();
      const isDesc = orderByParts[1] && orderByParts[1].toLowerCase() === 'desc';
      finalRows = sortRows(finalRows, orderCol, isDesc);
    }

    // 5. Limit results (LIMIT clause)
    const limitMatch = normalizedQuery.match(/limit\s+(\d+)/i);
    if (limitMatch) {
      const limitVal = parseInt(limitMatch[1], 10);
      finalRows = finalRows.slice(0, limitVal);
    }

    return {
      columns,
      rows: finalRows,
      executionTimeMs: parseFloat((performance.now() - startTime).toFixed(2)),
      bytesScanned
    };

  } catch (err: any) {
    return {
      columns: [],
      rows: [],
      error: err.message || 'Unknown database query compilation error.',
      executionTimeMs: parseFloat((performance.now() - startTime).toFixed(2)),
      bytesScanned: '0 MB'
    };
  }
}

// -------------------------------------------------------------------------
// QUERY PARSING & FILTERING UTILITIES
// -------------------------------------------------------------------------

function filterData(data: any[], conditionStr: string): any[] {
  // Handles column = 'value', column > value, column LIKE '%val%', etc.
  // Split on AND/OR if present. We'll support simple AND splits.
  const conditions = conditionStr.split(/\s+and\s+/i);
  
  return data.filter(row => {
    return conditions.every(cond => {
      const match = cond.match(/(.*?)\s*(=|>|<|!=|like)\s*(.*)/i);
      if (!match) return true;

      const colName = match[1].trim().toLowerCase();
      const operator = match[2].trim().toLowerCase();
      let rawVal = match[3].trim();

      // Clean value wrapping (quotes)
      if ((rawVal.startsWith("'") && rawVal.endsWith("'")) || (rawVal.startsWith('"') && rawVal.endsWith('"'))) {
        rawVal = rawVal.slice(1, -1);
      }

      const rowKey = Object.keys(row).find(k => k.toLowerCase() === colName);
      if (!rowKey) return false;

      const rowVal = row[rowKey];

      if (operator === '=') {
        return String(rowVal).toLowerCase() === rawVal.toLowerCase();
      } else if (operator === '!=') {
        return String(rowVal).toLowerCase() !== rawVal.toLowerCase();
      } else if (operator === '>') {
        return Number(rowVal) > Number(rawVal);
      } else if (operator === '<') {
        return Number(rowVal) < Number(rawVal);
      } else if (operator === 'like') {
        const cleanLike = rawVal.replace(/%/g, '').toLowerCase();
        return String(rowVal).toLowerCase().includes(cleanLike);
      }

      return true;
    });
  });
}

interface AggregateDef {
  fn: 'count' | 'avg' | 'sum';
  col: string;
  alias: string;
}

function parseSelectAggregates(selectStr: string): AggregateDef[] {
  const parts = selectStr.split(',').map(p => p.trim());
  const aggregates: AggregateDef[] = [];

  parts.forEach(part => {
    const aggMatch = part.match(/(count|avg|sum)\((.*?)\)\s+as\s+(.*)/i) || part.match(/(count|avg|sum)\((.*?)\)/i);
    if (aggMatch) {
      const fn = aggMatch[1].toLowerCase() as 'count' | 'avg' | 'sum';
      const col = aggMatch[2].trim();
      const alias = aggMatch[3] ? aggMatch[3].trim() : `${fn}_${col}`;
      aggregates.push({ fn, col, alias });
    }
  });

  return aggregates;
}

function executeGroupBy(data: any[], groupByCol: string, aggregates: AggregateDef[]): any[] {
  const groups: Record<string, any[]> = {};

  data.forEach(row => {
    const key = Object.keys(row).find(k => k.toLowerCase() === groupByCol);
    const groupVal = key ? String(row[key]) : 'undefined';
    if (!groups[groupVal]) {
      groups[groupVal] = [];
    }
    groups[groupVal].push(row);
  });

  return Object.keys(groups).map(groupName => {
    const rows = groups[groupName];
    const groupedRow: any = {};
    groupedRow[groupByCol] = groupName;

    aggregates.forEach(agg => {
      if (agg.fn === 'count') {
        groupedRow[agg.alias] = rows.length;
      } else if (agg.fn === 'sum') {
        const key = Object.keys(rows[0] || {}).find(k => k.toLowerCase() === agg.col.toLowerCase());
        const sum = rows.reduce((acc, r) => acc + (key ? Number(r[key]) || 0 : 0), 0);
        groupedRow[agg.alias] = parseFloat(sum.toFixed(2));
      } else if (agg.fn === 'avg') {
        const key = Object.keys(rows[0] || {}).find(k => k.toLowerCase() === agg.col.toLowerCase());
        const sum = rows.reduce((acc, r) => acc + (key ? Number(r[key]) || 0 : 0), 0);
        groupedRow[agg.alias] = rows.length > 0 ? parseFloat((sum / rows.length).toFixed(2)) : 0;
      }
    });

    return groupedRow;
  });
}

function sortRows(data: any[], sortCol: string, isDesc: boolean): any[] {
  return [...data].sort((a, b) => {
    const keyA = Object.keys(a).find(k => k.toLowerCase() === sortCol.toLowerCase()) || sortCol;
    const keyB = Object.keys(b).find(k => k.toLowerCase() === sortCol.toLowerCase()) || sortCol;

    const valA = a[keyA];
    const valB = b[keyB];

    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    if (typeof valA === 'number' && typeof valB === 'number') {
      return isDesc ? valB - valA : valA - valB;
    }

    return isDesc 
      ? String(valB).localeCompare(String(valA))
      : String(valA).localeCompare(String(valB));
  });
}
