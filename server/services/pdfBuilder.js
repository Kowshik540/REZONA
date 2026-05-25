'use strict';
const PDFDocument = require('pdfkit');

function buildResumePdf(data, fmt) {
  fmt = Math.max(1, Math.min(34, parseInt(fmt) || 1));
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 40, left: 50, right: 50 }, info: { Title: data.name || 'Resume' } });
      const buf = [];
      doc.on('data', c => buf.push(c));
      doc.on('end', () => resolve(Buffer.concat(buf)));
      doc.on('error', reject);
      const W = doc.page.width - 100, L = 50;
      let y = 40;
      function cp() { if (y > 730) { doc.addPage(); y = 40; } }
      const name = data.name || 'Candidate';
      const contact = [data.phone, data.email, data.location, data.linkedin, data.github].filter(Boolean);

      if (fmt <= 6) { groupA(doc, data, fmt, name, contact, W, L); }
      else if (fmt <= 11) { groupB(doc, data, fmt, name, contact, W, L); }
      else if (fmt <= 17) { groupC(doc, data, fmt, name, contact, W, L); }
      else if (fmt <= 22) { groupD(doc, data, fmt, name, contact, W, L); }
      else if (fmt <= 28) { groupE(doc, data, fmt, name, contact, W, L); }
      else { groupF(doc, data, fmt, name, contact, W, L); }

      doc.end();
    } catch (e) { reject(e); }
  });
}

// ═══ GROUP A: formats 1-6 — Classic Centered, Helvetica ═══
function groupA(doc, data, fmt, name, contact, W, L) {
  let y = 40;
  function cp() { if (y > 730) { doc.addPage(); y = 40; } }
  // Header: centered name
  doc.font('Helvetica-Bold').fontSize(22).fillColor([0,0,0]).text(name, L, y, {width:W, align:'center'}); y+=28;
  if (contact.length) { doc.font('Helvetica').fontSize(8.5).fillColor([50,50,50]).text(contact.join('  •  '), L, y, {width:W, align:'center'}); y+=14; }
  // Separator varies per fmt
  if (fmt===1) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).stroke(); y+=12; }
  else if (fmt===2) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(2).stroke(); y+=14; }
  else if (fmt===3) { doc.font('Helvetica-Bold').fontSize(22).fillColor([0,0,0]); doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.8).stroke(); doc.moveTo(L,y+3).lineTo(L+W,y+3).strokeColor([0,0,0]).lineWidth(0.3).stroke(); y+=16; }
  else if (fmt===4) { y+=10; }
  else if (fmt===5) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.4).dash(5,{space:3}).stroke(); doc.undash(); y+=12; }
  else { doc.moveTo(L+W/2-40,y).lineTo(L+W/2+40,y).strokeColor([0,0,0]).lineWidth(1).stroke(); y+=12; }
  // Sections
  function sec(t) { cp();y+=8;doc.font('Helvetica-Bold').fontSize(10).fillColor([0,0,0]).text(t.toUpperCase(),L,y,{width:W});y+=13;doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.4).stroke();y+=7; }
  function body(t) { cp();doc.font('Helvetica').fontSize(9).fillColor([0,0,0]);const h=doc.heightOfString(t,{width:W});doc.text(t,L,y,{width:W});y+=h+6; }
  function bul(t) { cp();doc.font('Helvetica').fontSize(9).fillColor([0,0,0]).text('•',L+4,y);const h=doc.heightOfString(t,{width:W-14});doc.text(t,L+14,y,{width:W-14});y+=h+3; }
  function exp() { if(!data.experience?.length)return;sec('Professional Experience');for(const e of data.experience){cp();doc.font('Helvetica-Bold').fontSize(9.3).fillColor([0,0,0]).text(`${e.role||''}${e.company?' | '+e.company:''}`,L,y,{width:W*0.7});if(e.duration)doc.font('Helvetica').fontSize(8.5).fillColor([60,60,60]).text(e.duration,L,y,{width:W,align:'right'});y+=13;if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=5;} }
  function skills() { if(data.skills?.length){sec('Technical Skills');body(data.skills.join('  •  '));} }
  function edu() { if(!data.education?.length)return;sec('Education');for(const e of data.education){cp();doc.font('Helvetica-Bold').fontSize(9).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W*0.7});if(e.year)doc.font('Helvetica').fontSize(8.5).fillColor([60,60,60]).text(e.year,L,y,{width:W,align:'right'});y+=12;if(e.institution){doc.font('Helvetica').fontSize(8.5).fillColor([40,40,40]).text(e.institution,L,y);y+=10;}y+=3;} }
  function proj() { if(!data.projects?.length)return;sec('Projects');for(const p of data.projects){cp();doc.font('Helvetica-Bold').fontSize(9).fillColor([0,0,0]).text(`${p.name||''}${p.tech?' | '+p.tech:''}`,L,y,{width:W});y+=12;if(p.description)bul(p.description);y+=3;} }
  function ach() { if(data.achievements?.length){sec('Achievements');for(const a of data.achievements)bul(a);} }
  if(data.summary){sec('Professional Summary');body(data.summary);}
  skills();exp();proj();edu();ach();
  if(data.certifications?.length){sec('Certifications');for(const c of data.certifications)bul(c);}
}

