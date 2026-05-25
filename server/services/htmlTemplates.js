'use strict';

// 34 unique template configurations for ATS-friendly resume PDFs
const CONFIGS = [
  // fmt 1
  { nameFont:'Arial', nameSize:'22px', nameAlign:'center', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'\u2022', contactAlign:'center', contactFont:'Arial', contactSize:'11px',
    headerSeparator:'thin', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Arial', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-thin', bulletSymbol:'\u2022', bulletIndent:'14px',
    bodyFont:'Arial', bodySize:'9px', lineHeight:'1.4', sectionOrder:'A', topBorderFirst:false },
  // fmt 2
  { nameFont:'Arial', nameSize:'22px', nameAlign:'center', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'\u2022', contactAlign:'center', contactFont:'Arial', contactSize:'11px',
    headerSeparator:'thick', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Arial', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-thin', bulletSymbol:'\u2022', bulletIndent:'14px',
    bodyFont:'Arial', bodySize:'9px', lineHeight:'1.4', sectionOrder:'A', topBorderFirst:false },
  // fmt 3
  { nameFont:'Arial', nameSize:'22px', nameAlign:'center', nameTransform:'uppercase', nameLetterSpacing:'2px',
    contactSeparator:'\u2022', contactAlign:'center', contactFont:'Arial', contactSize:'11px',
    headerSeparator:'double', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Arial', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-thin', bulletSymbol:'\u2022', bulletIndent:'14px',
    bodyFont:'Arial', bodySize:'9px', lineHeight:'1.4', sectionOrder:'A', topBorderFirst:false },
  // fmt 4
  { nameFont:'Arial', nameSize:'24px', nameAlign:'center', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'|', contactAlign:'center', contactFont:'Arial', contactSize:'12px',
    headerSeparator:'none', headerSepColor:'#333333', pagePadding:'40px 50px',
    sectionTitleFont:'Arial', sectionTitleSize:'12px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-thin', bulletSymbol:'\u2022', bulletIndent:'14px',
    bodyFont:'Arial', bodySize:'9px', lineHeight:'1.5', sectionOrder:'A', topBorderFirst:false },
  // fmt 5
  { nameFont:'Arial', nameSize:'22px', nameAlign:'center', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'\u2022', contactAlign:'center', contactFont:'Arial', contactSize:'11px',
    headerSeparator:'dashed', headerSepColor:'#555555', pagePadding:'36px 45px',
    sectionTitleFont:'Arial', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-thin', bulletSymbol:'\u2022', bulletIndent:'14px',
    bodyFont:'Arial', bodySize:'9px', lineHeight:'1.4', sectionOrder:'A', topBorderFirst:false },
  // fmt 6
  { nameFont:'Arial', nameSize:'22px', nameAlign:'center', nameTransform:'none', nameLetterSpacing:'1px',
    contactSeparator:'\u00B7', contactAlign:'center', contactFont:'Arial', contactSize:'11px',
    headerSeparator:'short-center', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Arial', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-thin', bulletSymbol:'\u2022', bulletIndent:'14px',
    bodyFont:'Arial', bodySize:'9px', lineHeight:'1.4', sectionOrder:'A', topBorderFirst:false },
  // fmt 7
  { nameFont:'Arial', nameSize:'22px', nameAlign:'left', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'|', contactAlign:'left', contactFont:'Arial', contactSize:'11px',
    headerSeparator:'thin', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Arial', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'no-line', bulletSymbol:'\u2013', bulletIndent:'16px',
    bodyFont:'Arial', bodySize:'9.5px', lineHeight:'1.4', sectionOrder:'B', topBorderFirst:false },
  // fmt 8
  { nameFont:'Arial', nameSize:'22px', nameAlign:'left', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'|', contactAlign:'left', contactFont:'Arial', contactSize:'11px',
    headerSeparator:'thick', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Arial', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'no-line', bulletSymbol:'\u2013', bulletIndent:'16px',
    bodyFont:'Arial', bodySize:'9.5px', lineHeight:'1.4', sectionOrder:'B', topBorderFirst:false },
  // fmt 9
  { nameFont:'Arial', nameSize:'24px', nameAlign:'left', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'|', contactAlign:'left', contactFont:'Arial', contactSize:'12px',
    headerSeparator:'dashed', headerSepColor:'#555555', pagePadding:'44px 55px',
    sectionTitleFont:'Arial', sectionTitleSize:'12px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'no-line', bulletSymbol:'\u2013', bulletIndent:'16px',
    bodyFont:'Arial', bodySize:'9.5px', lineHeight:'1.5', sectionOrder:'B', topBorderFirst:false },
  // fmt 10
  { nameFont:'Arial', nameSize:'20px', nameAlign:'left', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'|', contactAlign:'left', contactFont:'Arial', contactSize:'11px',
    headerSeparator:'short-left', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Arial', sectionTitleSize:'11px', sectionTitleTransform:'capitalize',
    sectionTitleStyle:'no-line', bulletSymbol:'\u2013', bulletIndent:'18px',
    bodyFont:'Arial', bodySize:'10px', lineHeight:'1.4', sectionOrder:'B', topBorderFirst:false },
  // fmt 11
  { nameFont:'Arial', nameSize:'22px', nameAlign:'left', nameTransform:'uppercase', nameLetterSpacing:'3px',
    contactSeparator:'\u2022', contactAlign:'left', contactFont:'Arial', contactSize:'11px',
    headerSeparator:'none', headerSepColor:'#333333', pagePadding:'36px 45px',
    sectionTitleFont:'Arial', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'no-line', bulletSymbol:'\u2013', bulletIndent:'16px',
    bodyFont:'Arial', bodySize:'9.5px', lineHeight:'1.3', sectionOrder:'B', topBorderFirst:false },
  // fmt 12
  { nameFont:'Georgia', nameSize:'24px', nameAlign:'center', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'|', contactAlign:'center', contactFont:'Georgia', contactSize:'11px',
    headerSeparator:'thin', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Georgia', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-dashed', bulletSymbol:'\u25B8', bulletIndent:'14px',
    bodyFont:'Georgia', bodySize:'10px', lineHeight:'1.4', sectionOrder:'B', topBorderFirst:false },
  // fmt 13
  { nameFont:'Georgia', nameSize:'20px', nameAlign:'center', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'|', contactAlign:'center', contactFont:'Georgia', contactSize:'11px',
    headerSeparator:'thick', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Georgia', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-dashed', bulletSymbol:'\u25B8', bulletIndent:'14px',
    bodyFont:'Georgia', bodySize:'10px', lineHeight:'1.4', sectionOrder:'B', topBorderFirst:false },
  // fmt 14
  { nameFont:'Georgia', nameSize:'26px', nameAlign:'center', nameTransform:'uppercase', nameLetterSpacing:'2px',
    contactSeparator:'|', contactAlign:'center', contactFont:'Georgia', contactSize:'12px',
    headerSeparator:'double', headerSepColor:'#000000', pagePadding:'44px 55px',
    sectionTitleFont:'Georgia', sectionTitleSize:'12px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-dashed', bulletSymbol:'\u25B8', bulletIndent:'14px',
    bodyFont:'Georgia', bodySize:'10px', lineHeight:'1.5', sectionOrder:'B', topBorderFirst:false },
  // fmt 15
  { nameFont:'Georgia', nameSize:'22px', nameAlign:'center', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'\u2022', contactAlign:'center', contactFont:'Georgia', contactSize:'11px',
    headerSeparator:'dashed', headerSepColor:'#555555', pagePadding:'40px 50px',
    sectionTitleFont:'Georgia', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-dashed', bulletSymbol:'\u25B8', bulletIndent:'14px',
    bodyFont:'Georgia', bodySize:'10px', lineHeight:'1.4', sectionOrder:'B', topBorderFirst:false },
  // fmt 16
  { nameFont:'Georgia', nameSize:'20px', nameAlign:'center', nameTransform:'none', nameLetterSpacing:'1px',
    contactSeparator:'\u00B7', contactAlign:'center', contactFont:'Georgia', contactSize:'11px',
    headerSeparator:'short-center', headerSepColor:'#000000', pagePadding:'36px 45px',
    sectionTitleFont:'Georgia', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-dashed', bulletSymbol:'\u25B8', bulletIndent:'14px',
    bodyFont:'Georgia', bodySize:'10px', lineHeight:'1.4', sectionOrder:'B', topBorderFirst:false },
  // fmt 17
  { nameFont:'Georgia', nameSize:'24px', nameAlign:'center', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:' / ', contactAlign:'center', contactFont:'Georgia', contactSize:'12px',
    headerSeparator:'none', headerSepColor:'#333333', pagePadding:'44px 55px',
    sectionTitleFont:'Georgia', sectionTitleSize:'12px', sectionTitleTransform:'capitalize',
    sectionTitleStyle:'underline-dashed', bulletSymbol:'\u25B8', bulletIndent:'14px',
    bodyFont:'Georgia', bodySize:'10px', lineHeight:'1.5', sectionOrder:'B', topBorderFirst:false },
  // fmt 18
  { nameFont:'Georgia', nameSize:'20px', nameAlign:'left', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'|', contactAlign:'right', contactFont:'Georgia', contactSize:'11px',
    headerSeparator:'thin', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Georgia', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-thick', bulletSymbol:'\u203A', bulletIndent:'14px',
    bodyFont:'Georgia', bodySize:'9.5px', lineHeight:'1.4', sectionOrder:'C', topBorderFirst:false, contactRight:true },
  // fmt 19
  { nameFont:'Georgia', nameSize:'20px', nameAlign:'left', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'|', contactAlign:'right', contactFont:'Georgia', contactSize:'11px',
    headerSeparator:'thick', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Georgia', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-thick', bulletSymbol:'\u203A', bulletIndent:'14px',
    bodyFont:'Georgia', bodySize:'9.5px', lineHeight:'1.4', sectionOrder:'C', topBorderFirst:false, contactRight:true },
  // fmt 20
  { nameFont:'Georgia', nameSize:'22px', nameAlign:'left', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'\u2022', contactAlign:'right', contactFont:'Georgia', contactSize:'12px',
    headerSeparator:'dashed', headerSepColor:'#555555', pagePadding:'44px 55px',
    sectionTitleFont:'Georgia', sectionTitleSize:'12px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-thick', bulletSymbol:'\u203A', bulletIndent:'14px',
    bodyFont:'Georgia', bodySize:'9.5px', lineHeight:'1.5', sectionOrder:'C', topBorderFirst:false, contactRight:true },
  // fmt 21
  { nameFont:'Georgia', nameSize:'20px', nameAlign:'left', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'|', contactAlign:'right', contactFont:'Georgia', contactSize:'11px',
    headerSeparator:'double', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Georgia', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-thick', bulletSymbol:'\u203A', bulletIndent:'14px',
    bodyFont:'Georgia', bodySize:'9.5px', lineHeight:'1.4', sectionOrder:'C', topBorderFirst:false, contactRight:true },
  // fmt 22
  { nameFont:'Georgia', nameSize:'20px', nameAlign:'left', nameTransform:'none', nameLetterSpacing:'1px',
    contactSeparator:'\u00B7', contactAlign:'right', contactFont:'Georgia', contactSize:'11px',
    headerSeparator:'short-left', headerSepColor:'#000000', pagePadding:'36px 45px',
    sectionTitleFont:'Georgia', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-thick', bulletSymbol:'\u203A', bulletIndent:'14px',
    bodyFont:'Georgia', bodySize:'9.5px', lineHeight:'1.4', sectionOrder:'C', topBorderFirst:false, contactRight:true },
  // fmt 23
  { nameFont:'Courier New', nameSize:'18px', nameAlign:'left', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'|', contactAlign:'right', contactFont:'Courier New', contactSize:'11px',
    headerSeparator:'thin', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Courier New', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-short', bulletSymbol:'\u25E6', bulletIndent:'16px',
    bodyFont:'Courier New', bodySize:'9px', lineHeight:'1.4', sectionOrder:'C', topBorderFirst:false, contactRight:true },
  // fmt 24
  { nameFont:'Courier New', nameSize:'18px', nameAlign:'left', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'|', contactAlign:'right', contactFont:'Courier New', contactSize:'11px',
    headerSeparator:'thick', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Courier New', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-short', bulletSymbol:'\u25E6', bulletIndent:'16px',
    bodyFont:'Courier New', bodySize:'9px', lineHeight:'1.4', sectionOrder:'C', topBorderFirst:false, contactRight:true },
  // fmt 25
  { nameFont:'Courier New', nameSize:'18px', nameAlign:'left', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'|', contactAlign:'right', contactFont:'Courier New', contactSize:'11px',
    headerSeparator:'dashed', headerSepColor:'#555555', pagePadding:'44px 55px',
    sectionTitleFont:'Courier New', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-short', bulletSymbol:'\u25E6', bulletIndent:'16px',
    bodyFont:'Courier New', bodySize:'9px', lineHeight:'1.5', sectionOrder:'C', topBorderFirst:false, contactRight:true },
  // fmt 26
  { nameFont:'Courier New', nameSize:'18px', nameAlign:'left', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'\u2022', contactAlign:'right', contactFont:'Courier New', contactSize:'11px',
    headerSeparator:'double', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Courier New', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-short', bulletSymbol:'\u25E6', bulletIndent:'16px',
    bodyFont:'Courier New', bodySize:'9px', lineHeight:'1.4', sectionOrder:'C', topBorderFirst:false, contactRight:true },
  // fmt 27
  { nameFont:'Courier New', nameSize:'20px', nameAlign:'left', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'|', contactAlign:'right', contactFont:'Courier New', contactSize:'11px',
    headerSeparator:'short-left', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Courier New', sectionTitleSize:'12px', sectionTitleTransform:'capitalize',
    sectionTitleStyle:'underline-short', bulletSymbol:'\u25E6', bulletIndent:'18px',
    bodyFont:'Courier New', bodySize:'9.5px', lineHeight:'1.4', sectionOrder:'C', topBorderFirst:false, contactRight:true },
  // fmt 28
  { nameFont:'Courier New', nameSize:'18px', nameAlign:'left', nameTransform:'uppercase', nameLetterSpacing:'2px',
    contactSeparator:'|', contactAlign:'right', contactFont:'Courier New', contactSize:'11px',
    headerSeparator:'none', headerSepColor:'#333333', pagePadding:'36px 45px',
    sectionTitleFont:'Courier New', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'underline-short', bulletSymbol:'\u25E6', bulletIndent:'16px',
    bodyFont:'Courier New', bodySize:'9px', lineHeight:'1.3', sectionOrder:'C', topBorderFirst:false, contactRight:true },
  // fmt 29
  { nameFont:'Arial', nameSize:'20px', nameAlign:'center', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'\u2022', contactAlign:'center', contactFont:'Arial', contactSize:'11px',
    headerSeparator:'none', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Arial', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'left-border', bulletSymbol:'*', bulletIndent:'14px',
    bodyFont:'Arial', bodySize:'9px', lineHeight:'1.4', sectionOrder:'D', topBorderFirst:{width:'2px',style:'solid'} },
  // fmt 30
  { nameFont:'Georgia', nameSize:'22px', nameAlign:'left', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'|', contactAlign:'left', contactFont:'Georgia', contactSize:'11px',
    headerSeparator:'none', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Georgia', sectionTitleSize:'12px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'left-border', bulletSymbol:'*', bulletIndent:'14px',
    bodyFont:'Georgia', bodySize:'9.5px', lineHeight:'1.4', sectionOrder:'D', topBorderFirst:{width:'1px',style:'solid'} },
  // fmt 31
  { nameFont:'Courier New', nameSize:'18px', nameAlign:'left', nameTransform:'uppercase', nameLetterSpacing:'2px',
    contactSeparator:'|', contactAlign:'left', contactFont:'Courier New', contactSize:'11px',
    headerSeparator:'none', headerSepColor:'#000000', pagePadding:'36px 45px',
    sectionTitleFont:'Courier New', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'left-border', bulletSymbol:'*', bulletIndent:'16px',
    bodyFont:'Courier New', bodySize:'9px', lineHeight:'1.4', sectionOrder:'D', topBorderFirst:{width:'3px',style:'solid'} },
  // fmt 32
  { nameFont:'Arial', nameSize:'20px', nameAlign:'center', nameTransform:'none', nameLetterSpacing:'1px',
    contactSeparator:'\u2022', contactAlign:'center', contactFont:'Arial', contactSize:'11px',
    headerSeparator:'sandwiched', headerSepColor:'#000000', pagePadding:'40px 50px',
    sectionTitleFont:'Arial', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'bg-light', bulletSymbol:'\u2192', bulletIndent:'14px',
    bodyFont:'Arial', bodySize:'9px', lineHeight:'1.5', sectionOrder:'D', topBorderFirst:{width:'1px',style:'solid'} },
  // fmt 33
  { nameFont:'Georgia', nameSize:'24px', nameAlign:'left', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'\u2022', contactAlign:'left', contactFont:'Georgia', contactSize:'12px',
    headerSeparator:'none', headerSepColor:'#000000', pagePadding:'44px 55px',
    sectionTitleFont:'Georgia', sectionTitleSize:'12px', sectionTitleTransform:'capitalize',
    sectionTitleStyle:'double-underline', bulletSymbol:'\u2192', bulletIndent:'14px',
    bodyFont:'Georgia', bodySize:'10px', lineHeight:'1.4', sectionOrder:'D', topBorderFirst:{width:'1.5px',style:'solid'} },
  // fmt 34
  { nameFont:'Courier New', nameSize:'18px', nameAlign:'left', nameTransform:'none', nameLetterSpacing:'0',
    contactSeparator:'|', contactAlign:'left', contactFont:'Courier New', contactSize:'11px',
    headerSeparator:'none', headerSepColor:'#000000', pagePadding:'36px 45px',
    sectionTitleFont:'Courier New', sectionTitleSize:'11px', sectionTitleTransform:'uppercase',
    sectionTitleStyle:'double-underline', bulletSymbol:'\u2192', bulletIndent:'18px',
    bodyFont:'Courier New', bodySize:'9px', lineHeight:'1.4', sectionOrder:'D', topBorderFirst:{width:'1px',style:'dashed'} },
];

