'use strict';
const PDFDocument = require('pdfkit');

// 9 distinct resume styles mapped across 34 template slots
function buildResumePdf(data, fmt) {
  fmt = Math.max(1, Math.min(34, parseInt(fmt) || 1));
  // Map fmt to style: 1-4=style1, 5-8=style2, 9-12=style3, 13-16=style4, 17-20=style5, 21-24=style6, 25-28=style7, 29-31=style8, 32-34=style9
  const style = fmt<=4?1:fmt<=8?2:fmt<=12?3:fmt<=16?4:fmt<=20?5:fmt<=24?6:fmt<=28?7:fmt<=31?8:9;
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({size:'A4',margins:{top:40,bottom:40,left:50,right:50},info:{Title:data.name||'Resume'}});
      const buf=[];
      doc.on('data',c=>buf.push(c));
      doc.on('end',()=>resolve(Buffer.concat(buf)));
      doc.on('error',reject);
      const W=doc.page.width-100,L=50;
      const d={...data,name:data.name||'Candidate',contact:[data.phone,data.email,data.location,data.linkedin,data.github].filter(Boolean)};
      switch(style){
        case 1: renderStyle1(doc,d,W,L);break;
        case 2: renderStyle2(doc,d,W,L);break;
        case 3: renderStyle3(doc,d,W,L);break;
        case 4: renderStyle4(doc,d,W,L);break;
        case 5: renderStyle5(doc,d,W,L);break;
        case 6: renderStyle6(doc,d,W,L);break;
        case 7: renderStyle7(doc,d,W,L);break;
        case 8: renderStyle8(doc,d,W,L);break;
        case 9: renderStyle9(doc,d,W,L);break;
      }
      doc.end();
    }catch(e){reject(e);}
  });
}

// STYLE 1: Serif Centered — Times font, centered name+title, dates left, elegant
function renderStyle1(doc,d,W,L){
  let y=40;const cp=()=>{if(y>730){doc.addPage();y=40;}};
  doc.font('Times-Bold').fontSize(24).fillColor([0,0,0]).text(d.name,L,y,{width:W,align:'center'});y+=30;
  if(d.contact.length){doc.font('Times-Roman').fontSize(9).fillColor([80,80,80]).text(d.contact.join('  |  '),L,y,{width:W,align:'center'});y+=14;}
  doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).stroke();y+=16;
  const sec=(t)=>{cp();y+=10;doc.font('Times-Bold').fontSize(11).fillColor([0,0,0]).text(t.toUpperCase(),L,y,{width:W});y+=3;doc.moveTo(L,y+10).lineTo(L+W,y+10).strokeColor([180,180,180]).lineWidth(0.3).stroke();y+=18;};
  const bul=(t)=>{cp();doc.font('Times-Roman').fontSize(10).fillColor([0,0,0]).text('•',L+20,y);const h=doc.heightOfString(t,{width:W-34});doc.text(t,L+30,y,{width:W-34});y+=h+4;};
  if(d.summary){sec('Objective');doc.font('Times-Roman').fontSize(10).fillColor([30,30,30]);const h=doc.heightOfString(d.summary,{width:W-20});doc.text(d.summary,L+10,y,{width:W-20});y+=h+8;}
  if(d.education?.length){sec('Education');for(const e of d.education){cp();if(e.year){doc.font('Times-Roman').fontSize(9).fillColor([100,100,100]).text(e.year,L,y,{width:70});}doc.font('Times-Bold').fontSize(10.5).fillColor([0,0,0]).text(e.degree||'',L+75,y,{width:W-75});y+=13;if(e.institution){doc.font('Times-Roman').fontSize(9.5).fillColor([60,60,60]).text(e.institution,L+75,y,{width:W-75});y+=11;}if(e.details){doc.font('Times-Roman').fontSize(9).fillColor([80,80,80]).text(e.details,L+75,y);y+=11;}y+=6;}}
  if(d.experience?.length){sec('Experience');for(const e of d.experience){cp();if(e.duration){doc.font('Times-Roman').fontSize(9).fillColor([100,100,100]).text(e.duration,L,y,{width:80});}doc.font('Times-Bold').fontSize(10.5).fillColor([0,0,0]).text(`${e.role||''}${e.company?', '+e.company:''}`,L+85,y,{width:W-85});y+=14;if(e.bullets)for(const b of e.bullets){if(b){cp();doc.font('Times-Roman').fontSize(9.5).fillColor([30,30,30]);const h=doc.heightOfString(b,{width:W-100});doc.text(b,L+95,y,{width:W-100});y+=h+3;}}y+=6;}}
  if(d.skills?.length){sec('Skills');doc.font('Times-Roman').fontSize(10).fillColor([0,0,0]);const h=doc.heightOfString(d.skills.join(', '),{width:W});doc.text(d.skills.join(', '),L+10,y,{width:W-10});y+=h+8;}
  if(d.achievements?.length){sec('Achievements');for(const a of d.achievements)bul(a);}
}