// ═══ GROUP B: formats 7-11 — Left Bold Sans, no section underlines ═══
function groupB(doc, data, fmt, name, contact, W, L) {
  let y = 40;
  function cp() { if (y > 730) { doc.addPage(); y = 40; } }
  doc.font('Helvetica-Bold').fontSize(22).fillColor([0,0,0]).text(name, L, y, {width:W}); y+=28;
  if (contact.length) { doc.font('Helvetica').fontSize(8.5).fillColor([50,50,50]).text(contact.join('  |  '), L, y, {width:W}); y+=14; }
  if (fmt===7) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.4).stroke(); y+=12; }
  else if (fmt===8) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(1.5).stroke(); y+=14; }
  else if (fmt===9) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.4).dash(4,{space:2}).stroke(); doc.undash(); y+=12; }
  else if (fmt===10) { doc.moveTo(L,y).lineTo(L+60,y).strokeColor([0,0,0]).lineWidth(1.5).stroke(); y+=12; }
  else { y+=16; }
  function sec(t) { cp();y+=8;doc.font('Helvetica-Bold').fontSize(10.5).fillColor([0,0,0]).text(t.toUpperCase(),L,y,{width:W});y+=16; }
  function body(t) { cp();doc.font('Helvetica').fontSize(9.5).fillColor([0,0,0]);const h=doc.heightOfString(t,{width:W});doc.text(t,L,y,{width:W});y+=h+6; }
  function bul(t) { cp();doc.font('Helvetica').fontSize(9.5).fillColor([0,0,0]).text('–',L+4,y);const h=doc.heightOfString(t,{width:W-14});doc.text(t,L+14,y,{width:W-14});y+=h+3; }
  function exp() { if(!data.experience?.length)return;sec('Professional Experience');for(const e of data.experience){cp();doc.font('Helvetica-Bold').fontSize(9.8).fillColor([0,0,0]).text(`${e.role||''}${e.company?' | '+e.company:''}`,L,y,{width:W*0.7});if(e.duration)doc.font('Helvetica').fontSize(8.5).fillColor([60,60,60]).text(e.duration,L,y,{width:W,align:'right'});y+=13;if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=5;} }
  function skills() { if(data.skills?.length){sec('Technical Skills');body(data.skills.join('  |  '));} }
  function edu() { if(!data.education?.length)return;sec('Education');for(const e of data.education){cp();doc.font('Helvetica-Bold').fontSize(9.5).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W*0.7});if(e.year)doc.font('Helvetica').fontSize(8.5).fillColor([60,60,60]).text(e.year,L,y,{width:W,align:'right'});y+=12;if(e.institution){doc.font('Helvetica').fontSize(8.5).fillColor([40,40,40]).text(e.institution,L,y);y+=10;}y+=3;} }
  function proj() { if(!data.projects?.length)return;sec('Projects');for(const p of data.projects){cp();doc.font('Helvetica-Bold').fontSize(9.5).fillColor([0,0,0]).text(`${p.name||''}${p.tech?' | '+p.tech:''}`,L,y,{width:W});y+=12;if(p.description)bul(p.description);y+=3;} }
  function ach() { if(data.achievements?.length){sec('Achievements');for(const a of data.achievements)bul(a);} }
  if(data.summary){sec('Summary');body(data.summary);}
  exp();skills();proj();edu();ach();
  if(data.certifications?.length){sec('Certifications');for(const c of data.certifications)bul(c);}
}