const SECTION_ORDERS = {
  A: ['summary','skills','experience','projects','education','achievements'],
  B: ['summary','experience','skills','projects','education','achievements'],
  C: ['summary','experience','projects','skills','education','achievements'],
  D: ['experience','summary','skills','projects','education','achievements'],
};

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getTopBorderClass(tb) {
  if (!tb) return '';
  const w = tb.width.replace('px','').replace('.','');
  return `top-border-${tb.style}-${w}`;
}

function getSepHtml(sep) {
  if (!sep || sep === 'none') return '';
  const map = {
    'thin': '<div class="sep-thin"></div>',
    'thick': '<div class="sep-thick"></div>',
    'double': '<div class="sep-double"></div>',
    'dashed': '<div class="sep-dashed"></div>',
    'short-center': '<div class="sep-short-center"></div>',
    'short-left': '<div class="sep-short-left"></div>',
    'sandwiched': '<div class="sep-sandwiched"></div>',
  };
  return map[sep] || '';
}

function getTitleStyleClass(style) {
  const map = {
    'underline-thin': 'style-underline-thin',
    'underline-thick': 'style-underline-thick',
    'underline-dashed': 'style-underline-dashed',
    'underline-short': 'style-underline-short',
    'no-line': 'style-no-line',
    'bg-light': 'style-bg-light',
    'left-border': 'style-left-border',
    'double-underline': 'style-double-underline',
  };
  return map[style] || 'style-no-line';
}