// STYLE 2: Clean Professional — Centered name, dotted section lines, Helvetica
function renderStyle2(doc,d,W,L){
  let y=40;const cp=()=>{if(y>730){doc.addPage();y=40;}};
  doc.font('Helvetica-Bold').fontSize(22).fillColor([0,0,0]).text(d.name,L,y,{width:W,align:'center'});y+=26;
  if(d.contact.length){doc.font('Helvetica').fontSize(9).fillColor([60,60,60]).text(d.contact.join('  •  '),L,y,{width:W,align:'center'});y+=14;}
  doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.3).dash(2,{space:1}).stroke();doc.undash();y+=16;
  const sec=(t)=>{cp();y+=10;doc.font('Helvetica-Bold').fontSize(11).fillColor([0,0,0]).text(t.toUpperCase(),L,y,{width:W});y+=14;doc.moveTo(L,y).lineTo(L+W,y).strokeColor([150,150,150]).lineWidth(0.3).dash(2,{space:1}).stroke();doc.undash();y+=8;};
  const bul=(t)=>{cp();doc.font('Helvetica').fontSize(9.5).fillColor([0,0,0]).text('•',L+8,y);const h=doc.heightOfString(t,{width:W-20});doc.text(t,L+18,y,{width:W-20});y+=h+4;};
  if(d.summary){sec('Professional Summary');doc.font('Helvetica').fontSize(9.5).fillColor([20,20,20]);const h=doc.heightOfString(d.summary,{width:W});doc.text(d.summary,L,y,{width:W});y+=h+8;}
  if(d.experience?.length){sec('Professional Experience');for(const e of d.experience){cp();doc.font('Helvetica-Bold').fontSize(10).fillColor([0,0,0]).text(e.role||'',L,y,{width:W});y+=12;doc.font('Helvetica').fontSize(9).fillColor([80,80,80]).text(`${e.company||''}${e.duration?'  |  '+e.duration:''}`,L,y,{width:W});y+=12;if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=6;}}
  if(d.skills?.length){sec('Core Skills');doc.font('Helvetica').fontSize(9.5).fillColor([0,0,0]);const h=doc.heightOfString(d.skills.join('  •  '),{width:W});doc.text(d.skills.join('  •  '),L,y,{width:W});y+=h+8;}
  if(d.projects?.length){sec('Projects');for(const p of d.projects){cp();doc.font('Helvetica-Bold').fontSize(9.5).fillColor([0,0,0]).text(`${p.name||''}${p.tech?' | '+p.tech:''}`,L,y,{width:W});y+=12;if(p.description)bul(p.description);y+=4;}}
  if(d.education?.length){sec('Education');for(const e of d.education){cp();doc.font('Helvetica-Bold').fontSize(9.5).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W*0.7});if(e.year)doc.font('Helvetica').fontSize(9).fillColor([80,80,80]).text(e.year,L,y,{width:W,align:'right'});y+=12;if(e.institution){doc.font('Helvetica').fontSize(9).fillColor([60,60,60]).text(e.institution,L,y);y+=11;}y+=4;}}
  if(d.achievements?.length){sec('Achievements');for(const a of d.achievements)bul(a);}
  if(d.certifications?.length){sec('Certifications');for(const c of d.certifications)bul(c);}
}