// ═══ GROUP C: formats 12-17 — Serif Centered, dashed section lines ═══
function groupC(doc, data, fmt, name, contact, W, L) {
  let y = 40;
  function cp() { if (y > 730) { doc.addPage(); y = 40; } }
  const ns = fmt===14 ? name.toUpperCase() : name;
  const nfs = fmt===12?24:fmt===13?20:fmt===14?26:fmt===15?22:fmt===16?20:24;
  doc.font('Times-Bold').fontSize(nfs).fillColor([0,0,0]).text(ns, L, y, {width:W, align:'center'}); y+=nfs+8;
  if (contact.length) { doc.font('Times-Roman').fontSize(9).fillColor([50,50,50]).text(contact.join('  |  '), L, y, {width:W, align:'center'}); y+=14; }
  if (fmt===12) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).stroke(); y+=12; }
  else if (fmt===13) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(1.5).stroke(); y+=14; }
  else if (fmt===14) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.8).stroke(); doc.moveTo(L,y+3).lineTo(L+W,y+3).strokeColor([0,0,0]).lineWidth(0.3).stroke(); y+=16; }
  else if (fmt===15) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.4).dash(4,{space:2}).stroke(); doc.undash(); y+=12; }
  else if (fmt===16) { doc.moveTo(L+W/2-40,y).lineTo(L+W/2+40,y).strokeColor([0,0,0]).lineWidth(1).stroke(); y+=12; }
  else { y+=10; }
  function sec(t) { cp();y+=8;doc.font('Times-Bold').fontSize(10).fillColor([0,0,0]).text(t.toUpperCase(),L,y,{width:W});y+=13;doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.3).dash(3,{space:2}).stroke();doc.undash();y+=7; }
  function body(t) { cp();doc.font('Times-Roman').fontSize(10).fillColor([0,0,0]);const h=doc.heightOfString(t,{width:W});doc.text(t,L,y,{width:W});y+=h+6; }
  function bul(t) { cp();doc.font('Times-Roman').fontSize(10).fillColor([0,0,0]).text(String.fromCharCode(9656),L+4,y);const h=doc.heightOfString(t,{width:W-16});doc.text(t,L+16,y,{width:W-16});y+=h+3; }
  function exp() { if(!data.experience?.length)return;sec('Experience');for(const e of data.experience){cp();doc.font('Times-Bold').fontSize(10.3).fillColor([0,0,0]).text(`${e.role||''}${e.company?' — '+e.company:''}`,L,y,{width:W*0.7});if(e.duration)doc.font('Times-Roman').fontSize(9).fillColor([60,60,60]).text(e.duration,L,y,{width:W,align:'right'});y+=14;if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=5;} }
  function skills() { if(data.skills?.length){sec('Skills');body(data.skills.join('  •  '));} }
  function edu() { if(!data.education?.length)return;sec('Education');for(const e of data.education){cp();doc.font('Times-Bold').fontSize(10).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W*0.7});if(e.year)doc.font('Times-Roman').fontSize(9).fillColor([60,60,60]).text(e.year,L,y,{width:W,align:'right'});y+=12;if(e.institution){doc.font('Times-Roman').fontSize(9).fillColor([40,40,40]).text(e.institution,L,y);y+=10;}y+=3;} }
  function proj() { if(!data.projects?.length)return;sec('Projects');for(const p of data.projects){cp();doc.font('Times-Bold').fontSize(10).fillColor([0,0,0]).text(`${p.name||''}${p.tech?' ['+p.tech+']':''}`,L,y,{width:W});y+=12;if(p.description)bul(p.description);y+=3;} }
  function ach() { if(data.achievements?.length){sec('Achievements');for(const a of data.achievements)bul(a);} }
  if(data.summary){sec('Professional Summary');body(data.summary);}
  exp();skills();proj();edu();ach();
  if(data.certifications?.length){sec('Certifications');for(const c of data.certifications)bul(c);}
}