function renderHeader(data, cfg) {
  const contact = [data.phone, data.email, data.location, data.linkedin, data.github].filter(Boolean);
  const contactStr = contact.map(c => esc(c)).join(` <span class="sep-char">${esc(cfg.contactSeparator)}</span> `);

  if (cfg.contactRight) {
    return `<div class="header-split">
      <div class="name">${esc(data.name || 'Candidate')}</div>
      <div class="contact">${contact.map(c => esc(c)).join('<br>')}</div>
    </div>`;
  }
  return `<div class="name">${esc(data.name || 'Candidate')}</div>
    <div class="contact">${contactStr}</div>`;
}

function renderSummary(data, cfg) {
  if (!data.summary) return '';
  const cls = getTitleStyleClass(cfg.sectionTitleStyle);
  return `<div class="section">
    <div class="sec-title ${cls}">Professional Summary</div>
    <p class="body-text">${esc(data.summary)}</p>
  </div>`;
}

function renderSkills(data, cfg) {
  if (!data.skills || !data.skills.length) return '';
  const cls = getTitleStyleClass(cfg.sectionTitleStyle);
  return `<div class="section">
    <div class="sec-title ${cls}">Skills</div>
    <p class="skills-text">${data.skills.map(s => esc(s)).join(` ${esc(cfg.contactSeparator)} `)}</p>
  </div>`;
}

