// server/services/pdfBuilder.js
// 34 visually distinct ATS-friendly PDF resume formats
// Each format differs in: font family, name layout, separator, section titles, bullets, section order

'use strict';
const PDFDocument = require('pdfkit');

// Format config — derived from fmt number (1-34)
function getConfig(fmt) {
  // DIMENSION 1: Font family
  let font, fontBold;
  if (fmt <= 11) { font = 'Helvetica'; fontBold = 'Helvetica-Bold'; }
  else if (fmt <= 22) { font = 'Times-Roman'; fontBold = 'Times-Bold'; }
  else { font = 'Courier'; fontBold = 'Courier-Bold'; }

  // DIMENSION 5: Bullet symbol
  const bullets = ['•', '–', '▸', '>', '*'];
  const bullet = bullets[fmt % 5];

  // DIMENSION 6: Body font size
  const bodySize = fmt <= 11 ? 9 : fmt <= 22 ? 9.5 : 9.2;

  return { font, fontBold, bullet, bodySize };
}

function buildResumePdf(data, fmt) {
  fmt = Math.max(1, Math.min(34, parseInt(fmt) || 1));
  const cfg = getConfig(fmt);

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
      const contact = [data.phone, data.email, data.location, data.linkedin, data.github].filter(Boolean);
      const name = data.name || 'Candidate';

      // ═══════════════════════════════════════════════════════════════
      // HEADER — 4 layout groups
      // ═══════════════════════════════════════════════════════════════
      if (fmt <= 8) {
        // Group A: Name centered
        doc.font(cfg.fontBold).fontSize(fmt<=4?22:20).fillColor([0,0,0]).text(name, L, y, {width:W, align:'center'});
        y += fmt<=4 ? 28 : 26;
        if (contact.length) { doc.font(cfg.font).fontSize(8.5).fillColor([50,50,50]).text(contact.join('  •  '), L, y, {width:W, align:'center'}); y+=14; }
      } else if (fmt <= 20) {
        // Group B: Name left-aligned
        doc.font(cfg.fontBold).fontSize(fmt<=14?22:20).fillColor([0,0,0]).text(name, L, y, {width:W});
        y += fmt<=14 ? 28 : 24;
        if (contact.length) { doc.font(cfg.font).fontSize(8.5).fillColor([50,50,50]).text(contact.join('  |  '), L, y, {width:W}); y+=14; }
      } else if (fmt <= 28) {
        // Group C: Name left, contact right same line
        doc.font(cfg.fontBold).fontSize(20).fillColor([0,0,0]).text(name, L, y, {width:W*0.55});
        if (contact.length) { doc.font(cfg.font).fontSize(7.5).fillColor([60,60,60]).text(contact.join(' | '), L, y+4, {width:W, align:'right'}); }
        y += 28;
      } else {
        // Group D: Top border then name
        doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(2).stroke(); y+=12;
        doc.font(cfg.fontBold).fontSize(22).fillColor([0,0,0]).text(name, L, y, {width:W});
        y += 26;
        if (contact.length) { doc.font(cfg.font).fontSize(8.5).fillColor([50,50,50]).text(contact.join('  |  '), L, y, {width:W}); y+=14; }
      }

      // SEPARATOR after header — unique per format
      if (fmt%7===1) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.3).stroke(); y+=12; }
      else if (fmt%7===2) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(1.5).stroke(); y+=14; }
      else if (fmt%7===3) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.7).stroke(); doc.moveTo(L,y+3).lineTo(L+W,y+3).strokeColor([0,0,0]).lineWidth(0.2).stroke(); y+=16; }
      else if (fmt%7===4) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.3).dash(4,{space:2}).stroke(); doc.undash(); y+=12; }
      else if (fmt%7===5) { doc.moveTo(L,y).lineTo(L+60,y).strokeColor([0,0,0]).lineWidth(2).stroke(); y+=12; }
      else if (fmt%7===6) { doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.8).stroke(); y+=14; }
      else { y+=10; }

      // ═══════════════════════════════════════════════════════════════
      // SECTION TITLE — 5 style groups
      // ═══════════════════════════════════════════════════════════════
      function secTitle(title) {
        cp(); y+=8;
        const T = title.toUpperCase();
        if (fmt<=8) { doc.font(cfg.fontBold).fontSize(10).fillColor([0,0,0]).text(T,L,y,{width:W}); y+=13; doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.4).stroke(); y+=7; }
        else if (fmt<=16) { doc.font(cfg.fontBold).fontSize(10.5).fillColor([0,0,0]).text(T,L,y,{width:W,characterSpacing:0.5}); y+=16; }
        else if (fmt<=24) { doc.font(cfg.fontBold).fontSize(10).fillColor([0,0,0]).text(T,L,y,{width:W}); y+=13; doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.3).dash(3,{space:2}).stroke(); doc.undash(); y+=7; }
        else if (fmt<=30) { doc.font(cfg.fontBold).fontSize(10).fillColor([0,0,0]).text(T,L,y,{width:W}); y+=13; doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(1.5).stroke(); y+=8; }
        else { doc.font(cfg.fontBold).fontSize(10).fillColor([0,0,0]).text(T,L,y,{width:W}); y+=13; doc.moveTo(L,y).lineTo(L+60,y).strokeColor([0,0,0]).lineWidth(1).stroke(); y+=8; }
      }

      // ═══════════════════════════════════════════════════════════════
      // CONTENT HELPERS
      // ═══════════════════════════════════════════════════════════════
      function body(text) { cp(); doc.font(cfg.font).fontSize(cfg.bodySize).fillColor([0,0,0]); const h=doc.heightOfString(text,{width:W}); doc.text(text,L,y,{width:W}); y+=h+6; }
      function bul(text) { cp(); doc.font(cfg.font).fontSize(cfg.bodySize).fillColor([0,0,0]).text(cfg.bullet,L+4,y); const h=doc.heightOfString(text,{width:W-16}); doc.text(text,L+14,y,{width:W-16}); y+=h+3; }

      // Section renderers
      function rSummary() { if(data.summary){secTitle('Professional Summary');body(data.summary);} }
      function rSkills() { if(data.skills?.length){secTitle('Technical Skills');body(data.skills.join('  •  '));} }
      function rExp() {
        if(!data.experience?.length) return;
        secTitle('Professional Experience');
        for(const e of data.experience){cp();doc.font(cfg.fontBold).fontSize(cfg.bodySize+0.3).fillColor([0,0,0]).text(`${e.role||''}${e.company?' | '+e.company:''}`,L,y,{width:W*0.7});if(e.duration)doc.font(cfg.font).fontSize(cfg.bodySize-0.5).fillColor([60,60,60]).text(e.duration,L,y,{width:W,align:'right'});y+=13;if(e.bullets?.length)for(const b of e.bullets){if(b)bul(b);}y+=5;}
      }
      function rProj() { if(!data.projects?.length)return;secTitle('Projects');for(const p of data.projects){cp();doc.font(cfg.fontBold).fontSize(cfg.bodySize).fillColor([0,0,0]).text(`${p.name||''}${p.tech?' | '+p.tech:''}`,L,y,{width:W});y+=12;if(p.description)bul(p.description);y+=3;} }
      function rEdu() { if(!data.education?.length)return;secTitle('Education');for(const e of data.education){cp();doc.font(cfg.fontBold).fontSize(cfg.bodySize).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W*0.7});if(e.year)doc.font(cfg.font).fontSize(cfg.bodySize-0.5).fillColor([60,60,60]).text(e.year,L,y,{width:W,align:'right'});y+=12;if(e.institution){doc.font(cfg.font).fontSize(cfg.bodySize-0.5).fillColor([40,40,40]).text(e.institution,L,y);y+=10;}if(e.details){doc.font(cfg.font).fontSize(cfg.bodySize-1).fillColor([60,60,60]).text(e.details,L,y);y+=10;}y+=3;} }
      function rAch() { if(data.achievements?.length){secTitle('Achievements');for(const a of data.achievements)bul(a);} }
      function rCert() { if(data.certifications?.length){secTitle('Certifications');for(const c of data.certifications)bul(c);} }

      // ═══════════════════════════════════════════════════════════════
      // SECTION ORDER — 4 groups
      // ═══════════════════════════════════════════════════════════════
      if (fmt<=10) { rSummary();rSkills();rExp();rProj();rEdu();rAch();rCert(); }
      else if (fmt<=20) { rSummary();rExp();rSkills();rProj();rEdu();rAch();rCert(); }
      else if (fmt<=30) { rSummary();rExp();rProj();rSkills();rEdu();rAch();rCert(); }
      else { rExp();rSummary();rSkills();rProj();rEdu();rAch();rCert(); }

      doc.end();
    } catch(e) { reject(e); }
  });
}

module.exports = { buildResumePdf };