// ═══ GROUP D: formats 18-22 — Serif Left Split (name left, contact right) ═══
function groupD(doc, data, fmt, name, contact, W, L) {
  let y = 40;
  function cp() { if (y > 730) { doc.addPage(); y = 40; } }
  doc.font('Times-Bold').fontSize(20).fillColor([0,0,0]).text(name, L, y, {width:W*0.55});
  if (contact.length) { doc.font('Times-Roman').fontSize(8).fillColor([60,60,60]).text(contact.join('\n'), L+W*0.55, y, {width:W*0.45, align:'right'}); }
  y += Math.max(26, contact.length * 11 + 4);
  if (fmt===18) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.4).stroke(); y+=12; }
  else if (fmt===19) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(1).stroke(); y+=14; }
  else if (fmt===20) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.4).dash(4,{space:2}).stroke(); doc.undash(); y+=12; }
  else if (fmt===21) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.7).stroke(); doc.moveTo(L,y+3).lineTo(L+W,y+3).strokeColor([0,0,0]).lineWidth(0.3).stroke(); y+=16; }
  else { doc.moveTo(L,y).lineTo(L+60,y).strokeColor([0,0,0]).lineWidth(1.5).stroke(); y+=12; }
  function sec(t) { cp();y+=8;doc.font('Times-Bold').fontSize(10).fillColor([0,0,0]).text(t.toUpperCase(),L,y,{width:W});y+=13;doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(1.2).stroke();y+=8; }
  function body(t) { cp();doc.font('Times-Roman').fontSize(9.5).fillColor([0,0,0]);const h=doc.heightOfString(t,{width:W});doc.text(t,L,y,{width:W});y+=h+6; }
  function bul(t) { cp();doc.font('Times-Roman').fontSize(9.5).fillColor([0,0,0]).text(String.fromCharCode(8250),L+4,y);const h=doc.heightOfString(t,{width:W-14});doc.text(t,L+14,y,{width:W-14});y+=h+3; }
  function exp() { if(!data.experience?.length)return;sec('Experience');for(const e of data.experience){cp();doc.font('Times-Bold').fontSize(9.8).fillColor([0,0,0]).text(`${e.role||''}${e.company?' — '+e.company:''}`,L,y,{width:W*0.7});if(e.duration)doc.font('Times-Roman').fontSize(9).fillColor([60,60,60]).text(e.duration,L,y,{width:W,align:'right'});y+=13;if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=5;} }
  function skills() { if(data.skills?.length){sec('Skills');body(data.skills.join(', '));} }
  function edu() { if(!data.education?.length)return;sec('Education');for(const e of data.education){cp();doc.font('Times-Bold').fontSize(9.5).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W*0.7});if(e.year)doc.font('Times-Roman').fontSize(9).fillColor([60,60,60]).text(e.year,L,y,{width:W,align:'right'});y+=12;if(e.institution){doc.font('Times-Roman').fontSize(9).fillColor([40,40,40]).text(e.institution,L,y);y+=10;}y+=3;} }
  function proj() { if(!data.projects?.length)return;sec('Projects');for(const p of data.projects){cp();doc.font('Times-Bold').fontSize(9.5).fillColor([0,0,0]).text(`${p.name||''}${p.tech?' ('+p.tech+')':''}`,L,y,{width:W});y+=12;if(p.description)bul(p.description);y+=3;} }
  function ach() { if(data.achievements?.length){sec('Achievements');for(const a of data.achievements)bul(a);} }
  if(data.summary){sec('Summary');body(data.summary);}
  exp();proj();skills();edu();ach();
  if(data.certifications?.length){sec('Certifications');for(const c of data.certifications)bul(c);}
}