function renderExperience(data, cfg) {
  if (!data.experience || !data.experience.length) return '';
  const cls = getTitleStyleClass(cfg.sectionTitleStyle);
  let html = `<div class="section">
    <div class="sec-title ${cls}">Experience</div>`;
  for (const exp of data.experience) {
    html += `<div class="role-row">
      <span class="role-title">${esc(exp.role || '')}${exp.company ? ' | ' + esc(exp.company) : ''}</span>
      <span class="role-date">${esc(exp.duration || '')}</span>
    </div>`;
    if (exp.bullets && exp.bullets.length) {
      for (const b of exp.bullets) {
        if (b) html += `<div class="bullet"><span class="bullet-sym">${esc(cfg.bulletSymbol)}</span><span class="bullet-text">${esc(b)}</span></div>`;
      }
    }
  }
  html += '</div>';
  return html;
}

function renderProjects(data, cfg) {
  if (!data.projects || !data.projects.length) return '';
  const cls = getTitleStyleClass(cfg.sectionTitleStyle);
  let html = `<div class="section">
    <div class="sec-title ${cls}">Projects</div>`;
  for (const p of data.projects) {
    html += `<div class="role-row">
      <span class="role-title">${esc(p.name || '')}${p.tech ? ' | ' + esc(p.tech) : ''}</span>
    </div>`;
    if (p.description) {
      html += `<div class="bullet"><span class="bullet-sym">${esc(cfg.bulletSymbol)}</span><span class="bullet-text">${esc(p.description)}</span></div>`;
    }
  }
  html += '</div>';
  return html;
}

