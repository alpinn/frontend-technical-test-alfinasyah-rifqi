function escapeCell(value: string) {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

export function downloadCsv(filename: string, rows: string[][]) {
  const content = rows.map((row) => row.map(escapeCell).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