// ═══ GROUP E: formats 23-28 — Courier Split (monospace) ═══
function groupE(doc, data, fmt, name, contact, W, L) {
  let y = 40;
  function cp() { if (y > 730) { doc.addPage(); y = 40; } }
  doc.font('Courier-Bold').fontSize(18).fillColor([0,0,0]).text(name, L, y, {width:W*0.55});
  if (contact.length) { doc.font('Courier').fontSize(7.5).fillColor([60,60,60]).text(contact.join(' | '), L, y+2, {width:W, align:'right'}); }
  y += 24;
  if (fmt===23) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.3).stroke(); y+=10; }
  else if (fmt===24) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(2).stroke(); y+=14; }
  else if (fmt===25) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.4).dash(3,{space:2}).stroke(); doc.undash(); y+=10; }
  else if (fmt===26) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.6).stroke(); doc.moveTo(L,y+2.5).lineTo(L+W,y+2.5).strokeColor([0,0,0]).lineWidth(0.2).stroke(); y+=14; }
  else if (fmt===27) { doc.moveTo(L,y).lineTo(L+60,y).strokeColor([0,0,0]).lineWidth(1).stroke(); y+=10; }
  else { y+=12; }
  function sec(t) { cp();y+=8;doc.font('Courier-Bold').fontSize(9.5).fillColor([0,0,0]).text(t.toUpperCase(),L,y,{width:W});y+=12;doc.moveTo(L,y).lineTo(L+60,y).strokeColor([0,0,0]).lineWidth(0.8).stroke();y+=7; }
  function body(t) { cp();doc.font('Courier').fontSize(9).fillColor([0,0,0]);const h=doc.heightOfString(t,{width:W});doc.text(t,L,y,{width:W});y+=h+6; }
  function bul(t) { cp();doc.font('Courier').fontSize(9).fillColor([0,0,0]).text('o',L+4,y);const h=doc.heightOfString(t,{width:W-14});doc.text(t,L+14,y,{width:W-14});y+=h+3; }
  function exp() { if(!data.experience?.length)return;sec('Experience');for(const e of data.experience){cp();doc.font('Courier-Bold').fontSize(9.2).fillColor([0,0,0]).text(`${e.role||''}${e.company?' @ '+e.company:''}`,L,y,{width:W*0.7});if(e.duration)doc.font('Courier').fontSize(8).fillColor([60,60,60]).text(e.duration,L,y,{width:W,align:'right'});y+=12;if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=5;} }
  function skills() { if(data.skills?.length){sec('Skills');body(data.skills.join(' | '));} }
  function edu() { if(!data.education?.length)return;sec('Education');for(const e of data.education){cp();doc.font('Courier-Bold').fontSize(9).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W*0.7});if(e.year)doc.font('Courier').fontSize(8).fillColor([60,60,60]).text(e.year,L,y,{width:W,align:'right'});y+=11;if(e.institution){doc.font('Courier').fontSize(8).fillColor([40,40,40]).text(e.institution,L,y);y+=10;}y+=3;} }
  function proj() { if(!data.projects?.length)return;sec('Projects');for(const p of data.projects){cp();doc.font('Courier-Bold').fontSize(9).fillColor([0,0,0]).text(`${p.name||''}${p.tech?' ['+p.tech+']':''}`,L,y,{width:W});y+=11;if(p.description)bul(p.description);y+=3;} }
  function ach() { if(data.achievements?.length){sec('Achievements');for(const a of data.achievements)bul(a);} }
  if(data.summary){sec('Summary');body(data.summary);}
  exp();proj();skills();edu();ach();
  if(data.certifications?.length){sec('Certifications');for(const c of data.certifications)bul(c);}
}