function renderEducation(data, cfg) {
  if (!data.education || !data.education.length) return '';
  const cls = getTitleStyleClass(cfg.sectionTitleStyle);
  let html = `<div class="section">
    <div class="sec-title ${cls}">Education</div>`;
  for (const edu of data.education) {
    html += `<div class="role-row">
      <span class="role-title">${esc(edu.degree || '')}</span>
      <span class="role-date">${esc(edu.year || '')}</span>
    </div>`;
    if (edu.institution) html += `<div class="company">${esc(edu.institution)}</div>`;
    if (edu.details) html += `<div class="bullet"><span class="bullet-sym">${esc(cfg.bulletSymbol)}</span><span class="bullet-text">${esc(edu.details)}</span></div>`;
  }
  html += '</div>';
  return html;
}

function renderAchievements(data, cfg) {
  if (!data.achievements || !data.achievements.length) return '';
  const cls = getTitleStyleClass(cfg.sectionTitleStyle);
  let html = `<div class="section">
    <div class="sec-title ${cls}">Achievements</div>`;
  for (const a of data.achievements) {
    if (a) html += `<div class="bullet"><span class="bullet-sym">${esc(cfg.bulletSymbol)}</span><span class="bullet-text">${esc(a)}</span></div>`;
  }
  html += '</div>';
  return html;
}