// STYLE 3: Resume Worded — Left bold name, EXPERIENCE FIRST, dates right bold, sub-bullets
function renderStyle3(doc,d,W,L){
  let y=40;const cp=()=>{if(y>730){doc.addPage();y=40;}};
  doc.font('Helvetica-Bold').fontSize(20).fillColor([0,0,0]).text(d.name,L,y,{width:W});y+=24;
  if(d.contact.length){doc.font('Helvetica').fontSize(8.5).fillColor([60,60,60]).text(d.contact.join('  |  '),L,y,{width:W});y+=12;}
  doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.5).stroke();y+=4;
  const sec=(t)=>{cp();y+=8;doc.font('Helvetica-Bold').fontSize(10).fillColor([0,0,0]).text(t.toUpperCase(),L,y,{width:W});y+=2;doc.moveTo(L,y+10).lineTo(L+W,y+10).strokeColor([0,0,0]).lineWidth(0.5).stroke();y+=16;};
  const bul=(t,indent)=>{cp();const il=indent||0;doc.font('Helvetica').fontSize(9.2).fillColor([0,0,0]).text('•',L+8+il,y);const h=doc.heightOfString(t,{width:W-20-il});doc.text(t,L+18+il,y,{width:W-20-il});y+=h+3;};
  // EXPERIENCE FIRST (like Resume Worded)
  if(d.experience?.length){sec('Experience');for(const e of d.experience){cp();doc.font('Helvetica-Bold').fontSize(10).fillColor([0,0,0]).text(e.company||'',L,y,{width:W*0.6});if(e.duration){doc.font('Helvetica-Bold').fontSize(9).fillColor([0,0,0]).text(e.duration,L,y,{width:W,align:'right'});}y+=13;doc.font('Helvetica').fontSize(9).fillColor([60,60,60]).text(e.role||'',L,y,{width:W*0.6});y+=12;if(e.bullets)for(const b of e.bullets){if(b)bul(b,0);}y+=8;}}
  if(d.education?.length){sec('Education');for(const e of d.education){cp();doc.font('Helvetica-Bold').fontSize(10).fillColor([0,0,0]).text(e.institution||'',L,y,{width:W*0.6});if(e.year)doc.font('Helvetica-Bold').fontSize(9).fillColor([0,0,0]).text(e.year,L,y,{width:W,align:'right'});y+=13;doc.font('Helvetica').fontSize(9).fillColor([60,60,60]).text(`${e.degree||''}${e.details?' | '+e.details:''}`,L,y,{width:W});y+=12;y+=4;}}
  if(d.skills?.length||d.certifications?.length){sec('Other');if(d.skills?.length){doc.font('Helvetica-Bold').fontSize(9).fillColor([0,0,0]).text('Technical Skills: ',L,y,{width:80,continued:true});doc.font('Helvetica').text(d.skills.join(', '),{width:W-80});y+=doc.heightOfString(d.skills.join(', '),{width:W-80})+6;}if(d.certifications?.length){doc.font('Helvetica-Bold').fontSize(9).fillColor([0,0,0]).text('Certifications: ',L,y,{width:80,continued:true});doc.font('Helvetica').text(d.certifications.join(', '),{width:W-80});y+=14;}}
  if(d.projects?.length){sec('Projects');for(const p of d.projects){cp();doc.font('Helvetica-Bold').fontSize(9.5).fillColor([0,0,0]).text(p.name||'',L,y,{width:W});y+=12;if(p.description)bul(p.description,0);y+=4;}}
  if(d.achievements?.length){for(const a of d.achievements)bul(a,0);}
}

