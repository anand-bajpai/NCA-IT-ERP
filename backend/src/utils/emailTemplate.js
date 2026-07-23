export function renderEmailTable(title, rows, instituteName = "NCA IT Solution") {
  const rowsHtml = rows
    .filter((r) => r.value !== undefined && r.value !== null && r.value !== "")
    .map(
      (r) => `
      <tr>
        <td style="padding:10px 14px;background:#f5f7fb;font-weight:600;color:#2d3748;border:1px solid #e5e7eb;width:200px;">${r.label}</td>
        <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#1a202c;">${r.value}</td>
      </tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:auto;">
    <div style="background:#2563eb;color:#fff;padding:18px 24px;border-radius:8px 8px 0 0;">
      <h2 style="margin:0;font-size:20px;">${title}</h2>
      <p style="margin:4px 0 0;font-size:13px;opacity:.85;">${instituteName} — website notification</p>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-top:none;">
      ${rowsHtml}
    </table>
    <p style="font-size:12px;color:#888;margin-top:14px;">
      This message was generated automatically from the ${instituteName} website.
    </p>
  </div>`;
}