function generateHtml(data, fmt) {
  const cfg = CONFIGS[fmt - 1] || CONFIGS[0];
  const order = SECTION_ORDERS[cfg.sectionOrder] || SECTION_ORDERS.A;

  const renderers = {
    summary: () => renderSummary(data, cfg),
    skills: () => renderSkills(data, cfg),
    experience: () => renderExperience(data, cfg),
    projects: () => renderProjects(data, cfg),
    education: () => renderEducation(data, cfg),
    achievements: () => renderAchievements(data, cfg),
  };

  const topBorderClass = cfg.topBorderFirst ? getTopBorderClass(cfg.topBorderFirst) : '';
  const headerHtml = renderHeader(data, cfg);
  const sepHtml = getSepHtml(cfg.headerSeparator);
  const sectionsHtml = order.map(s => renderers[s]()).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
  font-family: '${cfg.bodyFont}', sans-serif;
  font-size: ${cfg.bodySize};
  line-height: ${cfg.lineHeight};
  color: #111;
  padding: ${cfg.pagePadding};
  width: 210mm;
  min-height: 297mm;
}
.name {
  font-family: '${cfg.nameFont}', sans-serif;
  font-size: ${cfg.nameSize};
  font-weight: bold;
  text-align: ${cfg.nameAlign};
  text-transform: ${cfg.nameTransform};
  letter-spacing: ${cfg.nameLetterSpacing || '0'};
  color: #000;
  margin-bottom: 4px;
}
.contact {
  font-family: '${cfg.contactFont}', sans-serif;
  font-size: ${cfg.contactSize};
  text-align: ${cfg.contactAlign};
  color: #333;
  margin-bottom: 8px;
}
.sep-char { margin: 0 4px; }
.sep-thin    { border-bottom: 0.5px solid ${cfg.headerSepColor}; margin-bottom: 12px; }
.sep-thick   { border-bottom: 2px solid ${cfg.headerSepColor}; margin-bottom: 12px; }
.sep-double  { border-bottom: 3px double ${cfg.headerSepColor}; margin-bottom: 12px; }
.sep-dashed  { border-bottom: 1px dashed ${cfg.headerSepColor}; margin-bottom: 12px; }
.sep-short-center { width:80px; margin:0 auto 12px; border-bottom:1px solid ${cfg.headerSepColor}; }
.sep-short-left   { width:60px; margin-bottom:12px; border-bottom:1.5px solid ${cfg.headerSepColor}; }
.sep-sandwiched   { border-top:0.5px solid ${cfg.headerSepColor}; border-bottom:0.5px solid ${cfg.headerSepColor}; padding:4px 0; margin-bottom:12px; }