// STYLE 4: Green Background — Colored page, large uppercase name, bold headers
function renderStyle4(doc,d,W,L){
  // Light green background
  doc.rect(0,0,doc.page.width,doc.page.height).fill([235,245,235]);
  let y=50;const cp=()=>{if(y>730){doc.addPage();doc.rect(0,0,doc.page.width,doc.page.height).fill([235,245,235]);y=40;}};
  doc.font('Helvetica-Bold').fontSize(26).fillColor([20,80,60]).text(d.name.toUpperCase(),L,y,{width:W});y+=32;
  if(d.contact.length){doc.font('Helvetica').fontSize(9).fillColor([60,100,80]).text(d.contact.join('  |  '),L,y,{width:W});y+=14;}
  doc.font('Helvetica').fontSize(9.5).fillColor([30,30,30]);if(d.summary){const h=doc.heightOfString(d.summary,{width:W});doc.text(d.summary,L,y,{width:W});y+=h+12;}
  const sec=(t)=>{cp();y+=12;doc.font('Helvetica-Bold').fontSize(12).fillColor([20,80,60]).text(t.toUpperCase(),L,y,{width:W});y+=16;};
  const bul=(t)=>{cp();doc.font('Helvetica').fontSize(9.5).fillColor([30,30,30]).text('•',L+8,y);const h=doc.heightOfString(t,{width:W-20});doc.text(t,L+18,y,{width:W-20});y+=h+4;};
  if(d.education?.length){sec('Education');for(const e of d.education){cp();doc.font('Helvetica-Bold').fontSize(10).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W});y+=12;doc.font('Helvetica').fontSize(9).fillColor([60,60,60]).text([e.institution,e.year].filter(Boolean).join(' | '),L,y,{width:W});y+=11;if(e.details)bul(e.details);y+=6;}}
  if(d.experience?.length){sec('Experience');for(const e of d.experience){cp();doc.font('Helvetica-Bold').fontSize(10).fillColor([0,0,0]).text(`${e.role||''}${e.company?' | '+e.company:''}`,L,y,{width:W});y+=12;if(e.duration){doc.font('Helvetica').fontSize(8.5).fillColor([80,80,80]).text(e.duration,L,y);y+=11;}if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=6;}}
  if(d.skills?.length){sec('Skills');for(const s of d.skills){bul(s);}}
  if(d.projects?.length){sec('Projects');for(const p of d.projects){cp();doc.font('Helvetica-Bold').fontSize(9.5).fillColor([0,0,0]).text(p.name||'',L,y,{width:W});y+=12;if(p.description)bul(p.description);y+=4;}}
}

// STYLE 5: Career Reload Red — Uppercase spaced name, colored section titles, dates right in color
function renderStyle5(doc,d,W,L){
  let y=45;const cp=()=>{if(y>730){doc.addPage();y=40;}};
  doc.font('Helvetica-Bold').fontSize(20).fillColor([180,50,50]).text(d.name.toUpperCase(),L,y,{width:W,characterSpacing:2});y+=28;
  if(d.contact.length){doc.font('Helvetica').fontSize(8.5).fillColor([100,100,100]).text(d.contact.join('  •  '),L,y,{width:W});y+=14;}
  const sec=(t)=>{cp();y+=10;doc.font('Helvetica-Bold').fontSize(10).fillColor([180,50,50]).text(t.toUpperCase(),L,y,{width:W});y+=3;doc.moveTo(L,y+9).lineTo(L+W,y+9).strokeColor([200,200,200]).lineWidth(0.3).stroke();y+=16;};
  const bul=(t)=>{cp();doc.font('Helvetica').fontSize(9.2).fillColor([30,30,30]).text('•',L+10,y);const h=doc.heightOfString(t,{width:W-22});doc.text(t,L+20,y,{width:W-22});y+=h+3;};
  if(d.summary){sec('Career Summary');doc.font('Helvetica').fontSize(9.5).fillColor([30,30,30]);const h=doc.heightOfString(d.summary,{width:W});doc.text(d.summary,L,y,{width:W});y+=h+8;}
  if(d.experience?.length){sec('Work Experience');for(const e of d.experience){cp();doc.font('Helvetica-Bold').fontSize(9.5).fillColor([0,0,0]).text(e.role||'',L,y,{width:W*0.65});if(e.duration)doc.font('Helvetica').fontSize(8.5).fillColor([180,50,50]).text(e.duration,L,y,{width:W,align:'right'});y+=12;if(e.company){doc.font('Helvetica').fontSize(9).fillColor([80,80,80]).text(e.company,L,y);y+=11;}if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=8;}}
  if(d.education?.length){sec('Education & Certifications');for(const e of d.education){cp();doc.font('Helvetica-Bold').fontSize(9.5).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W*0.7});if(e.year)doc.font('Helvetica').fontSize(8.5).fillColor([180,50,50]).text(e.year,L,y,{width:W,align:'right'});y+=12;if(e.institution){doc.font('Helvetica').fontSize(9).fillColor([60,60,60]).text(e.institution,L,y);y+=11;}y+=4;}}
  if(d.skills?.length){sec('Skills');doc.font('Helvetica').fontSize(9.2).fillColor([30,30,30]);const h=doc.heightOfString(d.skills.join('  •  '),{width:W});doc.text(d.skills.join('  •  '),L,y,{width:W});y+=h+8;}
  if(d.projects?.length){sec('Projects');for(const p of d.projects){cp();doc.font('Helvetica-Bold').fontSize(9.2).fillColor([0,0,0]).text(p.name||'',L,y,{width:W});y+=11;if(p.description)bul(p.description);y+=4;}}
  if(d.achievements?.length){sec('Achievements');for(const a of d.achievements)bul(a);}
}

