'use strict';
const PDFDocument = require('pdfkit');

function buildResumePdf(data, fmt) {
  fmt = Math.max(1, Math.min(34, parseInt(fmt) || 1));
  return new Promise((resolve, reject) => {
    try {
      // Different page margins per group for dramatically different look
      const margins = fmt<=6?{top:40,bottom:40,left:50,right:50}:fmt<=11?{top:30,bottom:30,left:60,right:60}:fmt<=17?{top:50,bottom:40,left:45,right:45}:fmt<=22?{top:35,bottom:35,left:55,right:55}:fmt<=28?{top:40,bottom:40,left:70,right:70}:{top:45,bottom:45,left:50,right:50};
      const doc = new PDFDocument({size:'A4',margins,info:{Title:data.name||'Resume'}});
      const buf=[];
      doc.on('data',c=>buf.push(c));
      doc.on('end',()=>resolve(Buffer.concat(buf)));
      doc.on('error',reject);
      const W=doc.page.width-margins.left-margins.right;
      const L=margins.left;
      const name=data.name||'Candidate';
      const contact=[data.phone,data.email,data.location,data.linkedin,data.github].filter(Boolean);

      if(fmt<=6) buildGroupA(doc,data,fmt,name,contact,W,L,margins);
      else if(fmt<=11) buildGroupB(doc,data,fmt,name,contact,W,L,margins);
      else if(fmt<=17) buildGroupC(doc,data,fmt,name,contact,W,L,margins);
      else if(fmt<=22) buildGroupD(doc,data,fmt,name,contact,W,L,margins);
      else if(fmt<=28) buildGroupE(doc,data,fmt,name,contact,W,L,margins);
      else buildGroupF(doc,data,fmt,name,contact,W,L,margins);

      doc.end();
    } catch(e){reject(e);}
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP A (fmt 1-6): CLASSIC — Centered header, Helvetica, clean lines
// Large name, centered contact, full-width separators, standard ATS layout
// ═══════════════════════════════════════════════════════════════════════════════
function buildGroupA(doc,data,fmt,name,contact,W,L,m) {
  let y=m.top;
  function cp(){if(y>730){doc.addPage();y=m.top;}}
  // HEADER
  const nameSize=[24,22,26,20,24,22][fmt-1];
  const nm=fmt===3||fmt===5?name.toUpperCase():name;
  doc.font('Helvetica-Bold').fontSize(nameSize).fillColor([0,0,0]).text(nm,L,y,{width:W,align:'center'});
  y+=nameSize+8;
  if(contact.length){doc.font('Helvetica').fontSize(9).fillColor([40,40,40]).text(contact.join('  •  '),L,y,{width:W,align:'center'});y+=14;}
  // Unique separator per fmt
  if(fmt===1){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).stroke();y+=14;}
  else if(fmt===2){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(2.5).stroke();y+=16;}
  else if(fmt===3){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(1).stroke();doc.moveTo(L,y+3.5).lineTo(L+W,y+3.5).strokeColor([0,0,0]).lineWidth(0.3).stroke();y+=18;}
  else if(fmt===4){y+=12;}
  else if(fmt===5){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).dash(6,{space:3}).stroke();doc.undash();y+=14;}
  else{doc.moveTo(L+W/2-50,y).lineTo(L+W/2+50,y).strokeColor([0,0,0]).lineWidth(1.5).stroke();y+=14;}
  // Section title style: full underline
  function sec(t){cp();y+=10;doc.font('Helvetica-Bold').fontSize(11).fillColor([0,0,0]).text(t.toUpperCase(),L,y,{width:W});y+=14;doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.4).stroke();y+=8;}
  function body(t){cp();doc.font('Helvetica').fontSize(9.5).fillColor([0,0,0]);const h=doc.heightOfString(t,{width:W});doc.text(t,L,y,{width:W});y+=h+7;}
  function bul(t){cp();doc.font('Helvetica').fontSize(9.5).fillColor([0,0,0]).text('•',L+6,y);const h=doc.heightOfString(t,{width:W-18});doc.text(t,L+18,y,{width:W-18});y+=h+4;}
  // ORDER: Summary → Skills → Experience → Projects → Education → Achievements
  if(data.summary){sec('Professional Summary');body(data.summary);}
  if(data.skills?.length){sec('Technical Skills');body(data.skills.join('  •  '));}
  if(data.experience?.length){sec('Professional Experience');for(const e of data.experience){cp();doc.font('Helvetica-Bold').fontSize(10).fillColor([0,0,0]).text(`${e.role||''}${e.company?' | '+e.company:''}`,L,y,{width:W*0.7});if(e.duration)doc.font('Helvetica').fontSize(9).fillColor([80,80,80]).text(e.duration,L,y,{width:W,align:'right'});y+=14;if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=6;}}
  if(data.projects?.length){sec('Projects');for(const p of data.projects){cp();doc.font('Helvetica-Bold').fontSize(9.5).fillColor([0,0,0]).text(`${p.name||''}${p.tech?' | '+p.tech:''}`,L,y,{width:W});y+=12;if(p.description)bul(p.description);y+=4;}}
  if(data.education?.length){sec('Education');for(const e of data.education){cp();doc.font('Helvetica-Bold').fontSize(9.5).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W*0.7});if(e.year)doc.font('Helvetica').fontSize(9).fillColor([80,80,80]).text(e.year,L,y,{width:W,align:'right'});y+=12;if(e.institution){doc.font('Helvetica').fontSize(9).fillColor([50,50,50]).text(e.institution,L,y);y+=11;}if(e.details){doc.font('Helvetica').fontSize(8.5).fillColor([80,80,80]).text(e.details,L,y);y+=11;}y+=4;}}
  if(data.achievements?.length){sec('Achievements');for(const a of data.achievements)bul(a);}
  if(data.certifications?.length){sec('Certifications');for(const c of data.certifications)bul(c);}
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP B (fmt 7-11): MODERN LEFT — Left-aligned, bold headers, no underlines
// Wider margins, bigger spacing, clean modern look
// ═══════════════════════════════════════════════════════════════════════════════
function buildGroupB(doc,data,fmt,name,contact,W,L,m) {
  let y=m.top;
  function cp(){if(y>730){doc.addPage();y=m.top;}}
  const nameSize=[24,22,26,20,22][fmt-7];
  const nm=fmt===11?name.toUpperCase():name;
  doc.font('Helvetica-Bold').fontSize(nameSize).fillColor([0,0,0]).text(nm,L,y,{width:W});
  y+=nameSize+6;
  if(contact.length){doc.font('Helvetica').fontSize(9).fillColor([60,60,60]).text(contact.join('  |  '),L,y,{width:W});y+=14;}
  if(fmt===7){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).stroke();y+=14;}
  else if(fmt===8){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(2).stroke();y+=16;}
  else if(fmt===9){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).dash(5,{space:3}).stroke();doc.undash();y+=14;}
  else if(fmt===10){doc.moveTo(L,y).lineTo(L+80,y).strokeColor([0,0,0]).lineWidth(2).stroke();y+=14;}
  else{y+=18;}
  // Section title: BOLD ONLY, no line, extra spacing
  function sec(t){cp();y+=12;doc.font('Helvetica-Bold').fontSize(11.5).fillColor([0,0,0]).text(t.toUpperCase(),L,y,{width:W,characterSpacing:0.5});y+=18;}
  function body(t){cp();doc.font('Helvetica').fontSize(9.5).fillColor([10,10,10]);const h=doc.heightOfString(t,{width:W});doc.text(t,L,y,{width:W});y+=h+8;}
  function bul(t){cp();doc.font('Helvetica').fontSize(9.5).fillColor([10,10,10]).text('–',L+6,y);const h=doc.heightOfString(t,{width:W-18});doc.text(t,L+18,y,{width:W-18});y+=h+4;}
  // ORDER: Summary → Experience → Skills → Projects → Education → Achievements
  if(data.summary){sec('Summary');body(data.summary);}
  if(data.experience?.length){sec('Experience');for(const e of data.experience){cp();doc.font('Helvetica-Bold').fontSize(10.5).fillColor([0,0,0]).text(`${e.role||''}`,L,y,{width:W});y+=13;if(e.company||e.duration){doc.font('Helvetica').fontSize(9).fillColor([80,80,80]).text(`${e.company||''}${e.duration?' — '+e.duration:''}`,L,y,{width:W});y+=12;}if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=8;}}
  if(data.skills?.length){sec('Skills');body(data.skills.join('  •  '));}
  if(data.projects?.length){sec('Projects');for(const p of data.projects){cp();doc.font('Helvetica-Bold').fontSize(10).fillColor([0,0,0]).text(p.name||'',L,y,{width:W});y+=12;if(p.tech){doc.font('Helvetica').fontSize(9).fillColor([80,80,80]).text('Tech: '+p.tech,L,y,{width:W});y+=11;}if(p.description)bul(p.description);y+=5;}}
  if(data.education?.length){sec('Education');for(const e of data.education){cp();doc.font('Helvetica-Bold').fontSize(10).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W});y+=12;doc.font('Helvetica').fontSize(9).fillColor([60,60,60]).text([e.institution,e.year,e.details].filter(Boolean).join(' — '),L,y,{width:W});y+=12;y+=4;}}
  if(data.achievements?.length){sec('Achievements');for(const a of data.achievements)bul(a);}
  if(data.certifications?.length){sec('Certifications');for(const c of data.certifications)bul(c);}
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP C (fmt 12-17): SERIF ELEGANT — Georgia/Times, centered, dashed sections
// Elegant traditional look, larger body text, wider line height
// ═══════════════════════════════════════════════════════════════════════════════
function buildGroupC(doc,data,fmt,name,contact,W,L,m) {
  let y=m.top;
  function cp(){if(y>730){doc.addPage();y=m.top;}}
  const nameSize=[26,22,28,24,22,26][fmt-12];
  const nm=fmt===14?name.toUpperCase():name;
  doc.font('Times-Bold').fontSize(nameSize).fillColor([0,0,0]).text(nm,L,y,{width:W,align:'center'});
  y+=nameSize+10;
  if(contact.length){doc.font('Times-Roman').fontSize(10).fillColor([50,50,50]).text(contact.join('  |  '),L,y,{width:W,align:'center'});y+=16;}
  if(fmt===12){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).stroke();y+=14;}
  else if(fmt===13){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(2).stroke();y+=16;}
  else if(fmt===14){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(1).stroke();doc.moveTo(L,y+4).lineTo(L+W,y+4).strokeColor([0,0,0]).lineWidth(0.3).stroke();y+=18;}
  else if(fmt===15){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).dash(4,{space:2}).stroke();doc.undash();y+=14;}
  else if(fmt===16){doc.moveTo(L+W/2-50,y).lineTo(L+W/2+50,y).strokeColor([0,0,0]).lineWidth(1).stroke();y+=14;}
  else{y+=12;}
  // Section title: dashed underline
  function sec(t){cp();y+=10;doc.font('Times-Bold').fontSize(11).fillColor([0,0,0]).text(t.toUpperCase(),L,y,{width:W});y+=14;doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.4).dash(3,{space:2}).stroke();doc.undash();y+=8;}
  function body(t){cp();doc.font('Times-Roman').fontSize(10.5).fillColor([0,0,0]);const h=doc.heightOfString(t,{width:W});doc.text(t,L,y,{width:W});y+=h+8;}
  function bul(t){cp();doc.font('Times-Roman').fontSize(10.5).fillColor([0,0,0]).text(String.fromCharCode(8227),L+6,y);const h=doc.heightOfString(t,{width:W-20});doc.text(t,L+20,y,{width:W-20});y+=h+5;}
  // ORDER: Summary → Experience → Skills → Projects → Education
  if(data.summary){sec('Professional Summary');body(data.summary);}
  if(data.experience?.length){sec('Experience');for(const e of data.experience){cp();doc.font('Times-Bold').fontSize(10.5).fillColor([0,0,0]).text(`${e.role||''}${e.company?' — '+e.company:''}`,L,y,{width:W*0.72});if(e.duration)doc.font('Times-Roman').fontSize(9.5).fillColor([80,80,80]).text(e.duration,L,y,{width:W,align:'right'});y+=14;if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=7;}}
  if(data.skills?.length){sec('Core Competencies');body(data.skills.join('  •  '));}
  if(data.projects?.length){sec('Key Projects');for(const p of data.projects){cp();doc.font('Times-Bold').fontSize(10.5).fillColor([0,0,0]).text(`${p.name||''}${p.tech?' ['+p.tech+']':''}`,L,y,{width:W});y+=13;if(p.description)bul(p.description);y+=4;}}
  if(data.education?.length){sec('Education');for(const e of data.education){cp();doc.font('Times-Bold').fontSize(10.5).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W*0.7});if(e.year)doc.font('Times-Roman').fontSize(9.5).fillColor([80,80,80]).text(e.year,L,y,{width:W,align:'right'});y+=13;if(e.institution){doc.font('Times-Roman').fontSize(9.5).fillColor([50,50,50]).text(e.institution,L,y);y+=12;}if(e.details){doc.font('Times-Roman').fontSize(9).fillColor([80,80,80]).text(e.details,L,y);y+=11;}y+=4;}}
  if(data.achievements?.length){sec('Achievements');for(const a of data.achievements)bul(a);}
  if(data.certifications?.length){sec('Certifications');for(const c of data.certifications)bul(c);}
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP D (fmt 18-22): SPLIT HEADER — Name left, contact stacked right, serif
// Professional executive style, thick section lines
// ═══════════════════════════════════════════════════════════════════════════════
function buildGroupD(doc,data,fmt,name,contact,W,L,m) {
  let y=m.top;
  function cp(){if(y>730){doc.addPage();y=m.top;}}
  // Name on left, contact stacked on right
  doc.font('Times-Bold').fontSize(22).fillColor([0,0,0]).text(name,L,y,{width:W*0.55});
  if(contact.length){doc.font('Times-Roman').fontSize(8.5).fillColor([60,60,60]).text(contact.join('\n'),L+W*0.55,y,{width:W*0.45,align:'right',lineGap:2});}
  y+=Math.max(30,contact.length*12+6);
  if(fmt===18){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).stroke();y+=14;}
  else if(fmt===19){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(1.5).stroke();y+=16;}
  else if(fmt===20){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).dash(5,{space:3}).stroke();doc.undash();y+=14;}
  else if(fmt===21){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.8).stroke();doc.moveTo(L,y+3).lineTo(L+W,y+3).strokeColor([0,0,0]).lineWidth(0.3).stroke();y+=18;}
  else{doc.moveTo(L,y).lineTo(L+70,y).strokeColor([0,0,0]).lineWidth(2).stroke();y+=14;}
  // Section title: thick underline
  function sec(t){cp();y+=10;doc.font('Times-Bold').fontSize(10.5).fillColor([0,0,0]).text(t.toUpperCase(),L,y,{width:W});y+=14;doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(1.2).stroke();y+=9;}
  function body(t){cp();doc.font('Times-Roman').fontSize(10).fillColor([0,0,0]);const h=doc.heightOfString(t,{width:W});doc.text(t,L,y,{width:W});y+=h+7;}
  function bul(t){cp();doc.font('Times-Roman').fontSize(10).fillColor([0,0,0]).text(String.fromCharCode(8250),L+6,y);const h=doc.heightOfString(t,{width:W-18});doc.text(t,L+18,y,{width:W-18});y+=h+4;}
  // ORDER: Summary → Experience → Projects → Skills → Education
  if(data.summary){sec('Profile');body(data.summary);}
  if(data.experience?.length){sec('Work Experience');for(const e of data.experience){cp();doc.font('Times-Bold').fontSize(10.5).fillColor([0,0,0]).text(e.role||'',L,y,{width:W});y+=13;if(e.company||e.duration){doc.font('Times-Roman').fontSize(9.5).fillColor([60,60,60]).text(`${e.company||''}${e.duration?'  |  '+e.duration:''}`,L,y,{width:W});y+=12;}if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=7;}}
  if(data.projects?.length){sec('Projects');for(const p of data.projects){cp();doc.font('Times-Bold').fontSize(10).fillColor([0,0,0]).text(`${p.name||''}${p.tech?' ('+p.tech+')':''}`,L,y,{width:W});y+=13;if(p.description)bul(p.description);y+=4;}}
  if(data.skills?.length){sec('Technical Skills');body(data.skills.join(', '));}
  if(data.education?.length){sec('Education');for(const e of data.education){cp();doc.font('Times-Bold').fontSize(10).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W*0.7});if(e.year)doc.font('Times-Roman').fontSize(9).fillColor([80,80,80]).text(e.year,L,y,{width:W,align:'right'});y+=12;if(e.institution){doc.font('Times-Roman').fontSize(9.5).fillColor([50,50,50]).text(e.institution,L,y);y+=11;}y+=4;}}
  if(data.achievements?.length){sec('Achievements & Awards');for(const a of data.achievements)bul(a);}
  if(data.certifications?.length){sec('Certifications');for(const c of data.certifications)bul(c);}
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP E (fmt 23-28): MONOSPACE TECHNICAL — Courier, compact, developer-style
// Narrow margins, small font, dense content, technical feel
// ═══════════════════════════════════════════════════════════════════════════════
function buildGroupE(doc,data,fmt,name,contact,W,L,m) {
  let y=m.top;
  function cp(){if(y>730){doc.addPage();y=m.top;}}
  doc.font('Courier-Bold').fontSize(18).fillColor([0,0,0]).text(fmt===28?name.toUpperCase():name,L,y,{width:W});
  y+=22;
  if(contact.length){doc.font('Courier').fontSize(8).fillColor([60,60,60]).text(contact.join(' | '),L,y,{width:W});y+=12;}
  if(fmt===23){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.3).stroke();y+=10;}
  else if(fmt===24){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(2.5).stroke();y+=14;}
  else if(fmt===25){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.4).dash(3,{space:2}).stroke();doc.undash();y+=10;}
  else if(fmt===26){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.7).stroke();doc.moveTo(L,y+3).lineTo(L+W,y+3).strokeColor([0,0,0]).lineWidth(0.2).stroke();y+=14;}
  else if(fmt===27){doc.moveTo(L,y).lineTo(L+60,y).strokeColor([0,0,0]).lineWidth(1.5).stroke();y+=10;}
  else{y+=10;}
  // Section title: short left underline only
  function sec(t){cp();y+=8;doc.font('Courier-Bold').fontSize(9.5).fillColor([0,0,0]).text(t.toUpperCase(),L,y,{width:W});y+=12;doc.moveTo(L,y).lineTo(L+55,y).strokeColor([0,0,0]).lineWidth(0.8).stroke();y+=7;}
  function body(t){cp();doc.font('Courier').fontSize(9).fillColor([0,0,0]);const h=doc.heightOfString(t,{width:W});doc.text(t,L,y,{width:W});y+=h+5;}
  function bul(t){cp();doc.font('Courier').fontSize(9).fillColor([0,0,0]).text('o',L+4,y);const h=doc.heightOfString(t,{width:W-14});doc.text(t,L+14,y,{width:W-14});y+=h+3;}
  // ORDER: Summary → Experience → Projects → Skills → Education
  if(data.summary){sec('About');body(data.summary);}
  if(data.experience?.length){sec('Experience');for(const e of data.experience){cp();doc.font('Courier-Bold').fontSize(9.2).fillColor([0,0,0]).text(`${e.role||''}${e.company?' @ '+e.company:''}`,L,y,{width:W*0.7});if(e.duration)doc.font('Courier').fontSize(8).fillColor([80,80,80]).text(e.duration,L,y,{width:W,align:'right'});y+=12;if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=5;}}
  if(data.projects?.length){sec('Projects');for(const p of data.projects){cp();doc.font('Courier-Bold').fontSize(9).fillColor([0,0,0]).text(`${p.name||''}${p.tech?' ['+p.tech+']':''}`,L,y,{width:W});y+=11;if(p.description)bul(p.description);y+=3;}}
  if(data.skills?.length){sec('Tech Stack');body(data.skills.join(' | '));}
  if(data.education?.length){sec('Education');for(const e of data.education){cp();doc.font('Courier-Bold').fontSize(9).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W*0.7});if(e.year)doc.font('Courier').fontSize(8).fillColor([80,80,80]).text(e.year,L,y,{width:W,align:'right'});y+=11;if(e.institution){doc.font('Courier').fontSize(8).fillColor([50,50,50]).text(e.institution,L,y);y+=10;}y+=3;}}
  if(data.achievements?.length){sec('Achievements');for(const a of data.achievements)bul(a);}
  if(data.certifications?.length){sec('Certifications');for(const c of data.certifications)bul(c);}
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP F (fmt 29-34): TOP BORDER EXECUTIVE — Border first, then content
// Experience-first layout, mixed fonts per format, executive feel
// ═══════════════════════════════════════════════════════════════════════════════
function buildGroupF(doc,data,fmt,name,contact,W,L,m) {
  let y=m.top;
  function cp(){if(y>730){doc.addPage();y=m.top;}}
  // Top border
  const bw=[2,1,3,0.5,1.5,1][fmt-29];
  const bs=fmt===34?'dash':'solid';
  if(bs==='dash'){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(bw).dash(5,{space:3}).stroke();doc.undash();}
  else{doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(bw).stroke();}
  y+=bw+10;
  // Name — different font per format
  const nf=[['Helvetica-Bold',20,'center'],['Times-Bold',22,'left'],['Courier-Bold',18,'left'],['Helvetica-Bold',20,'center'],['Times-Bold',24,'left'],['Courier-Bold',18,'left']][fmt-29];
  doc.font(nf[0]).fontSize(nf[1]).fillColor([0,0,0]).text(fmt===31?name.toUpperCase():name,L,y,{width:W,align:nf[2]});
  y+=nf[1]+8;
  if(contact.length){const cf=nf[0].replace('-Bold','').replace('Bold','');doc.font(cf||'Helvetica').fontSize(9).fillColor([50,50,50]).text(contact.join(fmt%2===0?'  •  ':'  |  '),L,y,{width:W,align:nf[2]});y+=14;}
  if(fmt===32){doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).stroke();y+=12;}else{y+=8;}
  // Body font matches header
  const bodyF=nf[0].replace('-Bold','').replace('Bold','')||'Helvetica';
  const boldF=nf[0];
  const bs2=fmt===31||fmt===34?9:9.5;
  function sec(t){cp();y+=10;doc.font(boldF).fontSize(10).fillColor([0,0,0]).text(t.charAt(0).toUpperCase()+t.slice(1),L,y,{width:W});y+=13;doc.moveTo(L,y).lineTo(L+60,y).strokeColor([0,0,0]).lineWidth(1).stroke();y+=8;}
  function body(t){cp();doc.font(bodyF).fontSize(bs2).fillColor([0,0,0]);const h=doc.heightOfString(t,{width:W});doc.text(t,L,y,{width:W});y+=h+6;}
  function bul(t){cp();doc.font(bodyF).fontSize(bs2).fillColor([0,0,0]).text('*',L+4,y);const h=doc.heightOfString(t,{width:W-14});doc.text(t,L+14,y,{width:W-14});y+=h+3;}
  // ORDER: Experience → Summary → Skills → Projects → Education
  if(data.experience?.length){sec('Experience');for(const e of data.experience){cp();doc.font(boldF).fontSize(bs2+0.5).fillColor([0,0,0]).text(`${e.role||''}${e.company?' | '+e.company:''}`,L,y,{width:W*0.7});if(e.duration)doc.font(bodyF).fontSize(bs2-0.5).fillColor([80,80,80]).text(e.duration,L,y,{width:W,align:'right'});y+=13;if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=6;}}
  if(data.summary){sec('Summary');body(data.summary);}
  if(data.skills?.length){sec('Skills');body(data.skills.join('  •  '));}
  if(data.projects?.length){sec('Projects');for(const p of data.projects){cp();doc.font(boldF).fontSize(bs2).fillColor([0,0,0]).text(`${p.name||''}${p.tech?' | '+p.tech:''}`,L,y,{width:W});y+=12;if(p.description)bul(p.description);y+=3;}}
  if(data.education?.length){sec('Education');for(const e of data.education){cp();doc.font(boldF).fontSize(bs2).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W*0.7});if(e.year)doc.font(bodyF).fontSize(bs2-0.5).fillColor([80,80,80]).text(e.year,L,y,{width:W,align:'right'});y+=12;if(e.institution){doc.font(bodyF).fontSize(bs2-0.5).fillColor([50,50,50]).text(e.institution,L,y);y+=10;}y+=3;}}
  if(data.achievements?.length){sec('Achievements');for(const a of data.achievements)bul(a);}
  if(data.certifications?.length){sec('Certifications');for(const c of data.certifications)bul(c);}
}

module.exports = { buildResumePdf };