// ═══ GROUP F: formats 29-34 — Top Border First ═══
function groupF(doc, data, fmt, name, contact, W, L) {
  let y = 40;
  function cp() { if (y > 730) { doc.addPage(); y = 40; } }
  // Top border first
  if (fmt===29) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(2).stroke(); y+=12; doc.font('Helvetica-Bold').fontSize(20).fillColor([0,0,0]).text(name, L, y, {width:W, align:'center'}); y+=24; }
  else if (fmt===30) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(1).stroke(); y+=12; doc.font('Times-Bold').fontSize(22).fillColor([0,0,0]).text(name, L, y, {width:W}); y+=26; }
  else if (fmt===31) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(3).stroke(); y+=14; doc.font('Courier-Bold').fontSize(18).fillColor([0,0,0]).text(name.toUpperCase(), L, y, {width:W}); y+=22; }
  else if (fmt===32) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).stroke(); y+=10; doc.font('Helvetica-Bold').fontSize(20).fillColor([0,0,0]).text(name, L, y, {width:W, align:'center'}); y+=24; if(contact.length){doc.font('Helvetica').fontSize(8).fillColor([50,50,50]).text(contact.join('  •  '),L,y,{width:W,align:'center'});y+=12;} doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).stroke(); y+=12; }
  else if (fmt===33) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(1.5).stroke(); y+=12; doc.font('Times-Bold').fontSize(24).fillColor([0,0,0]).text(name, L, y, {width:W}); y+=28; }
  else { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(1).dash(5,{space:3}).stroke(); doc.undash(); y+=12; doc.font('Courier-Bold').fontSize(18).fillColor([0,0,0]).text(name, L, y, {width:W}); y+=22; }
  if (fmt!==32 && contact.length) { const f=fmt<=30?'Helvetica':fmt<=33?'Times-Roman':'Courier'; doc.font(f).fontSize(8.5).fillColor([50,50,50]).text(contact.join(fmt%2===0?'  •  ':'  |  '), L, y, {width:W}); y+=14; }
  const bodyFont = fmt===30||fmt===33 ? 'Times-Roman' : fmt===31||fmt===34 ? 'Courier' : 'Helvetica';
  const boldFont = fmt===30||fmt===33 ? 'Times-Bold' : fmt===31||fmt===34 ? 'Courier-Bold' : 'Helvetica-Bold';
  const bs = fmt===31||fmt===34 ? 9 : 9.5;
  function sec(t) { cp();y+=8;doc.font(boldFont).fontSize(10).fillColor([0,0,0]).text(t.charAt(0).toUpperCase()+t.slice(1),L,y,{width:W});y+=13;doc.moveTo(L,y).lineTo(L+60,y).strokeColor([0,0,0]).lineWidth(0.8).stroke();y+=7; }
  function body(t) { cp();doc.font(bodyFont).fontSize(bs).fillColor([0,0,0]);const h=doc.heightOfString(t,{width:W});doc.text(t,L,y,{width:W});y+=h+6; }
  function bul(t) { cp();doc.font(bodyFont).fontSize(bs).fillColor([0,0,0]).text('*',L+4,y);const h=doc.heightOfString(t,{width:W-14});doc.text(t,L+14,y,{width:W-14});y+=h+3; }
  function exp() { if(!data.experience?.length)return;sec('Experience');for(const e of data.experience){cp();doc.font(boldFont).fontSize(bs+0.3).fillColor([0,0,0]).text(`${e.role||''}${e.company?' | '+e.company:''}`,L,y,{width:W*0.7});if(e.duration)doc.font(bodyFont).fontSize(bs-0.5).fillColor([60,60,60]).text(e.duration,L,y,{width:W,align:'right'});y+=13;if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=5;} }
  function skills() { if(data.skills?.length){sec('Skills');body(data.skills.join('  •  '));} }
  function edu() { if(!data.education?.length)return;sec('Education');for(const e of data.education){cp();doc.font(boldFont).fontSize(bs).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W*0.7});if(e.year)doc.font(bodyFont).fontSize(bs-0.5).fillColor([60,60,60]).text(e.year,L,y,{width:W,align:'right'});y+=12;if(e.institution){doc.font(bodyFont).fontSize(bs-0.5).fillColor([40,40,40]).text(e.institution,L,y);y+=10;}y+=3;} }
  function proj() { if(!data.projects?.length)return;sec('Projects');for(const p of data.projects){cp();doc.font(boldFont).fontSize(bs).fillColor([0,0,0]).text(`${p.name||''}${p.tech?' | '+p.tech:''}`,L,y,{width:W});y+=12;if(p.description)bul(p.description);y+=3;} }
  function ach() { if(data.achievements?.length){sec('Achievements');for(const a of data.achievements)bul(a);} }
  // Section order: Experience first
  exp();
  if(data.summary){sec('Summary');body(data.summary);}
  skills();proj();edu();ach();
  if(data.certifications?.length){sec('Certifications');for(const c of data.certifications)bul(c);}
}

module.exports = { buildResumePdf };