// STYLE 6: Blue Accent — Blue name and section titles, clean bullets
function renderStyle6(doc,d,W,L){
  let y=40;const cp=()=>{if(y>730){doc.addPage();y=40;}};
  doc.font('Helvetica-Bold').fontSize(22).fillColor([40,100,180]).text(d.name,L,y,{width:W});y+=26;
  if(d.contact.length){doc.font('Helvetica').fontSize(8.5).fillColor([40,100,180]).text(d.contact.join('  •  '),L,y,{width:W});y+=14;}
  y+=4;
  const sec=(t)=>{cp();y+=10;doc.font('Helvetica-Bold').fontSize(11).fillColor([40,100,180]).text(t.toUpperCase(),L,y,{width:W});y+=14;};
  const bul=(t)=>{cp();doc.font('Helvetica').fontSize(9.5).fillColor([0,0,0]).text('•',L+8,y);const h=doc.heightOfString(t,{width:W-20});doc.text(t,L+18,y,{width:W-20});y+=h+4;};
  if(d.summary){sec('Professional Summary');doc.font('Helvetica').fontSize(9.5).fillColor([20,20,20]);const h=doc.heightOfString(d.summary,{width:W});doc.text(d.summary,L,y,{width:W});y+=h+8;}
  if(d.education?.length){sec('Education');for(const e of d.education){cp();doc.font('Helvetica-Bold').fontSize(10).fillColor([40,100,180]).text(e.degree||'',L,y,{width:W});y+=12;doc.font('Helvetica').fontSize(9).fillColor([60,60,60]).text([e.institution,e.year].filter(Boolean).join(' | '),L,y,{width:W});y+=11;y+=4;}}
  if(d.experience?.length){sec('Work Experience');for(const e of d.experience){cp();doc.font('Helvetica-Bold').fontSize(10).fillColor([0,0,0]).text(`${e.role||''}${e.company?' | '+e.company:''}`,L,y,{width:W});y+=12;if(e.duration){doc.font('Helvetica').fontSize(8.5).fillColor([100,100,100]).text(e.duration,L,y);y+=11;}if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=6;}}
  if(d.skills?.length){sec('Skills');doc.font('Helvetica').fontSize(9.5).fillColor([0,0,0]);const h=doc.heightOfString(d.skills.join('  •  '),{width:W});doc.text(d.skills.join('  •  '),L,y,{width:W});y+=h+8;}
  if(d.projects?.length){sec('Projects');for(const p of d.projects){cp();doc.font('Helvetica-Bold').fontSize(9.5).fillColor([0,0,0]).text(`${p.name||''}${p.tech?' | '+p.tech:''}`,L,y,{width:W});y+=12;if(p.description)bul(p.description);y+=4;}}
  if(d.achievements?.length){sec('Achievements');for(const a of d.achievements)bul(a);}
}

