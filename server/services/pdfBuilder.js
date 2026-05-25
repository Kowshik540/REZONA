// server/services/pdfBuilder.js
// Clean PDF resume builder — 8 distinct black-and-white ATS-friendly formats
// Each format has unique: header, separator, font, section titles, bullet style, section order

'use strict';
const PDFDocument = require('pdfkit');

/**
 * Build a professional ATS-friendly PDF resume
 * @param {object} data - structured resume data (name, email, skills, experience, etc.)
 * @param {number} fmt - format number 1-8 (determines layout style)
 * @returns {Promise<Buffer>} PDF buffer
 */
function buildResumePdf(data, fmt) {
  fmt = Math.max(1, Math.min(8, parseInt(fmt) || 1));

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 40, left: 50, right: 50 }, info: { Title: data.name || 'Resume' } });
      const buffers = [];
      doc.on('data', c => buffers.push(c));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const W = doc.page.width - 100;
      const L = 50;
      const contact = [data.phone, data.email, data.location, data.linkedin, data.github].filter(Boolean);

      // Font selection per format
      const F = fmt === 2 || fmt === 8 ? 'Times-Roman' : 'Helvetica';
      const FB = fmt === 2 || fmt === 8 ? 'Times-Bold' : 'Helvetica-Bold';

      let y = 40;
      function cp() { if (y > 730) { doc.addPage(); y = 40; } }

      // ════════════════════════════════════════════════════════════════════
      // HEADER — 8 unique styles
      // ════════════════════════════════════════════════════════════════════
      const name = data.name || 'Candidate';

      if (fmt === 1) { // Centered, thin line
        doc.font(FB).fontSize(22).fillColor([0,0,0]).text(name, L, y, {width:W, align:'center'}); y+=28;
        if(contact.length) { doc.font(F).fontSize(8.5).fillColor([50,50,50]).text(contact.join('  •  '), L, y, {width:W, align:'center'}); y+=14; }
        doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).stroke(); y+=16;
      }
      else if (fmt === 2) { // Left serif, thick line
        doc.font(FB).fontSize(24).fillColor([0,0,0]).text(name, L, y); y+=30;
        if(contact.length) { doc.font(F).fontSize(9).fillColor([40,40,40]).text(contact.join('  |  '), L, y); y+=14; }
        doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(1.5).stroke(); y+=18;
      }
      else if (fmt === 3) { // Centered UPPERCASE, double line
        doc.font(FB).fontSize(20).fillColor([0,0,0]).text(name.toUpperCase(), L, y, {width:W, align:'center', characterSpacing:1}); y+=26;
        if(contact.length) { doc.font(F).fontSize(8).fillColor([50,50,50]).text(contact.join('   |   '), L, y, {width:W, align:'center'}); y+=13; }
        doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.8).stroke();
        doc.moveTo(L,y+3).lineTo(L+W,y+3).strokeColor([0,0,0]).lineWidth(0.3).stroke(); y+=18;
      }
      else if (fmt === 4) { // Name left, contact right same line
        doc.font(FB).fontSize(20).fillColor([0,0,0]).text(name, L, y, {width:W*0.5});
        if(contact.length) { doc.font(F).fontSize(7.5).fillColor([60,60,60]).text(contact.join(' | '), L, y+4, {width:W, align:'right'}); }
        y+=28; doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.6).stroke(); y+=16;
      }
      else if (fmt === 5) { // Large uppercase, thick line below
        doc.font(FB).fontSize(26).fillColor([0,0,0]).text(name.toUpperCase(), L, y, {width:W, align:'center'}); y+=34;
        doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(1.2).stroke(); y+=8;
        if(contact.length) { doc.font(F).fontSize(8).fillColor([50,50,50]).text(contact.join('  •  '), L, y, {width:W, align:'center'}); y+=18; }
      }
      else if (fmt === 6) { // Top border first, then name
        doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(2.5).stroke(); y+=14;
        doc.font(FB).fontSize(20).fillColor([0,0,0]).text(name, L, y); y+=24;
        if(contact.length) { doc.font(F).fontSize(8.5).fillColor([50,50,50]).text(contact.join('  |  '), L, y); y+=14; }
        doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.3).stroke(); y+=14;
      }
      else if (fmt === 7) { // Left name, dashed separator
        doc.font(FB).fontSize(20).fillColor([0,0,0]).text(name, L, y); y+=24;
        if(contact.length) { doc.font(F).fontSize(8.5).fillColor([50,50,50]).text(contact.join('  •  '), L, y); y+=13; }
        doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.4).dash(4,{space:2}).stroke(); doc.undash(); y+=16;
      }
      else { // fmt 8: Serif, short bold underline
        doc.font(FB).fontSize(22).fillColor([0,0,0]).text(name, L, y); y+=26;
        doc.moveTo(L,y).lineTo(L+70,y).strokeColor([0,0,0]).lineWidth(2.5).stroke(); y+=8;
        if(contact.length) { doc.font(F).fontSize(8.5).fillColor([50,50,50]).text(contact.join('  |  '), L, y); y+=16; }
      }

      // ════════════════════════════════════════════════════════════════════
      // SECTION TITLE — varies per format
      // ════════════════════════════════════════════════════════════════════
      function secTitle(title) {
        cp(); y += 8;
        const T = title.toUpperCase();
        if (fmt===1) { doc.font(FB).fontSize(10).fillColor([0,0,0]).text(T,L,y,{width:W}); y+=13; doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.3).stroke(); y+=8; }
        else if (fmt===2) { doc.font(FB).fontSize(11).fillColor([0,0,0]).text(T,L,y,{width:W}); y+=14; doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.7).stroke(); y+=9; }
        else if (fmt===3) { doc.font(FB).fontSize(10).fillColor([0,0,0]).text(T,L,y,{width:W,characterSpacing:0.8}); y+=16; }
        else if (fmt===4) { doc.font(FB).fontSize(10).fillColor([0,0,0]).text(T,L,y,{width:W}); y+=13; doc.moveTo(L,y).lineTo(L+50,y).strokeColor([0,0,0]).lineWidth(1).stroke(); y+=8; }
        else if (fmt===5) { doc.font(FB).fontSize(10.5).fillColor([0,0,0]).text(T,L,y,{width:W}); y+=14; doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(1).stroke(); y+=9; }
        else if (fmt===6) { doc.font(FB).fontSize(10).fillColor([0,0,0]).text(T,L,y,{width:W}); y+=13; doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).stroke(); doc.moveTo(L,y+2.5).lineTo(L+W,y+2.5).strokeColor([0,0,0]).lineWidth(0.2).stroke(); y+=10; }
        else if (fmt===7) { doc.font(FB).fontSize(10).fillColor([0,0,0]).text(T,L,y,{width:W}); y+=13; doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.3).dash(3,{space:2}).stroke(); doc.undash(); y+=8; }
        else { doc.font(FB).fontSize(10.5).fillColor([0,0,0]).text(T,L,y,{width:W}); y+=14; doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).stroke(); y+=8; }
      }

      // ════════════════════════════════════════════════════════════════════
      // CONTENT HELPERS
      // ════════════════════════════════════════════════════════════════════
      const BS = fmt>=5 ? 9.0 : 9.3; // body font size
      function body(text) { cp(); doc.font(F).fontSize(BS).fillColor([0,0,0]); const h=doc.heightOfString(text,{width:W}); doc.text(text,L,y,{width:W}); y+=h+6; }
      function bullet(text) { cp(); const sym=fmt<=3?'•':fmt<=6?'–':'▸'; doc.font(F).fontSize(BS).fillColor([0,0,0]).text(sym,L+4,y); const h=doc.heightOfString(text,{width:W-16}); doc.text(text,L+14,y,{width:W-16}); y+=h+3; }

      // ════════════════════════════════════════════════════════════════════
      // SECTION RENDERERS
      // ════════════════════════════════════════════════════════════════════
      function renderSummary() { if(data.summary){secTitle('Professional Summary');body(data.summary);} }
      function renderSkills() { if(data.skills?.length){secTitle('Technical Skills');body(data.skills.join('  •  '));} }
      function renderExp() {
        if(!data.experience?.length) return;
        secTitle('Professional Experience');
        for(const exp of data.experience) {
          cp();
          doc.font(FB).fontSize(BS+0.3).fillColor([0,0,0]).text(`${exp.role||''}${exp.company?' | '+exp.company:''}`, L, y, {width:W*0.7});
          if(exp.duration) doc.font(F).fontSize(BS-0.5).fillColor([60,60,60]).text(exp.duration, L, y, {width:W, align:'right'});
          y+=14;
          if(exp.bullets?.length) for(const b of exp.bullets) { if(b) bullet(b); }
          y+=5;
        }
      }
      function renderProjects() {
        if(!data.projects?.length) return;
        secTitle('Projects');
        for(const p of data.projects) { cp(); doc.font(FB).fontSize(BS).fillColor([0,0,0]).text(`${p.name||''}${p.tech?' | '+p.tech:''}`,L,y,{width:W}); y+=12; if(p.description) bullet(p.description); y+=3; }
      }
      function renderEdu() {
        if(!data.education?.length) return;
        secTitle('Education');
        for(const e of data.education) { cp(); doc.font(FB).fontSize(BS).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W*0.7}); if(e.year) doc.font(F).fontSize(BS-0.5).fillColor([60,60,60]).text(e.year,L,y,{width:W,align:'right'}); y+=12; if(e.institution){doc.font(F).fontSize(BS-0.5).fillColor([40,40,40]).text(e.institution,L,y);y+=10;} if(e.details){doc.font(F).fontSize(BS-1).fillColor([60,60,60]).text(e.details,L,y);y+=10;} y+=3; }
      }
      function renderAch() { if(data.achievements?.length){secTitle('Achievements');for(const a of data.achievements) bullet(a);} }
      function renderCert() { if(data.certifications?.length){secTitle('Certifications');for(const c of data.certifications) bullet(c);} }

      // ════════════════════════════════════════════════════════════════════
      // SECTION ORDER — different per format (this is what makes each truly unique)
      // ════════════════════════════════════════════════════════════════════
      if (fmt===1) { renderSummary();renderSkills();renderExp();renderProjects();renderEdu();renderAch();renderCert(); }
      else if (fmt===2) { renderSummary();renderExp();renderSkills();renderProjects();renderEdu();renderCert();renderAch(); }
      else if (fmt===3) { renderSummary();renderEdu();renderSkills();renderExp();renderProjects();renderAch();renderCert(); }
      else if (fmt===4) { renderExp();renderSkills();renderProjects();renderSummary();renderEdu();renderCert();renderAch(); }
      else if (fmt===5) { renderSummary();renderExp();renderProjects();renderSkills();renderEdu();renderAch();renderCert(); }
      else if (fmt===6) { renderSkills();renderSummary();renderExp();renderProjects();renderEdu();renderCert();renderAch(); }
      else if (fmt===7) { renderSummary();renderEdu();renderExp();renderSkills();renderProjects();renderCert();renderAch(); }
      else { renderSummary();renderExp();renderEdu();renderProjects();renderSkills();renderAch();renderCert(); }

      doc.end();
    } catch(err) { reject(err); }
  });
}

module.exports = { buildResumePdf };