.top-border-solid-1  { border-top: 1px solid #000; padding-top: 10px; margin-bottom:6px; }
.top-border-solid-2  { border-top: 2px solid #000; padding-top: 10px; margin-bottom:6px; }
.top-border-solid-3  { border-top: 3px solid #000; padding-top: 10px; margin-bottom:6px; }
.top-border-solid-15 { border-top: 1.5px solid #000; padding-top: 10px; margin-bottom:6px; }
.top-border-dashed-1 { border-top: 1px dashed #000; padding-top: 10px; margin-bottom:6px; }

.sec-title {
  font-family: '${cfg.sectionTitleFont}', sans-serif;
  font-size: ${cfg.sectionTitleSize};
  font-weight: bold;
  text-transform: ${cfg.sectionTitleTransform};
  color: #000;
  margin-top: 14px;
  margin-bottom: 6px;
}
.style-underline-thin   { border-bottom: 1px solid #000; padding-bottom: 2px; }
.style-underline-thick  { border-bottom: 2px solid #000; padding-bottom: 2px; }
.style-underline-dashed { border-bottom: 1px dashed #555; padding-bottom: 2px; }
.style-underline-short  { display:block; }
.style-underline-short::after { content:''; display:block; width:60px; border-bottom:1px solid #000; margin-top:2px; }
.style-no-line          { padding-bottom: 4px; }
.style-bg-light         { background:#f0f0f0; padding:3px 8px; }
.style-left-border      { border-left: 3px solid #333; padding-left: 8px; }
.style-double-underline { box-shadow: 0 3px 0 #000, 0 5px 0 #999; padding-bottom:7px; margin-bottom:10px; }
.header-split { display:flex; justify-content:space-between; align-items:flex-start; }
.header-split .name { text-align:left; }
.header-split .contact { text-align:right; font-size:10px; line-height:1.6; }

.role-row { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:3px; }
.role-title { font-weight:bold; font-size:9.5px; }
.role-date  { font-size:8.5px; color:#444; white-space:nowrap; }
.company    { font-size:8.5px; color:#333; margin-bottom:4px; }

.bullet { display:flex; gap:6px; margin-bottom:3px; }
.bullet-sym { flex-shrink:0; padding-left:${cfg.bulletIndent}; }
.bullet-text { flex:1; }

.skills-text { margin-bottom:6px; }
.body-text { margin-bottom:8px; }

.section { page-break-inside: avoid; }

@media print {
  body { padding: 0; }
  @page { margin: 40px 50px; size: A4; }
}
</style>
</head>
<body>
${topBorderClass ? `<div class="${topBorderClass}">` : ''}
${headerHtml}
${sepHtml}
${sectionsHtml}
${topBorderClass ? '</div>' : ''}
</body>
</html>`;
}

module.exports = { generateHtml };