// STYLE 7: Teal Split — Name left + contact right, teal section titles, dotted lines
function renderStyle7(doc,d,W,L){
  let y=40;const cp=()=>{if(y>730){doc.addPage();y=40;}};
  doc.font('Helvetica-Bold').fontSize(18).fillColor([0,128,128]).text(d.name.toUpperCase(),L,y,{width:W*0.5,characterSpacing:1});
  if(d.contact.length){doc.font('Helvetica').fontSize(8).fillColor([80,80,80]).text(d.contact.join('\n'),L+W*0.5,y,{width:W*0.5,align:'right',lineGap:2});}
  y+=Math.max(24,d.contact.length*11+4);
  doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,128,128]).lineWidth(0.5).stroke();y+=14;
  const sec=(t)=>{cp();y+=10;doc.font('Helvetica-Bold').fontSize(10).fillColor([0,128,128]).text(t.toUpperCase(),L,y,{width:W});y+=13;doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,128,128]).lineWidth(0.3).dash(2,{space:1}).stroke();doc.undash();y+=8;};
  const bul=(t)=>{cp();doc.font('Helvetica').fontSize(9.3).fillColor([0,0,0]).text('–',L+8,y);const h=doc.heightOfString(t,{width:W-20});doc.text(t,L+18,y,{width:W-20});y+=h+3;};
  if(d.summary){sec('Professional Summary');doc.font('Helvetica').fontSize(9.3).fillColor([20,20,20]);const h=doc.heightOfString(d.summary,{width:W});doc.text(d.summary,L,y,{width:W});y+=h+8;}
  if(d.experience?.length){sec('Work Experience');for(const e of d.experience){cp();doc.font('Helvetica-Bold').fontSize(9.5).fillColor([0,0,0]).text(`${e.role||''}${e.company?' | '+e.company:''}`,L,y,{width:W*0.7});if(e.duration)doc.font('Helvetica').fontSize(8.5).fillColor([0,128,128]).text(e.duration,L,y,{width:W,align:'right'});y+=13;if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=6;}}
  if(d.education?.length){sec('Education');for(const e of d.education){cp();doc.font('Helvetica-Bold').fontSize(9.5).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W*0.7});if(e.year)doc.font('Helvetica').fontSize(8.5).fillColor([0,128,128]).text(e.year,L,y,{width:W,align:'right'});y+=12;if(e.institution){doc.font('Helvetica').fontSize(9).fillColor([60,60,60]).text(e.institution,L,y);y+=11;}y+=4;}}
  if(d.skills?.length){sec('Expert Skills');doc.font('Helvetica').fontSize(9.3).fillColor([0,0,0]);const h=doc.heightOfString(d.skills.join('  |  '),{width:W});doc.text(d.skills.join('  |  '),L,y,{width:W});y+=h+8;}
  if(d.projects?.length){sec('Projects');for(const p of d.projects){cp();doc.font('Helvetica-Bold').fontSize(9.3).fillColor([0,0,0]).text(`${p.name||''}${p.tech?' ('+p.tech+')':''}`,L,y,{width:W});y+=12;if(p.description)bul(p.description);y+=4;}}
  if(d.achievements?.length){sec('Achievements');for(const a of d.achievements)bul(a);}
  if(d.certifications?.length){sec('Certifications');for(const c of d.certifications)bul(c);}
}

// STYLE 8: Patricia Bold — Large colored name with thick underline, colored section titles, serif body
function renderStyle8(doc,d,W,L){
  let y=45;const cp=()=>{if(y>730){doc.addPage();y=40;}};
  doc.font('Times-Bold').fontSize(28).fillColor([150,30,60]).text(d.name.toUpperCase(),L,y,{width:W,align:'center'});y+=34;
  doc.moveTo(L,y).lineTo(L+W,y).strokeColor([150,30,60]).lineWidth(1.5).stroke();y+=8;
  if(d.contact.length){doc.font('Times-Roman').fontSize(9).fillColor([60,60,60]).text(d.contact.join('  |  '),L,y,{width:W,align:'center'});y+=14;}
  y+=4;
  const sec=(t)=>{cp();y+=12;doc.font('Times-Bold').fontSize(13).fillColor([150,30,60]).text(t,L,y,{width:W});y+=4;doc.moveTo(L,y+12).lineTo(L+W,y+12).strokeColor([150,30,60]).lineWidth(0.5).stroke();y+=20;};
  const bul=(t)=>{cp();doc.font('Times-Roman').fontSize(10).fillColor([0,0,0]).text('•',L+10,y);const h=doc.heightOfString(t,{width:W-24});doc.text(t,L+22,y,{width:W-24});y+=h+4;};
  if(d.summary){doc.font('Times-Roman').fontSize(10.5).fillColor([30,30,30]);const h=doc.heightOfString(d.summary,{width:W});doc.text(d.summary,L,y,{width:W});y+=h+10;}
  if(d.skills?.length){sec('Skills');doc.font('Times-Roman').fontSize(10).fillColor([0,0,0]);const h=doc.heightOfString(d.skills.join('  •  '),{width:W});doc.text(d.skills.join('  •  '),L,y,{width:W});y+=h+8;}
  if(d.experience?.length){sec('Professional Experience');for(const e of d.experience){cp();doc.font('Times-Bold').fontSize(10.5).fillColor([0,0,0]).text(`${e.role||''} at ${e.company||''} (${e.duration||''})`,L,y,{width:W});y+=14;if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=8;}}
  if(d.education?.length){sec('Education');for(const e of d.education){cp();doc.font('Times-Bold').fontSize(10.5).fillColor([0,0,0]).text(e.degree||'',L,y,{width:W});y+=13;doc.font('Times-Roman').fontSize(9.5).fillColor([60,60,60]).text([e.institution,e.year].filter(Boolean).join(' — '),L,y,{width:W});y+=12;y+=4;}}
  if(d.projects?.length){sec('Projects');for(const p of d.projects){cp();doc.font('Times-Bold').fontSize(10).fillColor([0,0,0]).text(p.name||'',L,y,{width:W});y+=12;if(p.description)bul(p.description);y+=4;}}
  if(d.achievements?.length){sec('Achievements');for(const a of d.achievements)bul(a);}
}

// STYLE 9: Dense Professional — Bold left name, experience-first, dense content, compact
function renderStyle9(doc,d,W,L){
  let y=40;const cp=()=>{if(y>730){doc.addPage();y=40;}};
  doc.font('Helvetica-Bold').fontSize(18).fillColor([0,0,0]).text(d.name,L,y,{width:W});y+=22;
  if(d.contact.length){doc.font('Helvetica').fontSize(8).fillColor([60,60,60]).text(d.contact.join(' | '),L,y,{width:W});y+=11;}
  doc.moveTo(L,y).lineTo(L+W,y).strokeColor([0,0,0]).lineWidth(0.8).stroke();y+=10;
  const sec=(t)=>{cp();y+=6;doc.font('Helvetica-Bold').fontSize(9.5).fillColor([0,0,0]).text(t.toUpperCase(),L,y,{width:W});y+=2;doc.moveTo(L,y+9).lineTo(L+W,y+9).strokeColor([0,0,0]).lineWidth(0.5).stroke();y+=14;};
  const bul=(t)=>{cp();doc.font('Helvetica').fontSize(9).fillColor([0,0,0]).text('•',L+6,y);const h=doc.heightOfString(t,{width:W-16});doc.text(t,L+14,y,{width:W-16});y+=h+2;};
  // Experience first
  if(d.experience?.length){sec('Experience');for(const e of d.experience){cp();doc.font('Helvetica-Bold').fontSize(9.5).fillColor([0,0,0]).text(e.company||'',L,y,{width:W*0.55});doc.font('Helvetica-Bold').fontSize(8.5).fillColor([0,0,0]).text(e.duration||'',L,y,{width:W,align:'right'});y+=12;doc.font('Helvetica').fontSize(9).fillColor([40,40,40]).text(e.role||'',L,y,{width:W});y+=11;if(e.bullets)for(const b of e.bullets){if(b)bul(b);}y+=5;}}
  if(d.education?.length){sec('Education');for(const e of d.education){cp();doc.font('Helvetica-Bold').fontSize(9.5).fillColor([0,0,0]).text(e.institution||'',L,y,{width:W*0.6});if(e.year)doc.font('Helvetica-Bold').fontSize(8.5).text(e.year,L,y,{width:W,align:'right'});y+=12;doc.font('Helvetica').fontSize(9).fillColor([40,40,40]).text(`${e.degree||''}${e.details?' — '+e.details:''}`,L,y,{width:W});y+=11;y+=4;}}
  if(d.skills?.length||d.certifications?.length){sec('Other');if(d.skills?.length){doc.font('Helvetica-Bold').fontSize(8.5).text('Technical Skills: ',L,y,{continued:true});doc.font('Helvetica').fontSize(8.5).fillColor([0,0,0]).text(d.skills.join(', '));y+=doc.heightOfString(d.skills.join(', '),{width:W})+4;}if(d.certifications?.length){doc.font('Helvetica-Bold').fontSize(8.5).text('Certifications: ',L,y,{continued:true});doc.font('Helvetica').text(d.certifications.join(', '));y+=14;}}
  if(d.projects?.length){sec('Projects');for(const p of d.projects){cp();doc.font('Helvetica-Bold').fontSize(9).fillColor([0,0,0]).text(p.name||'',L,y,{width:W});y+=11;if(p.description)bul(p.description);y+=3;}}
  if(d.achievements?.length){for(const a of d.achievements)bul(a);}
}

module.exports = { buildResumePdf };
